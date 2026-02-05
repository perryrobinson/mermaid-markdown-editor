import { createEditor, setEditorContent, getEditorContent, onEditorChange } from "./editor";
import { renderPreview } from "./preview";
import { TabManager } from "./tabs";
import { setupFileHandlers, loadFileFromPath } from "./files";
import { setupSync } from "./sync";
import { setupDivider } from "./divider";

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
  });

  // Set up file handlers
  setupFileHandlers({
    onFileOpen: (path: string, content: string) => {
      const existingTab = tabManager.findTabByPath(path);
      if (existingTab) {
        tabManager.switchToTab(existingTab.id);
        return;
      }

      const tab = tabManager.addTab(path, content);
      setEditorContent(content);
      renderPreview(content);
      updateFileStatus("saved");
    },
    onFileSave: async () => {
      const activeTab = tabManager.getActiveTab();
      if (!activeTab) return;

      try {
        updateFileStatus("syncing");
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
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      document.getElementById("save-file")?.click();
    }
  });

  // Set up toggle preview button
  document.getElementById("toggle-preview")?.addEventListener("click", () => {
    const previewPane = document.getElementById("preview-pane");
    const divider = document.getElementById("divider");
    previewPane?.classList.toggle("hidden");
    if (divider) {
      divider.style.display = previewPane?.classList.contains("hidden") ? "none" : "block";
    }
  });

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
      <p>Click "Open" to select a markdown file, or drag and drop a file onto this window.</p>
    </div>
  `;
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
