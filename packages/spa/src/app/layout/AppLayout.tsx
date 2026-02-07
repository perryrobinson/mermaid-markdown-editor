import { useState, useCallback, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useResizable } from "@/hooks/useResizable";
import { CodeEditor, type CodeEditorHandle } from "@/features/editor/CodeEditor";
import { MarkdownPreview } from "@/features/preview/MarkdownPreview";
import { EmptyState } from "@/features/preview/EmptyState";
import { useTabManager } from "@/features/tabs/useTabManager";
import { TabBar } from "@/features/tabs/TabBar";
import { useDirectoryPicker } from "@/features/file-tree/useDirectoryPicker";
import { FileTree } from "@/features/file-tree/FileTree";
import { useDragDrop } from "@/features/files/useDragDrop";
import { DropOverlay } from "@/features/files/DropOverlay";
import { Toolbar } from "@/features/toolbar/Toolbar";
import { Dialog } from "@/components/ui/Dialog";
import { saveFile } from "@/lib/api";
import type { ViewMode, FileStatus, TreeNode } from "@/types/file";

// Map to store file handles for saving (File System Access API)
const fileHandles = new Map<string, FileSystemFileHandle>();

export function AppLayout() {
	const { theme, toggleTheme } = useTheme();
	const { addListener } = useWebSocket();
	const editorRef = useRef<CodeEditorHandle>(null);

	// State
	const [viewMode, setViewMode] = useState<ViewMode>("preview");
	const [sidebarVisible, setSidebarVisible] = useState(true);
	const [fileStatus, setFileStatus] = useState<FileStatus>("saved");
	const [viewModeEnabled, setViewModeEnabled] = useState(false);
	const [currentContent, setCurrentContent] = useState("");
	const [sidebarWidth, setSidebarWidth] = useState(240);
	const [activePath, setActivePath] = useState<string | null>(null);

	// Tab management
	const {
		tabs,
		activeTab,
		activeTabId,
		addTab,
		removeTab,
		switchToTab,
		findTabByPath,
		updateTab,
		markDirty,
		markSaved,
	} = useTabManager();

	// File tree
	const {
		treeData,
		loading: treeLoading,
		hasDirectory,
		openDirectory,
		refreshTree,
		handleFolderInput,
		folderInputRef,
	} = useDirectoryPicker();

	// Conflict dialog state
	const [conflictDialog, setConflictDialog] = useState<{
		path: string;
		remoteContent: string;
		tabId: string;
	} | null>(null);

	// Close confirm dialog state
	const [closeConfirm, setCloseConfirm] = useState<{
		tabId: string;
		tabName: string;
	} | null>(null);

	// File input ref
	const fileInputRef = useRef<HTMLInputElement>(null);

	// --- File open handler ---
	const openFile = useCallback(
		(path: string, content: string, mtime?: number, handle?: FileSystemFileHandle) => {
			const existing = findTabByPath(path);
			if (existing) {
				switchToTab(existing.id);
				setActivePath(path);
				setViewModeEnabled(true);
				setViewMode("preview");
				return;
			}

			if (handle) {
				fileHandles.set(path, handle);
			}

			const tab = addTab(path, content, mtime);
			editorRef.current?.setContent(content);
			setCurrentContent(content);
			setFileStatus("saved");
			setActivePath(path);
			setViewModeEnabled(true);
			setViewMode("preview");
		},
		[findTabByPath, switchToTab, addTab],
	);

	// --- Tab switch handler ---
	useEffect(() => {
		if (activeTab) {
			editorRef.current?.setContent(activeTab.content);
			setCurrentContent(activeTab.content);
			setFileStatus(activeTab.dirty ? "dirty" : "saved");
			setActivePath(activeTab.path);
		} else {
			editorRef.current?.setContent("");
			setCurrentContent("");
			setFileStatus("saved");
			setActivePath(null);
			setViewModeEnabled(false);
			setViewMode("preview");
		}
	}, [activeTabId]); // Intentionally depend on activeTabId, not activeTab

	// --- Editor change handler ---
	const handleEditorChange = useCallback(
		(content: string) => {
			markDirty(content);
			setCurrentContent(content);
			setFileStatus("dirty");
		},
		[markDirty],
	);

	// --- Save handler ---
	const handleSave = useCallback(async () => {
		if (!activeTab) return;

		try {
			setFileStatus("syncing");
			const handle = fileHandles.get(activeTab.path);
			if (handle) {
				const writable = await handle.createWritable();
				await writable.write(activeTab.content);
				await writable.close();
				markSaved();
				setFileStatus("saved");
			} else {
				const data = await saveFile(activeTab.path, activeTab.content);
				markSaved(data.mtime);
				setFileStatus("saved");
			}
		} catch {
			setFileStatus("dirty");
			alert("Failed to save file");
		}
	}, [activeTab, markSaved]);

	// --- Tab close handler (with dirty check) ---
	const handleTabClose = useCallback(
		(id: string) => {
			const tab = tabs.find((t) => t.id === id);
			if (tab?.dirty) {
				setCloseConfirm({
					tabId: id,
					tabName: tab.path.split("/").pop() || tab.path,
				});
			} else {
				removeTab(id);
			}
		},
		[tabs, removeTab],
	);

	// --- WebSocket file change handler ---
	useEffect(() => {
		return addListener((event) => {
			const tab = findTabByPath(event.path);
			if (!tab) return;

			if (tab.dirty) {
				setConflictDialog({
					path: event.path,
					remoteContent: event.content,
					tabId: tab.id,
				});
			} else {
				updateTab(tab.id, { content: event.content });
				if (activeTabId === tab.id) {
					editorRef.current?.setContent(event.content);
					setCurrentContent(event.content);
				}
			}
		});
	}, [addListener, findTabByPath, activeTabId, updateTab]);

	// --- File tree click handler ---
	const handleFileTreeClick = useCallback(
		async (node: TreeNode) => {
			try {
				let content: string;
				if (node.handle) {
					const file = await node.handle.getFile();
					content = await file.text();
				} else if (node.file) {
					content = await node.file.text();
				} else {
					throw new Error("No file source");
				}
				openFile(node.path, content, undefined, node.handle);
			} catch {
				alert("Failed to read file");
			}
		},
		[openFile],
	);

	// --- Drag/drop handler ---
	const handleDrop = useCallback(
		async (files: File[]) => {
			for (const file of files) {
				const content = await file.text();
				openFile(file.name, content, file.lastModified);
			}
		},
		[openFile],
	);
	const { isDragging } = useDragDrop(handleDrop);

	// --- File input handler ---
	const handleFileInput = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (!files) return;
			for (const file of Array.from(files)) {
				const content = await file.text();
				openFile(file.name, content, file.lastModified);
			}
			e.target.value = "";
		},
		[openFile],
	);

	// --- Sidebar resize ---
	const { onMouseDown: onSidebarResizeMouseDown } = useResizable({
		direction: "horizontal",
		min: 180,
		max: 400,
		onResize: setSidebarWidth,
	});

	// --- Editor/preview resize ---
	const [editorWidthPercent, setEditorWidthPercent] = useState<number | null>(null);
	const splitPaneRef = useRef<HTMLDivElement>(null);
	const { onMouseDown: onDividerMouseDown } = useResizable({
		direction: "horizontal",
		min: 200,
		max: 9999,
		onResize: (newWidth) => {
			if (splitPaneRef.current) {
				const containerWidth = splitPaneRef.current.offsetWidth;
				const minWidth = 200;
				const maxWidth = containerWidth - minWidth - 4;
				if (newWidth >= minWidth && newWidth <= maxWidth) {
					setEditorWidthPercent((newWidth / containerWidth) * 100);
				}
			}
		},
	});

	// --- Keyboard shortcuts ---
	useKeyboardShortcuts({
		onSave: handleSave,
		onOpenFile: () => fileInputRef.current?.click(),
		onOpenFolder: openDirectory,
		onToggleSidebar: () => setSidebarVisible((v) => !v),
		onCycleViewMode: () => {
			if (!viewModeEnabled) return;
			const modes: ViewMode[] = ["split", "editor", "preview"];
			const idx = modes.indexOf(viewMode);
			setViewMode(modes[(idx + 1) % modes.length]!);
		},
	});

	const showEditor = viewMode === "split" || viewMode === "editor";
	const showPreview = viewMode === "split" || viewMode === "preview";

	return (
		<div className="h-full flex flex-col">
			<Toolbar
				fileStatus={fileStatus}
				theme={theme}
				sidebarVisible={sidebarVisible}
				viewMode={viewMode}
				viewModeEnabled={viewModeEnabled}
				onSave={handleSave}
				onOpenFile={() => fileInputRef.current?.click()}
				onOpenFolder={openDirectory}
				onToggleTheme={toggleTheme}
				onToggleSidebar={() => setSidebarVisible((v) => !v)}
				onSetViewMode={setViewMode}
			/>

			<TabBar
				tabs={tabs}
				activeTabId={activeTabId}
				onSwitch={switchToTab}
				onClose={handleTabClose}
			/>

			<main className="flex-1 overflow-hidden flex">
				{/* Sidebar */}
				{sidebarVisible && (
					<>
						<aside
							className="bg-bg-secondary border-r border-border flex flex-col overflow-hidden"
							style={{
								width: sidebarWidth,
								minWidth: 180,
								maxWidth: 400,
							}}
						>
							<div className="flex justify-between items-center px-3 py-2 bg-bg-tertiary border-b border-border text-xs font-semibold uppercase tracking-wide text-text-secondary">
								<span>Explorer</span>
								<div className="flex gap-1">
									{hasDirectory && (
										<button
											onClick={refreshTree}
											className="flex items-center justify-center w-6 h-6 bg-transparent border-none rounded text-text-secondary cursor-pointer hover:bg-bg-hover hover:text-text-primary transition-colors"
											title="Refresh"
										>
											<RefreshCw size={14} />
										</button>
									)}
								</div>
							</div>
							<FileTree
								nodes={treeData}
								activePath={activePath}
								loading={treeLoading}
								hasDirectory={hasDirectory}
								onFileClick={handleFileTreeClick}
								onOpenDirectory={openDirectory}
							/>
						</aside>
						<div
							className="w-1 bg-border cursor-col-resize hover:bg-accent transition-colors"
							onMouseDown={(e) =>
								onSidebarResizeMouseDown(e, sidebarWidth)
							}
						/>
					</>
				)}

				{/* Split pane */}
				<div ref={splitPaneRef} className="flex h-full flex-1 min-w-0">
					{showEditor && (
						<div
							className="min-w-[200px] overflow-hidden flex flex-col"
							style={
								viewMode === "split" && editorWidthPercent != null
									? {
											flex: "none",
											width: `${editorWidthPercent}%`,
										}
									: { flex: 1 }
							}
						>
							<CodeEditor
								ref={editorRef}
								onChange={handleEditorChange}
							/>
						</div>
					)}

					{viewMode === "split" && (
						<div
							className="w-1 bg-border cursor-col-resize hover:bg-accent transition-colors"
							onMouseDown={(e) => {
								const editorPane = splitPaneRef.current
									?.firstElementChild as HTMLElement;
								if (editorPane) {
									onDividerMouseDown(
										e,
										editorPane.offsetWidth,
									);
								}
							}}
							onDoubleClick={() => setEditorWidthPercent(null)}
						/>
					)}

					{showPreview && (
						<div
							className="min-w-[200px] overflow-auto bg-bg-primary"
							style={
								viewMode === "split" && editorWidthPercent != null
									? {
											flex: "none",
											width: `${100 - editorWidthPercent - 0.3}%`,
										}
									: { flex: 1 }
							}
						>
							{activeTab ? (
								<MarkdownPreview content={currentContent} />
							) : (
								<EmptyState
									onOpenFile={() =>
										fileInputRef.current?.click()
									}
									onOpenFolder={openDirectory}
								/>
							)}
						</div>
					)}
				</div>
			</main>

			{/* Hidden file inputs */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".md,.markdown"
				multiple
				className="hidden"
				onChange={handleFileInput}
			/>
			<input
				ref={folderInputRef}
				type="file"
				// @ts-expect-error webkitdirectory is non-standard
				webkitdirectory=""
				className="hidden"
				onChange={(e) => handleFolderInput(e.target.files)}
			/>

			{/* Drop overlay */}
			<DropOverlay visible={isDragging} />

			{/* Conflict dialog */}
			{conflictDialog && (
				<Dialog onClose={() => setConflictDialog(null)}>
					<h3 className="mb-3 text-warning text-lg font-semibold">
						File Changed Externally
					</h3>
					<p className="mb-5 text-text-secondary leading-relaxed">
						The file &quot;{conflictDialog.path}&quot; has been
						modified outside the editor. What would you like to do?
					</p>
					<div className="flex gap-3 justify-end">
						<button
							onClick={() => setConflictDialog(null)}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border border-border rounded text-text-primary text-sm cursor-pointer hover:bg-bg-hover transition-colors"
						>
							Keep My Changes
						</button>
						<button
							onClick={() => {
								updateTab(conflictDialog.tabId, {
									content: conflictDialog.remoteContent,
									dirty: false,
								});
								if (
									activeTabId === conflictDialog.tabId
								) {
									editorRef.current?.setContent(
										conflictDialog.remoteContent,
									);
									setCurrentContent(
										conflictDialog.remoteContent,
									);
									setFileStatus("saved");
								}
								setConflictDialog(null);
							}}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent border border-accent rounded text-black text-sm cursor-pointer hover:bg-accent-hover transition-colors"
						>
							Load External Changes
						</button>
					</div>
				</Dialog>
			)}

			{/* Close confirm dialog */}
			{closeConfirm && (
				<Dialog onClose={() => setCloseConfirm(null)}>
					<h3 className="mb-3 text-text-primary text-lg font-semibold">
						Unsaved Changes
					</h3>
					<p className="mb-5 text-text-secondary leading-relaxed">
						&quot;{closeConfirm.tabName}&quot; has unsaved changes.
						Close anyway?
					</p>
					<div className="flex gap-3 justify-end">
						<button
							onClick={() => setCloseConfirm(null)}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border border-border rounded text-text-primary text-sm cursor-pointer hover:bg-bg-hover transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={() => {
								removeTab(closeConfirm.tabId);
								setCloseConfirm(null);
							}}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-error border border-error rounded text-white text-sm cursor-pointer hover:bg-red-700 transition-colors"
						>
							Close Without Saving
						</button>
					</div>
				</Dialog>
			)}
		</div>
	);
}
