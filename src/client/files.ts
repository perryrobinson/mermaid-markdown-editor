import { bus } from "./eventBus";

export function setupFileHandlers(): void {
	// Save button
	const saveButton = document.getElementById("save-file");
	saveButton?.addEventListener("click", () => {
		bus.emit("file:save");
	});

	// Open button
	const openButton = document.getElementById("open-file");
	const fileInput = document.getElementById("file-input") as HTMLInputElement;

	openButton?.addEventListener("click", () => {
		fileInput?.click();
	});

	fileInput?.addEventListener("change", async () => {
		const files = fileInput.files;
		if (!files || files.length === 0) return;

		for (const file of Array.from(files)) {
			await openFile(file);
		}

		fileInput.value = "";
	});

	// Drag and drop
	const dropOverlay = document.getElementById("drop-overlay")!;
	let dragCounter = 0;

	document.addEventListener("dragenter", (e) => {
		e.preventDefault();
		dragCounter++;
		dropOverlay.classList.add("visible");
	});

	document.addEventListener("dragleave", (e) => {
		e.preventDefault();
		dragCounter--;
		if (dragCounter === 0) {
			dropOverlay.classList.remove("visible");
		}
	});

	document.addEventListener("dragover", (e) => {
		e.preventDefault();
	});

	document.addEventListener("drop", async (e) => {
		e.preventDefault();
		dragCounter = 0;
		dropOverlay.classList.remove("visible");

		const files = e.dataTransfer?.files;
		if (!files || files.length === 0) return;

		for (const file of Array.from(files)) {
			if (file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
				await openFile(file);
			}
		}
	});
}

async function openFile(file: File): Promise<void> {
	try {
		const content = await file.text();
		bus.emit("file:open", { path: file.name, content });
	} catch (error) {
		console.error("Error reading file:", error);
		alert("Failed to read file");
	}
}

export async function loadFileFromPath(path: string): Promise<void> {
	try {
		const response = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
		if (!response.ok) {
			throw new Error("Failed to load file");
		}

		const data = await response.json();
		bus.emit("file:open", { path, content: data.content });
	} catch (error) {
		console.error("Error loading file:", error);
		alert("Failed to load file");
	}
}
