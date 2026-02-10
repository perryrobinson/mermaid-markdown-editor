import { bus, type ViewMode } from "./eventBus";
import { registerShortcut } from "./shortcuts";

let currentViewMode: ViewMode = "preview";
let viewModeElements: {
	splitPane: HTMLElement;
	editorPane: HTMLElement;
	previewPane: HTMLElement;
	splitBtn: HTMLElement;
	editorBtn: HTMLElement;
	previewBtn: HTMLElement;
} | null = null;

export function setViewMode(mode: ViewMode): void {
	if (!viewModeElements) return;
	const { splitPane, editorPane, previewPane, splitBtn, editorBtn, previewBtn } =
		viewModeElements;

	currentViewMode = mode;
	splitPane.classList.remove("editor-only", "preview-only");

	editorPane.style.flex = "";
	editorPane.style.width = "";
	previewPane.style.flex = "";
	previewPane.style.width = "";

	if (mode === "editor") {
		splitPane.classList.add("editor-only");
	} else if (mode === "preview") {
		splitPane.classList.add("preview-only");
	}

	splitBtn.classList.toggle("active", mode === "split");
	editorBtn.classList.toggle("active", mode === "editor");
	previewBtn.classList.toggle("active", mode === "preview");

	bus.emit("view:modeChange", { mode });
}

export function setViewModeButtonsEnabled(enabled: boolean): void {
	if (!viewModeElements) return;
	const { splitBtn, editorBtn, previewBtn } = viewModeElements;

	splitBtn.classList.toggle("disabled", !enabled);
	editorBtn.classList.toggle("disabled", !enabled);
	previewBtn.classList.toggle("disabled", !enabled);

	(splitBtn as HTMLButtonElement).disabled = !enabled;
	(editorBtn as HTMLButtonElement).disabled = !enabled;
	(previewBtn as HTMLButtonElement).disabled = !enabled;
}

export function restoreEditingMode(): void {
	setViewModeButtonsEnabled(true);
	setViewMode("preview");
}

export function setupViewModeToggle(): void {
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

	registerShortcut({ key: "\\", ctrl: true }, () => {
		const modes: ViewMode[] = ["split", "editor", "preview"];
		const nextIndex = (modes.indexOf(currentViewMode) + 1) % modes.length;
		setViewMode(modes[nextIndex] ?? "split");
	});
}
