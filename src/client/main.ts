import { createEditor, setEditorContent, getEditorContent, onEditorChange } from "./editor";
import { renderPreview } from "./preview";
import { TabManager } from "./tabs";
import { setupFileHandlers, loadFileFromPath } from "./files";
import { setupSync } from "./sync";
import { setupDivider } from "./divider";
import { initFileTree, setActiveFile, setOnFileOpen, setFileHandle, getFileHandle, openDirectory } from "./filetree";

// Initialize the application
async function init() {
  // Create the editor
  const editorElement = document.getElementById("editor")!;
  const editor = createEditor(editorElement);

  // Initialize tab manager
  const tabManager = new TabManager();

  // Set up preview rendering on editor change
  onEditorChange((content: string) => {
    const activeTab = tabManager.getActiveTab();
    if (activeTab) {
      activeTab.content = content;
      activeTab.dirty = true;
      tabManager.updateTabDisplay();
      updateFileStatus("dirty");
    }
    renderPreview(content);
  });

  // Set up tab switching
  tabManager.onTabSwitch((tab) => {
    setEditorContent(tab.content);
    renderPreview(tab.content);
    updateFileStatus(tab.dirty ? "dirty" : "saved");
    setActiveFile(tab.path);
  });

  // Handle all tabs closed
  tabManager.onAllTabsClosed(() => {
    setEditorContent("");
    showEmptyState();
    updateFileStatus("saved");
    setActiveFile("");
  });

  // Set up file handlers
  setupFileHandlers({
    onFileOpen: (path: string, content: string) => {
      const existingTab = tabManager.findTabByPath(path);
      if (existingTab) {
        tabManager.switchToTab(existingTab.id);
        setActiveFile(path);
        restoreEditingMode();
        return;
      }

      const tab = tabManager.addTab(path, content);
      setEditorContent(content);
      renderPreview(content);
      updateFileStatus("saved");
      setActiveFile(path);
      restoreEditingMode();
    },
    onFileSave: async () => {
      const activeTab = tabManager.getActiveTab();
      if (!activeTab) return;

      try {
        updateFileStatus("syncing");

        // Check if we have a file handle (from File System Access API)
        const handle = getFileHandle(activeTab.path);
        if (handle) {
          // Save using File System Access API
          const writable = await handle.createWritable();
          await writable.write(activeTab.content);
          await writable.close();

          activeTab.dirty = false;
          tabManager.updateTabDisplay();
          updateFileStatus("saved");
        } else {
          // Fall back to server API
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
    },
  });

  // Set up WebSocket sync
  setupSync({
    onFileChange: (path: string, content: string) => {
      const tab = tabManager.findTabByPath(path);
      if (!tab) return;

      // If the tab is dirty, we have a conflict
      if (tab.dirty) {
        showConflictDialog(tab, content, () => {
          // Keep local changes
        }, () => {
          // Use remote changes
          tab.content = content;
          tab.dirty = false;
          tabManager.updateTabDisplay();
          if (tabManager.getActiveTab()?.id === tab.id) {
            setEditorContent(content);
            renderPreview(content);
            updateFileStatus("saved");
          }
        });
      } else {
        // No conflict, just update
        tab.content = content;
        tabManager.updateTabDisplay();
        if (tabManager.getActiveTab()?.id === tab.id) {
          setEditorContent(content);
          renderPreview(content);
        }
      }
    },
  });

  // Set up resizable divider
  setupDivider();

  // Set up keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl+S - Save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      document.getElementById("save-file")?.click();
    }
    // Ctrl+O - Open file
    if ((e.ctrlKey || e.metaKey) && e.key === "o" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("file-input")?.click();
    }
    // Ctrl+Shift+O - Open folder
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "O") {
      e.preventDefault();
      openDirectory();
    }
    // Ctrl+B - Toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      toggleSidebar();
    }
  });

  // Set up sidebar toggle
  setupSidebarToggle();

  // Set up view mode toggle buttons
  setupViewModeToggle();

  // Set up Open dropdown menu
  setupOpenMenu();

  // Initialize file tree with callback for opening files
  setOnFileOpen((path, content, handle) => {
    const existingTab = tabManager.findTabByPath(path);
    if (existingTab) {
      tabManager.switchToTab(existingTab.id);
      setActiveFile(path);
      restoreEditingMode();
      return;
    }

    // Store handle for saving later (if available - only with File System Access API)
    if (handle) {
      setFileHandle(path, handle);
    }

    const tab = tabManager.addTab(path, content);
    setEditorContent(content);
    renderPreview(content);
    updateFileStatus("saved");
    setActiveFile(path);
    restoreEditingMode();
  });
  initFileTree();

  // Show empty state initially
  showEmptyState();
}

function updateFileStatus(status: "dirty" | "saved" | "syncing") {
  const statusElement = document.getElementById("file-status")!;
  statusElement.className = "file-status " + status;

  switch (status) {
    case "dirty":
      statusElement.textContent = "Unsaved changes";
      break;
    case "saved":
      statusElement.textContent = "Saved";
      break;
    case "syncing":
      statusElement.textContent = "Saving...";
      break;
  }
}

function showEmptyState() {
  const preview = document.getElementById("preview")!;
  preview.innerHTML = `
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <h2>No file open</h2>
      <p>Open a markdown file to get started</p>
      <div class="empty-state-actions">
        <button class="btn" id="empty-open-file">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Open File
        </button>
        <button class="btn" id="empty-open-folder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Open Folder
        </button>
      </div>
    </div>
  `;

  // Switch to preview-only mode when empty (no editor needed)
  setViewMode("preview");
  setViewModeButtonsEnabled(false);

  // Wire up empty state buttons
  document.getElementById("empty-open-file")?.addEventListener("click", () => {
    document.getElementById("file-input")?.click();
  });
  document.getElementById("empty-open-folder")?.addEventListener("click", () => {
    openDirectory();
  });
}

let sidebarVisible = true;

function toggleSidebar(): void {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggle-sidebar");

  sidebarVisible = !sidebarVisible;

  sidebar?.classList.toggle("hidden", !sidebarVisible);
  toggleBtn?.classList.toggle("active", sidebarVisible);
}

function setupSidebarToggle(): void {
  const toggleBtn = document.getElementById("toggle-sidebar");
  toggleBtn?.addEventListener("click", toggleSidebar);
}

function setupOpenMenu(): void {
  const dropdown = document.getElementById("open-dropdown");
  const trigger = document.getElementById("open-menu-btn");
  const menuOpenFile = document.getElementById("menu-open-file");
  const menuOpenFolder = document.getElementById("menu-open-folder");

  // Toggle dropdown on click
  trigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle("open");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", () => {
    dropdown?.classList.remove("open");
  });

  // Menu items
  menuOpenFile?.addEventListener("click", () => {
    dropdown?.classList.remove("open");
    document.getElementById("file-input")?.click();
  });

  menuOpenFolder?.addEventListener("click", () => {
    dropdown?.classList.remove("open");
    openDirectory();
  });
}

type ViewMode = "split" | "editor" | "preview";
let currentViewMode: ViewMode = "split";
let viewModeElements: {
  splitPane: HTMLElement;
  editorPane: HTMLElement;
  previewPane: HTMLElement;
  splitBtn: HTMLElement;
  editorBtn: HTMLElement;
  previewBtn: HTMLElement;
} | null = null;

function setViewMode(mode: ViewMode): void {
  if (!viewModeElements) return;
  const { splitPane, editorPane, previewPane, splitBtn, editorBtn, previewBtn } = viewModeElements;

  currentViewMode = mode;
  splitPane.classList.remove("editor-only", "preview-only");

  // Clear inline styles set by divider dragging so CSS classes take effect
  editorPane.style.flex = "";
  editorPane.style.width = "";
  previewPane.style.flex = "";
  previewPane.style.width = "";

  if (mode === "editor") {
    splitPane.classList.add("editor-only");
  } else if (mode === "preview") {
    splitPane.classList.add("preview-only");
  }

  // Update button active states
  splitBtn.classList.toggle("active", mode === "split");
  editorBtn.classList.toggle("active", mode === "editor");
  previewBtn.classList.toggle("active", mode === "preview");
}

function setViewModeButtonsEnabled(enabled: boolean): void {
  if (!viewModeElements) return;
  const { splitBtn, editorBtn, previewBtn } = viewModeElements;

  splitBtn.classList.toggle("disabled", !enabled);
  editorBtn.classList.toggle("disabled", !enabled);
  previewBtn.classList.toggle("disabled", !enabled);

  (splitBtn as HTMLButtonElement).disabled = !enabled;
  (editorBtn as HTMLButtonElement).disabled = !enabled;
  (previewBtn as HTMLButtonElement).disabled = !enabled;
}

function restoreEditingMode(): void {
  setViewModeButtonsEnabled(true);
  setViewMode("split");
}

function setupViewModeToggle(): void {
  viewModeElements = {
    splitPane: document.getElementById("split-pane")!,
    editorPane: document.getElementById("editor-pane")!,
    previewPane: document.getElementById("preview-pane")!,
    splitBtn: document.getElementById("view-split")!,
    editorBtn: document.getElementById("view-editor")!,
    previewBtn: document.getElementById("view-preview")!,
  };

  const { splitBtn, editorBtn, previewBtn } = viewModeElements;

  splitBtn.addEventListener("click", () => setViewMode("split"));
  editorBtn.addEventListener("click", () => setViewMode("editor"));
  previewBtn.addEventListener("click", () => setViewMode("preview"));

  // Keyboard shortcut: Ctrl/Cmd+\ to cycle modes
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
      e.preventDefault();
      const modes: ViewMode[] = ["split", "editor", "preview"];
      const nextIndex = (modes.indexOf(currentViewMode) + 1) % modes.length;
      setViewMode(modes[nextIndex]);
    }
  });
}

function showConflictDialog(
  tab: { path: string },
  remoteContent: string,
  onKeepLocal: () => void,
  onUseRemote: () => void
) {
  const dialog = document.createElement("div");
  dialog.className = "conflict-dialog";
  dialog.innerHTML = `
    <div class="conflict-content">
      <h3>File Changed Externally</h3>
      <p>The file "${tab.path}" has been modified outside the editor. What would you like to do?</p>
      <div class="conflict-actions">
        <button class="btn" id="keep-local">Keep My Changes</button>
        <button class="btn btn-primary" id="use-remote">Load External Changes</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.querySelector("#keep-local")?.addEventListener("click", () => {
    onKeepLocal();
    dialog.remove();
  });

  dialog.querySelector("#use-remote")?.addEventListener("click", () => {
    onUseRemote();
    dialog.remove();
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
