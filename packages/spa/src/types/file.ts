export interface Tab {
	id: string;
	path: string;
	content: string;
	dirty: boolean;
	mtime?: number;
}

export interface TreeNode {
	name: string;
	path: string;
	type: "file" | "folder";
	children?: TreeNode[];
	expanded?: boolean;
	file?: File;
	handle?: FileSystemFileHandle;
}

export type ViewMode = "split" | "editor" | "preview";

export type FileStatus = "dirty" | "saved" | "syncing";

export type Theme = "light" | "dark";
