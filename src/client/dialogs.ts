import { openDirectory } from "./filetree";
import { setViewMode, setViewModeButtonsEnabled } from "./viewMode";
import "./dialogs.css";

export function showEmptyState(): void {
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

	setViewMode("preview");
	setViewModeButtonsEnabled(false);

	document.getElementById("empty-open-file")?.addEventListener("click", () => {
		document.getElementById("file-input")?.click();
	});
	document
		.getElementById("empty-open-folder")
		?.addEventListener("click", () => {
			openDirectory();
		});
}

export function showConflictDialog(
	tab: { path: string },
	_remoteContent: string,
	onKeepLocal: () => void,
	onUseRemote: () => void,
): void {
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
