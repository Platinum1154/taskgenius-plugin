import { t as translateUI } from "@/translations/helper";
import { ViewOption } from 'obsidian';
import { TaskBasesView } from './TaskBasesView';
import TaskProgressBarPlugin from '../../index';
import { ViewMode } from '@/common/setting-definition';

/**
 * View type definitions for Task Genius Bases views
 */
interface TaskGeniusBasesViewType {
	id: string;
	name: string;
	icon: string;
	defaultViewMode: ViewMode;
	description?: string;
}

/**
 * All available Task Genius view types for Bases
 */
const TASK_GENIUS_BASES_VIEWS: TaskGeniusBasesViewType[] = [
	{
		id: 'task-genius-inbox',
		name: 'Inbox (Task Genius)',
		icon: 'lucide-inbox',
		defaultViewMode: 'inbox',
		description: translateUI("View and manage tasks in inbox mode")
	},
	{
		id: 'task-genius-forecast',
		name: 'Forecast (Task Genius)',
		icon: 'lucide-calendar-days',
		defaultViewMode: 'forecast',
		description: translateUI("View tasks in forecast timeline")
	},
	{
		id: 'task-genius-projects',
		name: 'Projects (Task Genius)',
		icon: 'lucide-folder-tree',
		defaultViewMode: 'projects',
		description: translateUI("Organize tasks by projects")
	},
	{
		id: 'task-genius-tags',
		name: 'Tags (Task Genius)',
		icon: 'lucide-tags',
		defaultViewMode: 'tags',
		description: translateUI("Browse tasks by tags")
	},
	{
		id: 'task-genius-calendar',
		name: 'Calendar (Task Genius)',
		icon: 'lucide-calendar',
		defaultViewMode: 'calendar',
		description: translateUI("View tasks in calendar layout")
	},
	{
		id: 'task-genius-kanban',
		name: 'Kanban (Task Genius)',
		icon: 'lucide-columns-3',
		defaultViewMode: 'kanban',
		description: translateUI("Manage tasks in kanban board")
	},
	{
		id: 'task-genius-gantt',
		name: 'Gantt (Task Genius)',
		icon: 'lucide-gantt-chart-square',
		defaultViewMode: 'gantt',
		description: translateUI("View tasks in Gantt chart")
	},
	{
		id: 'task-genius-review',
		name: 'Review (Task Genius)',
		icon: 'lucide-list-checks',
		defaultViewMode: 'review',
		description: translateUI("Review and process tasks")
	},
	{
		id: 'task-genius-habits',
		name: 'Habits (Task Genius)',
		icon: 'lucide-target',
		defaultViewMode: 'habit',
		description: translateUI("Track habits and recurring tasks")
	},
	{
		id: 'task-genius-flagged',
		name: 'Flagged (Task Genius)',
		icon: 'lucide-flag',
		defaultViewMode: 'flagged',
		description: translateUI("View high-priority flagged tasks")
	},
	{
		id: 'task-genius-quadrant',
		name: 'Quadrant (Task Genius)',
		icon: 'lucide-grid',
		defaultViewMode: 'quadrant',
		description: translateUI("Organize tasks using the Eisenhower Matrix")
	}
];

/**
 * Create view options for a specific view type
 */
function createViewOptions(viewType: TaskGeniusBasesViewType): () => ViewOption[] {
	return () => {
		// For specialized views, pass the viewMode to filter options
		const viewMode = viewType.defaultViewMode;
		const baseOptions = TaskBasesView.getViewOptions(viewMode);

		const viewSettingsGroup = baseOptions.find(
			opt => opt.displayName === 'View Settings' && opt.type === 'group'
		);

		if (viewSettingsGroup && 'items' in viewSettingsGroup) {
			// Remove the view mode selector for specialized views
			viewSettingsGroup.items = viewSettingsGroup.items?.filter(
				item => item.key !== 'viewMode'
			);

			// Add a note about the view type
			viewSettingsGroup.items?.unshift({
				displayName: 'View Type',
				type: 'text',
				key: '__viewType',
				placeholder: translateUI("This is a {{value0}} view", { interpolation: { value0: String(viewType.name) } }),
				default: viewType.name,
				readonly: true,
			} as any);
		}

		return baseOptions;
	};
}

/**
 * Register all Task Genius views with the Bases plugin
 * @param plugin - The main Task Genius plugin instance
 */
export function registerTaskGeniusBasesViews(plugin: TaskProgressBarPlugin) {
	// Register each view type
	TASK_GENIUS_BASES_VIEWS.forEach(viewType => {
		try {
			plugin.registerBasesView(viewType.id, {
				name: viewType.name,
				icon: viewType.icon,
				factory: (controller, containerEl) => {
					const view = new TaskBasesView(
						controller,
						containerEl,
						plugin,
						viewType.defaultViewMode
					);
					view.setForcedViewMode(viewType.defaultViewMode as ViewMode);

					return view;
				},
				options: createViewOptions(viewType),
			});

			console.log(`Registered Bases view: ${viewType.name} (${viewType.id})`);
		} catch (error) {
			console.error(`Failed to register Bases view ${viewType.id}:`, error);
		}
	});
}
