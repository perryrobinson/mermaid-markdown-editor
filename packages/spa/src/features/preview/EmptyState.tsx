import { FileText, FolderOpen } from "lucide-react";

interface EmptyStateProps {
	onOpenFile: () => void;
	onOpenFolder: () => void;
}

export function EmptyState({ onOpenFile, onOpenFolder }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center h-full text-text-muted text-center p-10">
			<div className="w-20 h-20 rounded-2xl bg-accent-subtle flex items-center justify-center mb-6">
				<FileText size={40} strokeWidth={1.5} className="text-accent" />
			</div>
			<h2 className="mb-2 text-text-primary text-2xl font-semibold">
				No file open
			</h2>
			<p className="max-w-[400px] leading-relaxed mb-6">
				Open a markdown file to get started
			</p>
			<div className="flex gap-3">
				<button
					onClick={onOpenFile}
					className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent border-none rounded-lg text-white text-sm cursor-pointer hover:bg-accent-hover transition-colors"
				>
					<FileText size={16} />
					Open File
				</button>
				<button
					onClick={onOpenFolder}
					className="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-tertiary border-none rounded-lg text-text-primary text-sm cursor-pointer hover:bg-bg-hover transition-colors"
				>
					<FolderOpen size={16} />
					Open Folder
				</button>
			</div>
			<div className="flex gap-6 mt-5 text-xs text-text-muted">
				<span>
					<kbd className="inline-block px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[11px] font-mono">
						Ctrl+O
					</kbd>{" "}
					Open file
				</span>
				<span>
					<kbd className="inline-block px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[11px] font-mono">
						Ctrl+Shift+O
					</kbd>{" "}
					Open folder
				</span>
			</div>
		</div>
	);
}
