jest.mock("obsidian", () => ({
 moment: { locale: jest.fn(() => "en") },
 requestUrl: jest.fn(() => Promise.reject(new Error("offline"))),
 Notice: jest.fn(),
 Setting: jest.fn().mockImplementation(() => ({
  setName() { return this; }, setDesc() { return this; },
  addDropdown(callback: (dropdown: unknown) => void) {
   const dropdown = {
    addOptions() { return this; }, setValue() { return this; },
    onChange(handler: (value: string) => Promise<void>) { mockChange = handler; return this; },
   };
   callback(dropdown); return this;
  },
 })),
}));
let mockChange: (value: string) => Promise<void>;
import { Notice, moment } from "obsidian";
import { renderLanguageSetting } from "@/components/features/settings/components/LanguageSetting";
import type TaskProgressBarPlugin from "@/index";
import { initializeTranslations, t } from "@/translations/helper";
import { formatInterfaceDate, getInterfaceRelativeTimeString, getInterfaceLocale } from "@/utils/date/interface-date";

describe("language setting and date labels", () => {
 function setup() {
  const plugin = {
   settings: { language: "auto", projectConfig: { metadataKey: "project" } },
   saveSettings: jest.fn().mockResolvedValue(undefined),
   triggerViewUpdate: jest.fn().mockResolvedValue(undefined),
   app: { workspace: { trigger: jest.fn() } },
  };
  renderLanguageSetting(plugin as unknown as TaskProgressBarPlugin, document.createElement("div"));
  return plugin;
 }
 beforeEach(async () => { jest.clearAllMocks(); await initializeTranslations("en"); });
 it("persists the selection and refreshes settings/views without touching other settings", async () => {
  const plugin = setup(); await mockChange("zh-cn");
  expect(plugin.settings).toEqual({ language: "zh-cn", projectConfig: { metadataKey: "project" } });
  expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  expect(plugin.app.workspace.trigger).toHaveBeenCalledWith("task-genius:language-changed");
  expect(plugin.triggerViewUpdate).toHaveBeenCalledTimes(1);
  expect(t("Language")).toBe("语言");
  expect(Notice).toHaveBeenCalled();
 });
 it("ignores invalid dropdown values", async () => {
  const plugin = setup(); await mockChange("unexpected");
  expect(plugin.saveSettings).not.toHaveBeenCalled();
 });
 it("keeps the newest choice when selections change quickly", async () => {
  const plugin = setup(); await Promise.all([mockChange("zh-cn"), mockChange("en")]);
  expect(plugin.settings.language).toBe("en");
  expect(getInterfaceLocale()).toBe("en");
  expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
 });
 it("formats relative and absolute UI dates using the selected language", async () => {
  await initializeTranslations("zh-cn");
  expect(formatInterfaceDate(new Date())).toBe("今天");
  expect(getInterfaceRelativeTimeString(new Date())).toBe("今天");
  expect(formatInterfaceDate(new Date(2020, 0, 15))).toContain("年");
  await initializeTranslations("en");
  expect(formatInterfaceDate(new Date())).toBe("Today");
  expect(formatInterfaceDate(new Date(2020, 0, 15))).toContain("Jan");
  expect(moment.locale).not.toHaveBeenCalledWith("en");
 });
});
