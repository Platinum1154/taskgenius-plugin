import { Notice, Setting } from "obsidian";
import type TaskProgressBarPlugin from "@/index";
import { initializeTranslations, t } from "@/translations/helper";

export function renderLanguageSetting(plugin: TaskProgressBarPlugin, container: HTMLElement): void {
	let revision = 0;
	new Setting(container)
		.setName(t("Language"))
		.setDesc(t("Choose the Task Genius interface language. English and Simplified Chinese are available offline."))
		.addDropdown(dropdown => dropdown
			.addOptions({ auto: t("Follow Obsidian"), en: "English", "zh-cn": "简体中文" })
			.setValue(plugin.settings.language || "auto")
			.onChange(async value => {
				if (!["auto", "en", "zh-cn"].includes(value)) return;
				const request = ++revision;
				await initializeTranslations(value);
				if (request !== revision) return;
				plugin.settings.language = value as "auto" | "en" | "zh-cn";
				await plugin.saveSettings();
				plugin.app.workspace.trigger("task-genius:language-changed");
				await plugin.triggerViewUpdate();
				new Notice(t("Language saved. Reopen existing task views to refresh all labels."));
			}));
}
