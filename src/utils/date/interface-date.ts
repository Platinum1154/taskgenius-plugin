import { t, translationManager } from "@/translations/manager";
import { getRelativeTimeString } from "./date-formatter";

/** UI formatting follows the plugin selection without changing Obsidian's locale. */
export function getInterfaceLocale(): string {
	return translationManager.getResolvedLocale();
}

export function getInterfaceRelativeTimeString(date: Date | number): string {
	return getRelativeTimeString(date, getInterfaceLocale());
}

export function formatInterfaceDate(date: Date): string {
	const target = new Date(date);
	target.setHours(0, 0, 0, 0);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	if (target.getTime() === today.getTime()) return t("Today");
	if (target.getTime() === tomorrow.getTime()) return t("Tomorrow");
	return date.toLocaleDateString(getInterfaceLocale(), {
		month: "short", day: "numeric",
		...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" as const } : {}),
	});
}
