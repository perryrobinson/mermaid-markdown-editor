interface FileHandlers {
  onFileOpen: (path: string, content: string, mtime?: number) => void;
  onFileSave: () => Promise<void>;
}

let handlers: FileHandlers | null = null;
let saveDebounceTimer: number | null = null;

export function setupFileHandlers(h: FileHandlers): void {
  handlers = h;

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

    // Reset input so same file can be selected again
    fileInput.value = "";
  });

  // Save button
  const saveButton = document.getElementById("save-file");
  saveButton?.addEventListener("click", () => {
    handlers?.onFileSave();
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
  if (!handlers) return;

  try {
    const content = await file.text();
    // For local files, we use the filename as the path
    // The server will need to resolve this to an actual path
    handlers.onFileOpen(file.name, content, file.lastModified);
  } catch (error) {
    console.error("Error reading file:", error);
    alert("Failed to read file");
  }
}

export async function loadFileFromPath(path: string): Promise<void> {
  if (!handlers) return;

  try {
    const response = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      throw new Error("Failed to load file");
    }

    const data = await response.json();
    handlers.onFileOpen(path, data.content, data.mtime);
  } catch (error) {
    console.error("Error loading file:", error);
    alert("Failed to load file");
  }
}

export function scheduleSave(): void {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = window.setTimeout(() => {
    handlers?.onFileSave();
    saveDebounceTimer = null;
  }, 500);
}
