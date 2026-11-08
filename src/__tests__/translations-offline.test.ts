jest.mock("obsidian", () => ({
	moment: { locale: jest.fn(() => "en") },
	requestUrl: jest.fn(() => Promise.reject(new Error("offline"))),
}));
import { moment, requestUrl } from "obsidian";
import { initializeTranslations, t } from "@/translations/helper";
import { translationManager } from "@/translations/manager";

describe("bundled interface languages", () => {
	beforeEach(() => jest.clearAllMocks());
	it("switches English and Chinese without network access or a cached translation file", async () => {
		await initializeTranslations("zh-cn"); expect(t("Language")).toBe("语言");
		await initializeTranslations("en"); expect(t("Language")).toBe("Language");
		expect(requestUrl).not.toHaveBeenCalled();
	});
	it("follows Obsidian only when auto is selected", async () => {
		(moment.locale as any).mockReturnValue("zh_CN");
		await initializeTranslations("auto"); expect(t("Language")).toBe("语言");
		await initializeTranslations("en"); expect(t("Language")).toBe("Language");
		expect(moment.locale).not.toHaveBeenCalledWith("en");
	});
	it("preserves named substitutions in either language", async () => {
		await initializeTranslations("zh-cn"); expect(t('Delete the project configuration "{{name}}"?', { interpolation: { name: "Project A" } })).toContain("Project A");
		await initializeTranslations("en"); expect(t('Delete the project configuration "{{name}}"?', { interpolation: { name: "Project A" } })).toContain("Project A");
	});
	it("does not let a slow earlier language selection override a newer one", async () => {
		let finish: (value: any) => void;
		const first = translationManager.initializeLocale("ja", locale => locale === "ja" ? new Promise(resolve => { finish = resolve; }) : Promise.resolve({}));
		await Promise.resolve(); await Promise.resolve();
		await initializeTranslations("en"); finish!({ Language: "日本語" }); await first;
		expect(translationManager.getResolvedLocale()).toBe("en");
	});
});
