import { useState } from "react";
import {
	ChevronDown,
	ChevronRight,
	FileText,
	FolderOpen,
} from "lucide-react";
import type { TreeNode } from "@/types/file";

interface FileTreeProps {
	nodes: TreeNode[];
	activePath: string | null;
	loading: boolean;
	hasDirectory: boolean;
	onFileClick: (node: TreeNode) => void;
	onOpenDirectory: () => void;
}

export function FileTree({
	nodes,
	activePath,
	loading,
	hasDirectory,
	onFileClick,
	onOpenDirectory,
}: FileTreeProps) {
	if (loading) {
		return (
			<div className="p-5 text-center text-text-secondary text-sm">
				Loading...
			</div>
		);
	}

	if (!hasDirectory) {
		return (
			<div className="p-5 text-center text-text-muted text-sm">
				<p className="mb-3">No folder open</p>
				<button
					type="button"
					onClick={onOpenDirectory}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent border-none rounded-md text-white text-xs font-medium cursor-pointer hover:bg-accent-hover transition-colors"
				>
					<FolderOpen size={14} />
					Open Folder
				</button>
			</div>
		);
	}

	if (nodes.length === 0) {
		return (
			<div className="p-5 text-center text-text-muted text-sm">
				No markdown files found
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto py-2">
			<TreeNodeList
				nodes={nodes}
				depth={0}
				activePath={activePath}
				onFileClick={onFileClick}
			/>
		</div>
	);
}

function TreeNodeList({
	nodes,
	depth,
	activePath,
	onFileClick,
}: {
	nodes: TreeNode[];
	depth: number;
	activePath: string | null;
	onFileClick: (node: TreeNode) => void;
}) {
	return (
		<>
			{nodes.map((node) => (
				<TreeNodeItem
					key={node.path}
					node={node}
					depth={depth}
					activePath={activePath}
					onFileClick={onFileClick}
				/>
			))}
		</>
	);
}

function TreeNodeItem({
	node,
	depth,
	activePath,
	onFileClick,
}: {
	node: TreeNode;
	depth: number;
	activePath: string | null;
	onFileClick: (node: TreeNode) => void;
}) {
	const [expanded, setExpanded] = useState(node.expanded ?? true);
	const isActive = node.path === activePath;

	if (node.type === "folder") {
		return (
			<>
				<div
					className={`flex items-center py-1 px-3 cursor-pointer text-sm text-text-secondary font-medium whitespace-nowrap overflow-hidden text-ellipsis hover:bg-bg-hover hover:text-text-primary transition-colors`}
					style={{ paddingLeft: `${12 + depth * 16}px` }}
					onClick={() => setExpanded(!expanded)}
				>
					<span className="w-4 h-4 mr-1.5 flex-shrink-0 flex items-center justify-center">
						{expanded ? (
							<ChevronDown size={14} />
						) : (
							<ChevronRight size={14} />
						)}
					</span>
					<span className="overflow-hidden text-ellipsis">
						{node.name}
					</span>
				</div>
				{expanded && node.children && (
					<TreeNodeList
						nodes={node.children}
						depth={depth + 1}
						activePath={activePath}
						onFileClick={onFileClick}
					/>
				)}
			</>
		);
	}

	return (
		<div
			className={`flex items-center py-1 px-3 cursor-pointer text-sm whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
				isActive
					? "bg-accent-subtle text-accent"
					: "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
			}`}
			style={{ paddingLeft: `${12 + depth * 16}px` }}
			onClick={() => onFileClick(node)}
		>
			<span className="w-4 h-4 mr-1.5 flex-shrink-0 flex items-center justify-center">
				<FileText size={14} />
			</span>
			<span className="overflow-hidden text-ellipsis">{node.name}</span>
		</div>
	);
}
