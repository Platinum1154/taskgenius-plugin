/**
 * Phase 0 W5.2 — settings change → cache invalidation → re-query.
 *
 * Verifies the contract that subsequent settings consolidation work in
 * Phase 1 will rely on: when a settings change is announced via
 * onSettingsChange (or its typed sibling onSettingsFieldsChanged), the
 * affected cache namespaces are cleared and a subsequent query reflects
 * the new state.
 *
 * This test does NOT exercise rebuild() — that's a separate (slower)
 * concern. It just verifies the cache layer reacts to settings changes
 * the way Phase 1's deprecation work needs.
 */

import { buildOrchestrator } from "./_fixtures/buildOrchestrator";

describe("Orchestrator settings change → cache invalidation (W5.2)", () => {
	it("parser scope clears the raw namespace", async () => {
		const fx = await buildOrchestrator({
			files: { "a.md": "- [ ] task one\n" },
		});
		(fx.orchestrator as any).workerOrchestrator.setWorkersEnabled(false);

		try {
			// Block rebuild to keep this test fast.
			(fx.orchestrator as any).rebuild = jest.fn(async () => {});

			// Process a file so the raw namespace has content.
			const file = fx.vault.getFileByPath("a.md")!;
			await (fx.orchestrator as any).processFileImmediate(file, true);

			const storage: any = (fx.orchestrator as any).storage;
			const beforeStats = await storage.getStats();
			expect(beforeStats.byNamespace.raw).toBeGreaterThan(0);

			// Trigger a parser-scope settings change.
			await fx.orchestrator.onSettingsChange(["parser"]);

			const afterStats = await storage.getStats();
			expect(afterStats.byNamespace.raw).toBe(0);
		} finally {
			await fx.dispose();
		}
	});

	it("augment scope clears augmented + project namespaces", async () => {
		const fx = await buildOrchestrator({
			files: { "a.md": "- [ ] one\n" },
		});
		(fx.orchestrator as any).workerOrchestrator.setWorkersEnabled(false);

		try {
			(fx.orchestrator as any).rebuild = jest.fn(async () => {});

			const file = fx.vault.getFileByPath("a.md")!;
			await (fx.orchestrator as any).processFileImmediate(file, true);

			const storage: any = (fx.orchestrator as any).storage;
			const before = await storage.getStats();
			expect(before.byNamespace.augmented).toBeGreaterThan(0);

			await fx.orchestrator.onSettingsChange(["augment"]);

			const after = await storage.getStats();
			expect(after.byNamespace.augmented).toBe(0);
			expect(after.byNamespace.project).toBe(0);
		} finally {
			await fx.dispose();
		}
	});

	it("emits SETTINGS_CHANGED event with the scopes payload", async () => {
		const fx = await buildOrchestrator();
		try {
			(fx.orchestrator as any).rebuild = jest.fn(async () => {});

			const events: any[] = [];
			fx.app.workspace.on(
				"task-genius:settings-changed",
				(payload: any) => {
					events.push(payload);
				},
			);

			await fx.orchestrator.onSettingsChange(["parser", "augment"]);

			expect(events.length).toBe(1);
			expect(events[0].scopes).toEqual(["parser", "augment"]);
			expect(typeof events[0].timestamp).toBe("number");
		} finally {
			await fx.dispose();
		}
	});

	it("typed onSettingsFieldsChanged path also clears caches via the legacy delegate", async () => {
		const fx = await buildOrchestrator({
			files: { "a.md": "- [ ] one\n" },
		});
		(fx.orchestrator as any).workerOrchestrator.setWorkersEnabled(false);

		try {
			(fx.orchestrator as any).rebuild = jest.fn(async () => {});

			const file = fx.vault.getFileByPath("a.md")!;
			await (fx.orchestrator as any).processFileImmediate(file, true);

			const storage: any = (fx.orchestrator as any).storage;
			const before = await storage.getStats();
			expect(before.byNamespace.raw).toBeGreaterThan(0);

			// taskStatuses is a parser-scope field per scope-map.ts.
			await fx.orchestrator.onSettingsFieldsChanged(["taskStatuses"]);

			const after = await storage.getStats();
			expect(after.byNamespace.raw).toBe(0);
		} finally {
			await fx.dispose();
		}
	});
});


describe("settings edited in place", () => {
	it("invalidates project/parser caches when a nested file project setting changes", async () => {
		const fx = await buildOrchestrator();
		try {
			const update = jest.spyOn(fx.orchestrator, "onSettingsFieldsChanged").mockResolvedValue();
			fx.plugin.settings.projectConfig = { ...fx.plugin.settings.projectConfig, metadataConfig: { ...fx.plugin.settings.projectConfig.metadataConfig, metadataKey: "new_project" } };
			await fx.orchestrator.updateSettings(fx.plugin.settings);
			expect(update).toHaveBeenCalledWith(expect.arrayContaining(["projectConfig"]));
			update.mockClear(); await fx.orchestrator.updateSettings(fx.plugin.settings);
			expect(update).not.toHaveBeenCalled();
		} finally { await fx.dispose(); }
	});
	it("does not rebuild the task index for a display-only setting", async () => {
		const fx = await buildOrchestrator();
		try {
			const update = jest.spyOn(fx.orchestrator, "onSettingsFieldsChanged").mockResolvedValue();
			fx.plugin.settings.defaultViewMode = "tree";
			await fx.orchestrator.updateSettings(fx.plugin.settings);
			expect(update).not.toHaveBeenCalled();
		} finally { await fx.dispose(); }
	});
	it("retries invalidation after a rebuild fails instead of accepting a stale snapshot", async () => {
		const fx = await buildOrchestrator();
		try {
			const update = jest.spyOn(fx.orchestrator, "onSettingsFieldsChanged").mockRejectedValueOnce(new Error("disk failure")).mockResolvedValueOnce();
			fx.plugin.settings.preferMetadataFormat = "dataview";
			await expect(fx.orchestrator.updateSettings(fx.plugin.settings)).rejects.toThrow("disk failure");
			await fx.orchestrator.updateSettings(fx.plugin.settings);
			expect(update).toHaveBeenCalledTimes(2);
		} finally { await fx.dispose(); }
	});
});


describe("source metadata invalidation", () => {
	it("clears file caches before parsing a metadata update", async () => {
		const fx = await buildOrchestrator({ files: { "a.md": "- [ ] Read" } });
		try {
			const flow: any = fx.orchestrator; flow.subscribeToEvents();
			const events: string[] = [];
			jest.spyOn(flow.projectResolver, "clearCache").mockImplementation(() => { events.push("project"); });
			jest.spyOn(flow.augmentor, "clearCache").mockImplementation(() => { events.push("dates"); });
			jest.spyOn(flow.storage, "clearFile").mockImplementation(async () => { events.push("storage"); });
			jest.spyOn(flow, "processFile").mockImplementation(async () => { events.push("parse"); });
			fx.app.workspace.trigger("task-genius:file-updated", { path: "a.md", reason: "metadata" });
			await Promise.resolve(); await Promise.resolve();
			expect(events).toEqual(["project", "dates", "storage", "parse"]);
		} finally { await fx.dispose(); }
	});
	it("cancels a delayed parse when the source file is deleted", async () => {
		const fx = await buildOrchestrator();
		try {
			const flow: any = fx.orchestrator; flow.subscribeToEvents();
			const timer = setTimeout(() => { throw new Error("Deleted file was reparsed"); }, 60000);
			flow.processingQueue.set("a.md", timer);
			fx.app.workspace.trigger("task-genius:file-updated", { path: "a.md", reason: "delete" });
			await Promise.resolve();
			expect(flow.processingQueue.has("a.md")).toBe(false);
		} finally { await fx.dispose(); }
	});
});


it("prunes file filters only when their configuration changes", async () => {
	const fx = await buildOrchestrator();
	try {
		const flow: any = fx.orchestrator;
		const prune = jest.spyOn(flow, "pruneByFilter").mockResolvedValue(undefined);
		await fx.orchestrator.updateSettings(fx.plugin.settings);
		expect(prune).not.toHaveBeenCalled();
		fx.plugin.settings.fileFilter = { ...fx.plugin.settings.fileFilter, enabled: !fx.plugin.settings.fileFilter.enabled };
		await fx.orchestrator.updateSettings(fx.plugin.settings);
		expect(prune).toHaveBeenCalledTimes(1);
	} finally { await fx.dispose(); }
});
