import { FileText, FolderOpen } from "lucide-react";

interface EmptyStateProps {
	onOpenFile: () => void;
	onOpenFolder: () => void;
}

export function EmptyState({ onOpenFile, onOpenFolder }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center h-full text-text-muted text-center p-10">
			<FileText size={64} strokeWidth={1.5} className="mb-4 opacity-50" />
			<h2 className="mb-2 text-text-secondary text-xl">No file open</h2>
			<p className="max-w-[400px] leading-relaxed">
				Open a markdown file to get started
			</p>
			<div className="flex gap-3 mt-5">
				<button
					onClick={onOpenFile}
					className="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-tertiary border border-border rounded text-text-primary text-sm cursor-pointer hover:bg-bg-hover hover:border-accent transition-colors"
				>
					<FileText size={16} />
					Open File
				</button>
				<button
					onClick={onOpenFolder}
					className="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-tertiary border border-border rounded text-text-primary text-sm cursor-pointer hover:bg-bg-hover hover:border-accent transition-colors"
				>
					<FolderOpen size={16} />
					Open Folder
				</button>
			</div>
		</div>
	);
}
