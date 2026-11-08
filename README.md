<div align="center">
  <img src="media/task-genius.webp" alt="Task Genius Logo" width="100%">

  [![Version](https://img.shields.io/github/v/release/Quorafind/Obsidian-Task-Genius?label=version)](https://github.com/Quorafind/Obsidian-Task-Genius/releases)
  [![Discord](https://img.shields.io/discord/1382008288706695229?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/ARR2rHHX6b)

  [Documentation](https://taskgenius.md) | [Installation](#installation) | [Discord Community](https://discord.gg/ARR2rHHX6b)
</div>

---

## Overview

Task Genius plugin transforms Obsidian into a powerful task management system with advanced features, beautiful visualizations, and seamless in-editor task management workflow - all while preserving Obsidian's philosophy of plain-text, future-proof note-taking.

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Task Views** | Visualize your tasks in different ways, including list, kanban, calendar, and gantt charts |
| **Date & Priority** | [View-based] Recurring tasks, multiple date types, and visual priority indicators |
| **Workflows** | [Editor-based] Multi-stage workflows with automatic timestamping, templates, and process tracking |
| **Habit Tracking** | [View-based] Daily habits, streak tracking, visual calendar, and progress analytics |
| **Quick Capture** | global commands, templates, and automated task creation |
| **Filtering & Search** | Advanced in-editor filtering, saved queries, and custom perspectives |
| **Gamification** | [View-based] Achievement rewards, custom milestones, and motivational feedback |

For detailed feature documentation, visit [taskgenius.md](https://taskgenius.md).

---

## Interface language / 界面语言

Choose **Follow Obsidian**, **English**, or **简体中文** in the Task Genius settings entry or **Interface** settings. English and Simplified Chinese translations are bundled, so they work without downloading a language pack. The settings page refreshes immediately; reopen existing task views to refresh labels created before the switch. This does not change Obsidian’s language or translate your own task names and notes.

在 Task Genius 设置入口或「界面」设置中选择「跟随 Obsidian」、English 或简体中文。中英文翻译随插件提供，无需联网下载。设置页面会立即更新；已打开的任务视图请关闭后重新打开，以更新切换前创建的文字。此设置不会修改 Obsidian 的语言，也不会翻译你的任务名称和笔记。

Contributors: run `pnpm check:i18n` to check English/Chinese key coverage and interpolation placeholders. The same check runs before the production build.

---

## Installation

### Community Plugin (Recommended)
1. Open Obsidian Settings
2. Navigate to Community Plugins
3. Search for "Task Genius"
4. Click Install, then Enable

### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/Quorafind/Obsidian-Task-Genius/releases)
2. Extract files to `.obsidian/plugins/obsidian-task-progress-bar/`
3. Enable the plugin in Obsidian settings

---

## Quick Start

1. **Enable Plugin**: Activate Task Genius in your plugin settings
2. **Onboarding**: You will be guided through the setup process by the plugin

OR

1. **Open Task View**: Click the ribbon icon or use Command Palette to search `Open Task Genius View`.
2. **Create First Task**: Use the Quick Capture panel to create your first task.
3. **Explore Views**: Switch between different views to find your preferred workflow

---

## Community & Support

### Discord Community
Join our active community for help, tips, and feature discussions:
**[Task Genius Discord](https://discord.gg/ARR2rHHX6b)**

### Resources
- [Complete Documentation](https://taskgenius.md)
- [Issue Tracker](https://github.com/taskgenius/taskgenius-plugin/issues)
- [Feature Requests](https://github.com/taskgenius/taskgenius-plugin/discussions)

---

## License

[FSL-1.1-ALv2](./LICENSE)

Feel free to use any part in the `src/components`, such as the Inline Markdown Editor or the Kanban component.
