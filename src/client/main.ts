import { bus } from "./eventBus";
import { createEditor, setEditorContent, onEditorChange } from "./editor";
import { renderPreview } from "./preview";
import { TabManager } from "./tabs";
import { setupFileHandlers } from "./files";
import { setupSync } from "./sync";
import { setupDivider } from "./divider";
import {
	initFileTree,
	setActiveFile,
	setOnFileOpen,
	setFileHandle,
	getFileHandle,
	openDirectory,
} from "./filetree";
import { initTheme, setupThemeToggle } from "./theme";
import { setupViewModeToggle, restoreEditingMode } from "./viewMode";
import { registerShortcut, initShortcuts } from "./shortcuts";
import { updateFileStatus } from "./statusBar";
import { showEmptyState, showConflictDialog } from "./dialogs";
import "./toolbar.css";

async function init() {
	const editorElement = document.getElementById("editor")!;
	createEditor(editorElement);

	const tabManager = new TabManager();

	// Editor changes -> update active tab + preview
	onEditorChange((content: string) => {
		const activeTab = tabManager.getActiveTab();
		if (activeTab) {
			activeTab.content = content;
			activeTab.dirty = true;
			tabManager.updateTabDisplay();
			updateFileStatus("dirty");
		}
		bus.emit("editor:change", { content });
		renderPreview(content);
	});

	// Tab switch -> update editor + preview
	bus.on("tab:switch", ({ tab }) => {
		setEditorContent(tab.content);
		bus.emit("editor:change", { content: tab.content });
		renderPreview(tab.content);
		updateFileStatus(tab.dirty ? "dirty" : "saved");
		setActiveFile(tab.path);
	});

	// All tabs closed
	bus.on("tab:allClosed", () => {
		setEditorContent("");
		bus.emit("editor:change", { content: "" });
		showEmptyState();
		updateFileStatus("saved");
		setActiveFile("");
	});

	// File open (from files.ts, filetree, etc.)
	bus.on("file:open", ({ path, content, handle }) => {
		const existingTab = tabManager.findTabByPath(path);
		if (existingTab) {
			tabManager.switchToTab(existingTab.id);
			setActiveFile(path);
			restoreEditingMode();
			return;
		}

		if (handle) {
			setFileHandle(path, handle);
		}

		tabManager.addTab(path, content);
		setEditorContent(content);
		bus.emit("editor:change", { content });
		renderPreview(content);
		updateFileStatus("saved");
		setActiveFile(path);
		restoreEditingMode();
	});

	// File save
	bus.on("file:save", async () => {
		const activeTab = tabManager.getActiveTab();
		if (!activeTab) return;

		try {
			updateFileStatus("syncing");

			const handle = getFileHandle(activeTab.path);
			if (handle) {
				const writable = await handle.createWritable();
				await writable.write(activeTab.content);
				await writable.close();

				activeTab.dirty = false;
				tabManager.updateTabDisplay();
				updateFileStatus("saved");
			} else {
				const response = await fetch("/api/file", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						path: activeTab.path,
						content: activeTab.content,
					}),
				});

				if (response.ok) {
					const data = await response.json();
					activeTab.dirty = false;
					activeTab.mtime = data.mtime;
					tabManager.updateTabDisplay();
					updateFileStatus("saved");
				} else {
					throw new Error("Failed to save");
				}
			}
		} catch (error) {
			console.error("Save failed:", error);
			updateFileStatus("dirty");
			alert("Failed to save file");
		}
	});

	// External file changes
	bus.on("file:externalChange", ({ path, content }) => {
		const tab = tabManager.findTabByPath(path);
		if (!tab) return;

		if (tab.dirty) {
			showConflictDialog(
				tab,
				content,
				() => {},
				() => {
					tab.content = content;
					tab.dirty = false;
					tabManager.updateTabDisplay();
					if (tabManager.getActiveTab()?.id === tab.id) {
						setEditorContent(content);
						renderPreview(content);
						updateFileStatus("saved");
					}
				},
			);
		} else {
			tab.content = content;
			tabManager.updateTabDisplay();
			if (tabManager.getActiveTab()?.id === tab.id) {
				setEditorContent(content);
				renderPreview(content);
			}
		}
	});

	// Set up modules
	setupFileHandlers();
	setupSync();
	setupDivider();

	// Global keyboard shortcuts
	registerShortcut({ key: "s", ctrl: true }, () => {
		bus.emit("file:save");
	});
	registerShortcut({ key: "o", ctrl: true }, () => {
		document.getElementById("file-input")?.click();
	});
	registerShortcut({ key: "O", ctrl: true, shift: true }, () => {
		openDirectory();
	});
	registerShortcut({ key: "b", ctrl: true }, () => {
		toggleSidebar();
	});

	initShortcuts();

	// Sidebar toggle
	let sidebarVisible = true;
	function toggleSidebar(): void {
		const sidebar = document.getElementById("sidebar");
		const toggleBtn = document.getElementById("toggle-sidebar");
		sidebarVisible = !sidebarVisible;
		sidebar?.classList.toggle("hidden", !sidebarVisible);
		toggleBtn?.classList.toggle("active", sidebarVisible);
	}
	document
		.getElementById("toggle-sidebar")
		?.addEventListener("click", toggleSidebar);

	// Open dropdown menu
	const openDropdown = document.getElementById("open-dropdown");
	const openTrigger = document.getElementById("open-menu-btn");
	openTrigger?.addEventListener("click", (e) => {
		e.stopPropagation();
		openDropdown?.classList.toggle("open");
	});
	document.addEventListener("click", () => {
		openDropdown?.classList.remove("open");
	});
	document.getElementById("menu-open-file")?.addEventListener("click", () => {
		openDropdown?.classList.remove("open");
		document.getElementById("file-input")?.click();
	});
	document
		.getElementById("menu-open-folder")
		?.addEventListener("click", () => {
			openDropdown?.classList.remove("open");
			openDirectory();
		});

	// View mode, theme
	setupViewModeToggle();
	initTheme();
	setupThemeToggle();

	// File tree
	setOnFileOpen((path, content, handle) => {
		bus.emit("file:open", { path, content, handle });
	});
	initFileTree();

	showEmptyState();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
