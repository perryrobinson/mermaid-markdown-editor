import { useState, useEffect, useRef } from "react";
import { FolderOpen, FileText, ChevronDown } from "lucide-react";

interface OpenMenuProps {
	onOpenFile: () => void;
	onOpenFolder: () => void;
}

export function OpenMenu({ onOpenFile, onOpenFolder }: OpenMenuProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, []);

	return (
		<div ref={ref} className="relative">
			<button
				onClick={(e) => {
					e.stopPropagation();
					setOpen(!open);
				}}
				className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border border-border rounded-md text-text-primary text-sm cursor-pointer hover:bg-bg-hover hover:border-border transition-colors"
			>
				<FolderOpen size={16} />
				Open
				<ChevronDown size={12} className="opacity-70" />
			</button>
			{open && (
				<div
					className="absolute top-full left-0 mt-1 min-w-[200px] bg-bg-secondary border border-border rounded-lg py-1 z-[100] overflow-hidden animate-[fadeIn_120ms_ease-out]"
					style={{ boxShadow: "0 4px 16px var(--color-shadow-lg)" }}
				>
					<button
						onClick={() => {
							setOpen(false);
							onOpenFile();
						}}
						className="flex items-center gap-2.5 w-[calc(100%-8px)] mx-1 px-2.5 py-2 bg-transparent border-none text-text-primary text-sm cursor-pointer text-left rounded-md hover:bg-accent-subtle"
					>
						<FileText size={14} className="opacity-70" />
						Open File...
						<span className="ml-auto text-xs text-text-muted font-mono tracking-tight">
							Ctrl+O
						</span>
					</button>
					<button
						onClick={() => {
							setOpen(false);
							onOpenFolder();
						}}
						className="flex items-center gap-2.5 w-[calc(100%-8px)] mx-1 px-2.5 py-2 bg-transparent border-none text-text-primary text-sm cursor-pointer text-left rounded-md hover:bg-accent-subtle"
					>
						<FolderOpen size={14} className="opacity-70" />
						Open Folder...
						<span className="ml-auto text-xs text-text-muted font-mono tracking-tight">
							Ctrl+Shift+O
						</span>
					</button>
				</div>
			)}
		</div>
	);
}
