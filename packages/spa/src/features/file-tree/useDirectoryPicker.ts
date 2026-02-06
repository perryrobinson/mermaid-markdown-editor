import { useState, useCallback, useRef } from "react";
import type { TreeNode } from "@/types/file";

export function useDirectoryPicker() {
	const [treeData, setTreeData] = useState<TreeNode[]>([]);
	const [loading, setLoading] = useState(false);
	const rootHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
	const folderInputRef = useRef<HTMLInputElement>(null);

	const useNativeApi = typeof window.showDirectoryPicker === "function";

	const openDirectory = useCallback(async () => {
		if (useNativeApi && window.showDirectoryPicker) {
			try {
				rootHandleRef.current = await window.showDirectoryPicker({
					mode: "readwrite",
				});
				setLoading(true);
				const data = await buildTreeFromHandle(
					rootHandleRef.current,
					"",
				);
				setTreeData(data);
				setLoading(false);
			} catch (error: any) {
				if (error.name === "AbortError") return;
				// Fall back to input
				folderInputRef.current?.click();
			}
		} else {
			folderInputRef.current?.click();
		}
	}, [useNativeApi]);

	const handleFolderInput = useCallback(
		(files: FileList | null) => {
			if (!files || files.length === 0) return;
			const data = buildTreeFromFiles(files);
			setTreeData(data);
		},
		[],
	);

	const refreshTree = useCallback(async () => {
		if (rootHandleRef.current) {
			setLoading(true);
			const data = await buildTreeFromHandle(
				rootHandleRef.current,
				"",
			);
			setTreeData(data);
			setLoading(false);
		}
	}, []);

	const hasDirectory = treeData.length > 0 || rootHandleRef.current !== null;

	return {
		treeData,
		loading,
		hasDirectory,
		openDirectory,
		refreshTree,
		handleFolderInput,
		folderInputRef,
	};
}

async function buildTreeFromHandle(
	dirHandle: FileSystemDirectoryHandle,
	basePath: string,
): Promise<TreeNode[]> {
	const nodes: TreeNode[] = [];

	for await (const entry of dirHandle.values()) {
		const path = basePath ? `${basePath}/${entry.name}` : entry.name;

		if (entry.kind === "directory") {
			const children = await buildTreeFromHandle(
				entry as FileSystemDirectoryHandle,
				path,
			);
			if (children.length > 0) {
				nodes.push({
					name: entry.name,
					path,
					type: "folder",
					children,
					expanded: true,
				});
			}
		} else if (
			entry.kind === "file" &&
			(entry.name.endsWith(".md") || entry.name.endsWith(".markdown"))
		) {
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
		if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown"))
			continue;

		const relativePath = file.webkitRelativePath;
		const parts = relativePath.split("/");
		const pathParts = parts.slice(1);
		if (pathParts.length === 0) continue;

		let current = root;
		for (let i = 0; i < pathParts.length; i++) {
			const part = pathParts[i];
			if (!part) continue;
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

function sortNodes(nodes: TreeNode[]) {
	nodes.sort((a, b) => {
		if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}

function sortTreeRecursive(nodes: TreeNode[]) {
	sortNodes(nodes);
	for (const node of nodes) {
		if (node.children) sortTreeRecursive(node.children);
	}
}
