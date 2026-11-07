import { t as translateUI } from "@/translations/helper";
/**
 * Bulk Date Offset Modal
 * Modal for postponing/advancing dates by a relative offset for bulk operations
 */

import { App, Modal, ButtonComponent } from "obsidian";
import { addDays, addWeeks } from "date-fns";
import type TaskProgressBarPlugin from "@/index";
import { t } from "@/translations/helper";

interface DateOffset {
	label: string;
	days: number;
}

const PRESET_OFFSETS: DateOffset[] = [
	{ label: translateUI("Tomorrow"), days: 1 },
	{ label: translateUI("+3 days"), days: 3 },
	{ label: translateUI("+5 days"), days: 5 },
	{ label: translateUI("+1 week"), days: 7 },
	{ label: translateUI("+2 weeks"), days: 14 },
	{ label: translateUI("+1 month"), days: 30 },
];

export class BulkDateOffsetModal extends Modal {
	public onOffsetSelected: ((offsetDays: number) => void) | null = null;
	private plugin: TaskProgressBarPlugin;
	private dateType: "dueDate" | "startDate" | "scheduledDate";

	constructor(
		app: App,
		plugin: TaskProgressBarPlugin,
		dateType: "dueDate" | "startDate" | "scheduledDate"
	) {
		super(app);
		this.plugin = plugin;
		this.dateType = dateType;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("bulk-date-offset-modal");

		// Add title
		const title = contentEl.createEl("h3", {
			text: translateUI("Postpone {{value0}} for selected tasks", { interpolation: { value0: String(this.dateType) } }),
		});
		title.style.marginBottom = "var(--size-4-3)";

		// Add description
		const desc = contentEl.createEl("p", {
			text: translateUI("Choose how many days to postpone the selected tasks:"),
			cls: "modal-description",
		});
		desc.style.marginBottom = "var(--size-4-3)";
		desc.style.color = "var(--text-muted)";

		// Create button container
		const buttonContainer = contentEl.createDiv({
			cls: "bulk-offset-button-container",
		});

		// Add preset offset buttons
		PRESET_OFFSETS.forEach((offset) => {
			new ButtonComponent(buttonContainer)
				.setButtonText(offset.label)
				.setCta()
				.onClick(() => {
					if (this.onOffsetSelected) {
						this.onOffsetSelected(offset.days);
					}
					this.close();
				});
		});

		// Add custom input section
		const customSection = contentEl.createDiv({
			cls: "bulk-offset-custom-section",
		});
		customSection.style.marginTop = "var(--size-4-6)";
		customSection.style.paddingTop = "var(--size-4-3)";
		customSection.style.borderTop =
			"1px solid var(--background-modifier-border)";

		const customLabel = customSection.createEl("label", {
			text: translateUI("Custom offset (days):"),
		});
		// customLabel.style.display = "block";
		customLabel.show();
		customLabel.style.marginBottom = "var(--size-2-3)";

		const customInputContainer = customSection.createDiv();
		customInputContainer.style.display = "flex";
		customInputContainer.style.gap = "var(--size-2-3)";

		const customInput = customInputContainer.createEl("input", {
			type: "number",
			placeholder: translateUI("Enter days"),
		});
		customInput.style.flex = "1";
		customInput.value = "1";
		customInput.min = "-365";
		customInput.max = "365";

		new ButtonComponent(customInputContainer)
			.setButtonText(translateUI("Apply"))
			.setCta()
			.onClick(() => {
				const days = parseInt(customInput.value) || 0;
				if (days !== 0) {
					if (this.onOffsetSelected) {
						this.onOffsetSelected(days);
					}
					this.close();
				}
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
