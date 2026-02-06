import {
	Save,
	Sun,
	Moon,
	PanelLeft,
	Columns2,
	FileCode,
	Eye,
} from "lucide-react";
import { OpenMenu } from "./OpenMenu";
import { FileStatus } from "./FileStatus";
import type { ViewMode, FileStatus as FileStatusType, Theme } from "@/types/file";

interface ToolbarProps {
	fileStatus: FileStatusType;
	theme: Theme;
	sidebarVisible: boolean;
	viewMode: ViewMode;
	viewModeEnabled: boolean;
	onSave: () => void;
	onOpenFile: () => void;
	onOpenFolder: () => void;
	onToggleTheme: () => void;
	onToggleSidebar: () => void;
	onSetViewMode: (mode: ViewMode) => void;
}

export function Toolbar({
	fileStatus,
	theme,
	sidebarVisible,
	viewMode,
	viewModeEnabled,
	onSave,
	onOpenFile,
	onOpenFolder,
	onToggleTheme,
	onToggleSidebar,
	onSetViewMode,
}: ToolbarProps) {
	return (
		<header className="flex justify-between items-center px-4 py-2.5 bg-bg-secondary border-b border-border gap-3">
			<div className="flex items-center gap-2">
				<OpenMenu onOpenFile={onOpenFile} onOpenFolder={onOpenFolder} />
				<button
					onClick={onSave}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent border border-accent rounded-md text-white text-sm cursor-pointer hover:bg-accent-hover hover:border-accent-hover transition-colors"
					title="Save (Ctrl+S)"
				>
					<Save size={16} />
					Save
				</button>
				<div className="w-px h-5 bg-border-subtle" />
				<FileStatus status={fileStatus} />
			</div>
			<div className="flex items-center gap-2">
				<button
					onClick={onToggleTheme}
					className="inline-flex items-center justify-center w-8 h-8 bg-transparent border-none rounded-md text-text-secondary cursor-pointer hover:bg-bg-hover hover:text-text-primary transition-colors"
					title="Toggle Theme"
				>
					{theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
				</button>
				<button
					onClick={onToggleSidebar}
					className={`inline-flex items-center justify-center w-8 h-8 border-none rounded-md cursor-pointer transition-colors ${
						sidebarVisible
							? "bg-accent-subtle text-accent"
							: "bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary"
					}`}
					title="Toggle Sidebar (Ctrl+B)"
				>
					<PanelLeft size={16} />
				</button>
				<div className="flex gap-0.5 bg-bg-tertiary rounded-md p-0.5">
					<ViewModeButton
						active={viewMode === "split"}
						disabled={!viewModeEnabled}
						onClick={() => onSetViewMode("split")}
						title="Split View"
					>
						<Columns2 size={16} />
					</ViewModeButton>
					<ViewModeButton
						active={viewMode === "editor"}
						disabled={!viewModeEnabled}
						onClick={() => onSetViewMode("editor")}
						title="Editor Only"
					>
						<FileCode size={16} />
					</ViewModeButton>
					<ViewModeButton
						active={viewMode === "preview"}
						disabled={!viewModeEnabled}
						onClick={() => onSetViewMode("preview")}
						title="Preview Only"
					>
						<Eye size={16} />
					</ViewModeButton>
				</div>
			</div>
		</header>
	);
}

function ViewModeButton({
	children,
	active,
	disabled,
	onClick,
	title,
}: {
	children: React.ReactNode;
	active: boolean;
	disabled: boolean;
	onClick: () => void;
	title: string;
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={`inline-flex items-center justify-center w-8 h-8 border-none rounded-md text-sm cursor-pointer transition-colors ${
				active
					? "bg-bg-primary text-accent shadow-sm"
					: "bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary"
			} disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none`}
		>
			{children}
		</button>
	);
}
