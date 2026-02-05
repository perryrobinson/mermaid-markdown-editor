interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
  expanded?: boolean;
  file?: File; // For fallback mode
  handle?: FileSystemFileHandle; // For File System Access API mode
}

let currentActivePath: string | null = null;
let treeData: TreeNode[] = [];
let rootDirectoryHandle: FileSystemDirectoryHandle | null = null;
let useNativeApi = typeof window.showDirectoryPicker === "function";

// Callbacks for file operations
let onFileOpenCallback: ((path: string, content: string, handle?: FileSystemFileHandle) => void) | null = null;

export function setOnFileOpen(callback: (path: string, content: string, handle?: FileSystemFileHandle) => void): void {
  onFileOpenCallback = callback;
}

export async function initFileTree(): Promise<void> {
  setupSidebarControls();
  showEmptyTreeState();
}

async function openDirectory(): Promise<void> {
  if (useNativeApi) {
    try {
      rootDirectoryHandle = await window.showDirectoryPicker({
        mode: "readwrite",
      });
      await refreshFileTree();
      showRefreshButton();
    } catch (error: any) {
      if (error.name === "AbortError") return;
      // Fall back to input method
      console.warn("showDirectoryPicker failed, using fallback:", error);
      useNativeApi = false;
      openDirectoryFallback();
    }
  } else {
    openDirectoryFallback();
  }
}

function openDirectoryFallback(): void {
  const folderInput = document.getElementById("folder-input") as HTMLInputElement;
  if (folderInput) {
    folderInput.click();
  }
}

function showRefreshButton(): void {
  const refreshBtn = document.getElementById("refresh-files");
  if (refreshBtn) refreshBtn.style.display = "";
}

export async function refreshFileTree(): Promise<void> {
  const container = document.getElementById("file-tree");
  if (!container) return;

  if (!rootDirectoryHandle && treeData.length === 0) {
    showEmptyTreeState();
    return;
  }

  try {
    container.innerHTML = `<div class="file-tree-loading">Loading...</div>`;

    if (rootDirectoryHandle) {
      treeData = await buildTreeFromHandle(rootDirectoryHandle, "");
    }
    // If using fallback, treeData is already populated from the input handler

    renderTree(container, treeData);
  } catch (error) {
    console.error("Failed to load file tree:", error);
    container.innerHTML = `<div class="file-tree-empty">Failed to load files</div>`;
  }
}

async function buildTreeFromHandle(
  dirHandle: FileSystemDirectoryHandle,
  basePath: string
): Promise<TreeNode[]> {
  const nodes: TreeNode[] = [];

  for await (const entry of dirHandle.values()) {
    const path = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.kind === "directory") {
      const children = await buildTreeFromHandle(entry as FileSystemDirectoryHandle, path);
      if (children.length > 0) {
        nodes.push({
          name: entry.name,
          path,
          type: "folder",
          children,
          expanded: true,
        });
      }
    } else if (entry.kind === "file" && (entry.name.endsWith(".md") || entry.name.endsWith(".markdown"))) {
      nodes.push({
        name: entry.name,
        path,
        type: "file",
        handle: entry as FileSystemFileHandle,
      });
    }
  }

  sortNodes(nodes);
  return nodes;
}

function buildTreeFromFiles(files: FileList): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of Array.from(files)) {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) continue;

    // webkitRelativePath gives us the relative path from the selected folder
    const relativePath = file.webkitRelativePath;
    const parts = relativePath.split("/");

    // Skip the root folder name (first part)
    const pathParts = parts.slice(1);
    if (pathParts.length === 0) continue;

    let current = root;
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isFile = i === pathParts.length - 1;
      const currentPath = pathParts.slice(0, i + 1).join("/");

      let existing = current.find((n) => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          expanded: true,
          file: isFile ? file : undefined,
        };
        current.push(existing);
      }

      if (!isFile && existing.children) {
        current = existing.children;
      }
    }
  }

  sortTreeRecursive(root);
  return root;
}

function sortNodes(nodes: TreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function sortTreeRecursive(nodes: TreeNode[]): void {
  sortNodes(nodes);
  for (const node of nodes) {
    if (node.children) {
      sortTreeRecursive(node.children);
    }
  }
}

function showEmptyTreeState(): void {
  const container = document.getElementById("file-tree");
  if (!container) return;

  container.innerHTML = `
    <div class="file-tree-empty">
      <p>No folder open</p>
      <button class="file-tree-open-btn" id="file-tree-open-folder">Open Folder</button>
    </div>
  `;

  document.getElementById("file-tree-open-folder")?.addEventListener("click", openDirectory);
}

function renderTree(container: HTMLElement, nodes: TreeNode[], depth: number = 0): void {
  if (nodes.length === 0) {
    container.innerHTML = `<div class="file-tree-empty">No markdown files found</div>`;
    return;
  }

  if (depth === 0) {
    container.innerHTML = "";
  }

  for (const node of nodes) {
    const item = document.createElement("div");
    item.className = `file-tree-item ${node.type}${node.path === currentActivePath ? " active" : ""}`;
    item.style.paddingLeft = `${12 + depth * 16}px`;
    item.dataset.path = node.path;

    const icon = document.createElement("span");
    icon.className = "file-tree-icon";

    if (node.type === "folder") {
      icon.innerHTML = node.expanded
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
    } else {
      icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    }

    const name = document.createElement("span");
    name.className = "file-tree-name";
    name.textContent = node.name;

    item.appendChild(icon);
    item.appendChild(name);
    container.appendChild(item);

    if (node.type === "folder") {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        node.expanded = !node.expanded;
        const childContainer = item.nextElementSibling as HTMLElement;
        if (childContainer?.classList.contains("file-tree-children")) {
          childContainer.classList.toggle("expanded", node.expanded);
        }
        icon.innerHTML = node.expanded
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
      });

      if (node.children && node.children.length > 0) {
        const childContainer = document.createElement("div");
        childContainer.className = `file-tree-children${node.expanded ? " expanded" : ""}`;
        container.appendChild(childContainer);
        renderTree(childContainer, node.children, depth + 1);
      }
    } else {
      item.addEventListener("click", async () => {
        try {
          let content: string;

          if (node.handle) {
            // File System Access API
            const file = await node.handle.getFile();
            content = await file.text();
          } else if (node.file) {
            // Fallback: File object from input
            content = await node.file.text();
          } else {
            throw new Error("No file source available");
          }

          if (onFileOpenCallback) {
            onFileOpenCallback(node.path, content, node.handle);
          }

          setActiveFile(node.path);
        } catch (error) {
          console.error("Failed to read file:", error);
          alert("Failed to read file");
        }
      });
    }
  }
}

export function setActiveFile(path: string): void {
  currentActivePath = path;
  const container = document.getElementById("file-tree");
  if (!container) return;

  container.querySelectorAll(".file-tree-item.active").forEach((el) => {
    el.classList.remove("active");
  });

  const activeItem = container.querySelector(`[data-path="${path}"]`);
  if (activeItem) {
    activeItem.classList.add("active");
  }
}

function setupSidebarControls(): void {
  const sidebar = document.getElementById("sidebar");
  const sidebarDivider = document.getElementById("sidebar-divider");
  const refreshBtn = document.getElementById("refresh-files");
  const openFolderBtn = document.getElementById("open-folder");
  const folderInput = document.getElementById("folder-input") as HTMLInputElement;

  // Open folder button
  openFolderBtn?.addEventListener("click", openDirectory);

  // Fallback folder input handler
  folderInput?.addEventListener("change", () => {
    const files = folderInput.files;
    if (!files || files.length === 0) return;

    treeData = buildTreeFromFiles(files);
    const container = document.getElementById("file-tree");
    if (container) {
      renderTree(container, treeData);
    }
    showRefreshButton();

    // Reset input
    folderInput.value = "";
  });

  // Refresh file tree
  refreshBtn?.addEventListener("click", () => {
    if (rootDirectoryHandle) {
      refreshFileTree();
    } else {
      // For fallback mode, re-trigger folder selection
      openDirectory();
    }
  });

  // Resizable sidebar
  if (sidebarDivider && sidebar) {
    let isDragging = false;

    sidebarDivider.addEventListener("mousedown", () => {
      isDragging = true;
      sidebarDivider.classList.add("dragging");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const newWidth = e.clientX;
      if (newWidth >= 180 && newWidth <= 400) {
        sidebar.style.width = `${newWidth}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        sidebarDivider.classList.remove("dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    });
  }
}

// Export openDirectory for keyboard shortcuts
export { openDirectory };

// Store file handles for saving (only works with File System Access API)
const fileHandles = new Map<string, FileSystemFileHandle>();

export function getFileHandle(path: string): FileSystemFileHandle | undefined {
  return fileHandles.get(path);
}

export function setFileHandle(path: string, handle: FileSystemFileHandle): void {
  fileHandles.set(path, handle);
}
