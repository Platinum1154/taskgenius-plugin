const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");

function readLocale(name) {
  const source = fs.readFileSync(path.join("src/translations/locale", name + ".ts"), "utf8");
  return vm.runInNewContext(source.replace(/export default translations;?\s*$/, "") + ";translations");
}
function sourceKeys() {
  const keys = new Set();
  const rawUI = [];
  function visitDirectory(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!["__tests__", "__mocks__", "translations"].includes(entry.name)) visitDirectory(filename);
      } else if (/\.tsx?$/.test(entry.name)) {
        const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
        function visit(node) {
          if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["t", "translateUI"].includes(node.expression.text) && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) keys.add(node.arguments[0].text);
          if ((ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) && node.parent) {
            const parent = node.parent;
            let method = "";
            let visible = false;
            if (ts.isCallExpression(parent) && ts.isPropertyAccessExpression(parent.expression) && parent.arguments[0] === node) {
              method = parent.expression.name.text;
              visible = ["setName", "setDesc", "setTitle", "setText", "setButtonText", "setPlaceholder"].includes(method);
            }
            if (ts.isNewExpression(parent) && ts.isIdentifier(parent.expression) && parent.expression.text === "Notice" && parent.arguments?.[0] === node) visible = true;
            const text = ts.isTemplateExpression(node) ? node.head.text + node.templateSpans.map(span => span.literal.text).join("") : node.text;
            const codeExample = method === "setPlaceholder" && (!/\s/.test(text) || /^(https?:|[A-Za-z]+\/|YYYY|xxxx)/.test(text) || /\.md$|\\[wds]|\$\d/.test(text));
            if (visible && !codeExample && /[A-Za-z]{2}|[\u4e00-\u9fff]/.test(text)) rawUI.push(filename + ":" + (source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1) + ": " + JSON.stringify(text));
          }
          ts.forEachChild(node, visit);
        }
        visit(source);
      }
    }
  }
  visitDirectory("src");
  return { keys: [...keys].sort(), rawUI };
}
function placeholders(text) { return (text.match(/\{\{[^{}]+\}\}|\{[A-Za-z_][\w.-]*\}/g) || []).sort(); }
const en = readLocale("en"), zh = readLocale("zh-cn");
const scanned = sourceKeys();
const keys = [...new Set([...Object.keys(en), ...Object.keys(zh), ...scanned.keys])].sort();
const errors = scanned.rawUI.map(site => "Untranslated UI literal: " + site);
for (const key of keys) {
  for (const [locale, dictionary] of [["en", en], ["zh-cn", zh]]) {
    if (typeof dictionary[key] !== "string" || !dictionary[key].trim()) errors.push(locale + ": missing " + JSON.stringify(key));
    else if (JSON.stringify(placeholders(key)) !== JSON.stringify(placeholders(dictionary[key]))) errors.push(locale + ": placeholders differ for " + JSON.stringify(key));
  }
}
if (process.argv.includes("--report")) fs.writeFileSync("i18n-coverage.tmp.json", JSON.stringify({ keys, en, zh, missingChinese: keys.filter(key => typeof zh[key] !== "string"), errors }, null, 2));
if (errors.length) { console.error(errors.slice(0, 30).join("\n")); console.error(errors.length + " translation coverage errors"); process.exitCode = 1; }
else console.log("English and Simplified Chinese cover all " + keys.length + " catalog/UI keys; placeholders match.");
