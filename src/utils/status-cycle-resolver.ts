/**
 * Status Cycle Resolver Utilities
 *
 * Provides core utilities for resolving and working with multiple status cycles.
 * This includes finding applicable cycles, calculating next states, and managing
 * priority-based cycle selection.
 */

import type { StatusCycle, TaskProgressBarSettings } from "@/common/setting-definition";

/**
 * Result of finding the next status in a cycle
 */
export interface NextStatusResult {
	/** The name of the next status */
	statusName: string;
	/** The checkbox mark character for the next status */
	mark: string;
	/** The cycle that was used to determine the next status */
	cycle: StatusCycle;
}

/**
 * Finds all cycles that contain a given mark
 *
 * @param currentMark - The current task checkbox mark (e.g., " ", "x", "/")
 * @param statusCycles - Array of all available status cycles
 * @returns Array of applicable cycles, sorted by priority (highest priority first)
 */
export function findApplicableCycles(
	currentMark: string,
	statusCycles: StatusCycle[] | undefined,
): StatusCycle[] {
	if (!statusCycles || statusCycles.length === 0) {
		return [];
	}

	return statusCycles
		.filter((cycle) => cycle.enabled)
		.filter((cycle) => {
			// Check if the current mark exists in any status of this cycle
			return Object.values(cycle.marks).includes(currentMark);
		})
		.sort((a, b) => a.priority - b.priority); // Sort by priority (lower number = higher priority)
}

/**
 * Gets the next status in a given cycle based on the current mark
 *
 * @param currentMark - The current task checkbox mark
 * @param cycle - The status cycle to use
 * @returns The next status information, or null if not found
 */
export function getNextStatus(
	currentMark: string,
	cycle: StatusCycle,
): NextStatusResult | null {
	// Find which status has the current mark
	let currentStatusName: string | null = null;
	for (const statusName of cycle.cycle) {
		if (cycle.marks[statusName] === currentMark) {
			currentStatusName = statusName;
			break;
		}
	}

	if (!currentStatusName) {
		return null;
	}

	// Find the index of the current status in the cycle
	const currentIndex = cycle.cycle.indexOf(currentStatusName);
	if (currentIndex === -1) {
		return null;
	}

	// Calculate next index (wraps around to 0)
	const nextIndex = (currentIndex + 1) % cycle.cycle.length;
	const nextStatusName = cycle.cycle[nextIndex];
	const nextMark = cycle.marks[nextStatusName];

	return {
		statusName: nextStatusName,
		mark: nextMark,
		cycle,
	};
}

/**
 * Gets the previous status in a given cycle based on the current mark
 *
 * @param currentMark - The current task checkbox mark
 * @param cycle - The status cycle to use
 * @returns The previous status information, or null if not found
 */
export function getPreviousStatus(
	currentMark: string,
	cycle: StatusCycle,
): NextStatusResult | null {
	// Find which status has the current mark
	let currentStatusName: string | null = null;
	for (const statusName of cycle.cycle) {
		if (cycle.marks[statusName] === currentMark) {
			currentStatusName = statusName;
			break;
		}
	}

	if (!currentStatusName) {
		return null;
	}

	// Find the index of the current status in the cycle
	const currentIndex = cycle.cycle.indexOf(currentStatusName);
	if (currentIndex === -1) {
		return null;
	}

	// Calculate previous index (wraps around to end)
	const previousIndex =
		(currentIndex - 1 + cycle.cycle.length) % cycle.cycle.length;
	const previousStatusName = cycle.cycle[previousIndex];
	const previousMark = cycle.marks[previousStatusName];

	return {
		statusName: previousStatusName,
		mark: previousMark,
		cycle,
	};
}

/**
 * Finds the primary (highest priority) cycle for a given mark
 *
 * @param currentMark - The current task checkbox mark
 * @param statusCycles - Array of all available status cycles
 * @returns The highest priority applicable cycle, or null if none found
 */
export function findPrimaryCycle(
	currentMark: string,
	statusCycles: StatusCycle[] | undefined,
): StatusCycle | null {
	const applicableCycles = findApplicableCycles(currentMark, statusCycles);
	return applicableCycles.length > 0 ? applicableCycles[0] : null;
}

/**
 * Gets the next status using the primary (highest priority) cycle
 *
 * @param currentMark - The current task checkbox mark
 * @param statusCycles - Array of all available status cycles
 * @returns The next status information using the primary cycle, or null if not found
 */
export function getNextStatusPrimary(
	currentMark: string,
	statusCycles: StatusCycle[] | undefined,
): NextStatusResult | null {
	const primaryCycle = findPrimaryCycle(currentMark, statusCycles);
	if (!primaryCycle) {
		return null;
	}
	return getNextStatus(currentMark, primaryCycle);
}

/**
 * Gets the previous status using the primary (highest priority) cycle
 *
 * @param currentMark - The current task checkbox mark
 * @param statusCycles - Array of all available status cycles
 * @returns The previous status information using the primary cycle, or null if not found
 */
export function getPreviousStatusPrimary(
	currentMark: string,
	statusCycles: StatusCycle[] | undefined,
): NextStatusResult | null {
	const primaryCycle = findPrimaryCycle(currentMark, statusCycles);
	if (!primaryCycle) {
		return null;
	}
	return getPreviousStatus(currentMark, primaryCycle);
}

/**
 * Gets all unique status names across all enabled cycles
 *
 * @param statusCycles - Array of all available status cycles
 * @returns Set of all unique status names
 */
export function getAllStatusNames(
	statusCycles: StatusCycle[] | undefined,
): Set<string> {
	const statusNames = new Set<string>();

	if (!statusCycles) {
		return statusNames;
	}

	for (const cycle of statusCycles) {
		if (!cycle.enabled) continue;
		for (const statusName of cycle.cycle) {
			statusNames.add(statusName);
		}
	}

	return statusNames;
}

/**
 * Gets all unique marks across all enabled cycles
 *
 * @param statusCycles - Array of all available status cycles
 * @returns Set of all unique mark characters
 */
export function getAllMarks(
	statusCycles: StatusCycle[] | undefined,
): Set<string> {
	const marks = new Set<string>();

	if (!statusCycles) {
		return marks;
	}

	for (const cycle of statusCycles) {
		if (!cycle.enabled) continue;
		for (const mark of Object.values(cycle.marks)) {
			marks.add(mark);
		}
	}

	return marks;
}

/**
 * Finds a status name by its mark, checking all enabled cycles
 *
 * @param mark - The checkbox mark to look up
 * @param statusCycles - Array of all available status cycles
 * @returns The status name, or null if not found
 */
export function findStatusNameByMark(
	mark: string,
	statusCycles: StatusCycle[] | undefined,
): string | null {
	if (!statusCycles) {
		return null;
	}

	// Check in priority order
	const sortedCycles = [...statusCycles]
		.filter((c) => c.enabled)
		.sort((a, b) => a.priority - b.priority);

	for (const cycle of sortedCycles) {
		for (const [statusName, statusMark] of Object.entries(cycle.marks)) {
			if (statusMark === mark) {
				return statusName;
			}
		}
	}

	return null;
}

/**
 * Finds a mark by its status name, checking the primary applicable cycle
 *
 * @param statusName - The status name to look up
 * @param statusCycles - Array of all available status cycles
 * @returns The mark character, or null if not found
 */
export function findMarkByStatusName(
	statusName: string,
	statusCycles: StatusCycle[] | undefined,
): string | null {
	if (!statusCycles) {
		return null;
	}

	// Check in priority order
	const sortedCycles = [...statusCycles]
		.filter((c) => c.enabled)
		.sort((a, b) => a.priority - b.priority);

	for (const cycle of sortedCycles) {
		if (statusName in cycle.marks) {
			return cycle.marks[statusName];
		}
	}

	return null;
}

/**
 * Checks if a mark is used in any enabled cycle
 *
 * @param mark - The mark to check
 * @param statusCycles - Array of all available status cycles
 * @returns true if the mark is used, false otherwise
 */
export function isMarkInUse(
	mark: string,
	statusCycles: StatusCycle[] | undefined,
): boolean {
	return findStatusNameByMark(mark, statusCycles) !== null;
}

/**
 * Gets the cycle that a specific status belongs to (by priority)
 *
 * @param statusName - The status name to look up
 * @param statusCycles - Array of all available status cycles
 * @returns The cycle containing the status, or null if not found
 */
export function getCycleForStatus(
	statusName: string,
	statusCycles: StatusCycle[] | undefined,
): StatusCycle | null {
	if (!statusCycles) {
		return null;
	}

	// Check in priority order
	const sortedCycles = [...statusCycles]
		.filter((c) => c.enabled)
		.sort((a, b) => a.priority - b.priority);

	for (const cycle of sortedCycles) {
		if (cycle.cycle.includes(statusName)) {
			return cycle;
		}
	}

	return null;
}

/**
 * Configuration format compatible with legacy task status API
 */
export interface LegacyStatusConfig {
	/** Array of status names in cycle order */
	cycle: string[];
	/** Mapping from status name to mark character */
	marks: Record<string, string>;
	/** Array of status names to exclude from cycling (legacy field, unused in multi-cycle) */
	excludeMarksFromCycle: string[];
	/** Whether multi-cycle mode is active */
	isMultiCycle: boolean;
	/** ID of the current cycle (if multi-cycle mode) */
	currentCycleId?: string;
}

/**
 * Gets task status configuration with backward compatibility for legacy API
 *
 * This function provides a unified interface for accessing status configuration,
 * automatically handling both new multi-cycle and legacy single-cycle modes.
 *
 * @param settings - Plugin settings object
 * @param currentMark - Optional current task mark to determine which cycle to use
 * @returns Legacy-compatible status configuration
 */
export function getTaskStatusConfig(
	settings: {
		statusCycles?: StatusCycle[];
		taskStatusCycle?: string[];
		taskStatusMarks?: Record<string, string>;
		excludeMarksFromCycle?: string[];
	},
	currentMark?: string,
): LegacyStatusConfig {
	const statusCycles = settings.statusCycles || [];
	const enabledCycles = statusCycles.filter((c) => c.enabled);

	if (enabledCycles.length > 0) {
		// Multi-cycle mode: find the appropriate cycle
		if (currentMark) {
			// Find cycle containing this mark
			const primaryCycle = findPrimaryCycle(currentMark, statusCycles);
			if (primaryCycle) {
				return {
					cycle: primaryCycle.cycle,
					marks: primaryCycle.marks,
					excludeMarksFromCycle: [],
					isMultiCycle: true,
					currentCycleId: primaryCycle.id,
				};
			}
		}

		// Default to highest priority enabled cycle
		const primaryCycle = enabledCycles.sort(
			(a, b) => a.priority - b.priority,
		)[0];
		return {
			cycle: primaryCycle.cycle,
			marks: primaryCycle.marks,
			excludeMarksFromCycle: [],
			isMultiCycle: true,
			currentCycleId: primaryCycle.id,
		};
	}

	// Fallback to legacy single-cycle mode
	return {
		cycle: settings.taskStatusCycle || [],
		marks: settings.taskStatusMarks || {},
		excludeMarksFromCycle: settings.excludeMarksFromCycle || [],
		isMultiCycle: false,
	};
}

/**
 * Gets all unique status marks across all enabled cycles as a Map
 *
 * This is useful for UI components that need to display all available statuses.
 * Returns a Map from mark character to status name.
 *
 * @param settings - Plugin settings object
 * @returns Map from mark character to status name
 */
export function getAllStatusMarks(settings: {
	statusCycles?: StatusCycle[];
	taskStatusMarks?: Record<string, string>;
}): Map<string, string> {
	const uniqueStatuses = new Map<string, string>();
	const statusCycles = settings.statusCycles || [];
	const enabledCycles = statusCycles.filter((c) => c.enabled);

	if (enabledCycles.length > 0) {
		// Multi-cycle mode: collect all unique marks
		for (const cycle of enabledCycles) {
			for (const [name, mark] of Object.entries(cycle.marks)) {
				// Only add if not already present (priority-based deduplication)
				if (!uniqueStatuses.has(mark)) {
					uniqueStatuses.set(mark, name);
				}
			}
		}
	} else {
		// Legacy mode: use taskStatusMarks
		const statusMarks = settings.taskStatusMarks || {};
		for (const [name, mark] of Object.entries(statusMarks)) {
			if (!uniqueStatuses.has(mark)) {
				uniqueStatuses.set(mark, name);
			}
		}
	}

	return uniqueStatuses;
}

export type TaskStatusGroup = "notStarted" | "planned" | "inProgress" | "completed" | "archived" | "abandoned";

type StatusSettings = Pick<TaskProgressBarSettings,
	"statusCycles" | "taskStatuses" | "taskStatusCycle" | "taskStatusMarks" | "excludeMarksFromCycle">;

function statusGroup(name: string): TaskStatusGroup | undefined {
	const key = name.toLowerCase().replace(/[\s_-]/g, "");
	const groups: Record<string, TaskStatusGroup> = {
		notstarted: "notStarted", planned: "planned", inprogress: "inProgress",
		completed: "completed", done: "completed", finished: "completed",
		paused: "archived", pause: "archived", archived: "archived",
		abandoned: "abandoned", cancelled: "abandoned", canceled: "abandoned",
		未开始: "notStarted", 计划: "planned", 进行中: "inProgress",
		已完成: "completed", 暂停: "archived", 已暂停: "archived", 已放弃: "abandoned",
	};
	return groups[key];
}

/** Resolve the workflow mark first, then accept marks from older task files. */
export function getTaskStatusGroup(mark: string, settings: StatusSettings): TaskStatusGroup | undefined {
	const cycle = findPrimaryCycle(mark, settings.statusCycles);
	if (cycle) {
		const name = cycle.cycle.find(name => cycle.marks[name] === mark);
		const group = name && statusGroup(name);
		if (group) return group;
	}
	for (const [name, marks] of Object.entries(settings.taskStatuses || {})) {
		if (marks.split("|").includes(mark)) return statusGroup(name);
	}
	for (const [name, value] of Object.entries(settings.taskStatusMarks || {})) {
		if (value === mark) return statusGroup(name);
	}
	return statusGroup(mark);
}

/** Use the same primary workflow as source-mode checkboxes. */
export function getNextTaskStatusMark(mark: string, settings: StatusSettings): string {
	const next = getNextStatusPrimary(mark, settings.statusCycles);
	if (next?.mark?.length === 1) return next.mark;
	// Older notes can use a different mark for the same status, such as a
	// for pause while the current workflow uses =.
	const group = getTaskStatusGroup(mark, settings);
	if (group) {
		const cycles = (settings.statusCycles || []).filter(cycle => cycle.enabled)
			.sort((a, b) => a.priority - b.priority);
		for (const cycle of cycles) {
			const name = cycle.cycle.find(name => statusGroup(name) === group);
			if (!name) continue;
			const compatible = getNextStatus(cycle.marks[name], cycle);
			if (compatible?.mark?.length === 1) return compatible.mark;
		}
	}
	const names = (settings.taskStatusCycle || []).filter(name =>
		!(settings.excludeMarksFromCycle || []).includes(name)
		&& settings.taskStatusMarks?.[name]?.length === 1);
	if (names.length) {
		const index = names.findIndex(name => settings.taskStatusMarks[name] === mark);
		return settings.taskStatusMarks[names[(index + 1) % names.length]];
	}
	return getTaskStatusGroup(mark, settings) === "completed"
		? (settings.taskStatuses?.notStarted || " ").split("|")[0]
		: (settings.taskStatuses?.completed || "x").split("|")[0];
}

export function getPausedTaskMarks(settings: StatusSettings): string[] {
	const marks = new Set<string>();
	for (const variants of Object.values(settings.taskStatuses || {})) {
		for (const mark of variants.split("|")) marks.add(mark);
	}
	for (const cycle of settings.statusCycles || []) {
		if (cycle.enabled) for (const name of cycle.cycle) marks.add(cycle.marks[name]);
	}
	for (const mark of Object.values(settings.taskStatusMarks || {})) marks.add(mark);
	return [...marks].filter(mark => mark?.length === 1 && mark !== " "
		&& getTaskStatusGroup(mark, settings) === "archived");
}
