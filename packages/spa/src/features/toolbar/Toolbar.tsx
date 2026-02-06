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
		<header className="flex justify-between items-center px-3 py-2 bg-bg-secondary border-b border-border gap-3">
			<div className="flex items-center gap-2">
				<OpenMenu onOpenFile={onOpenFile} onOpenFolder={onOpenFolder} />
				<button
					onClick={onSave}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border border-border rounded text-text-primary text-sm cursor-pointer hover:bg-bg-hover hover:border-accent transition-colors"
					title="Save (Ctrl+S)"
				>
					<Save size={16} />
					Save
				</button>
				<FileStatus status={fileStatus} />
			</div>
			<div className="flex items-center gap-2">
				<button
					onClick={onToggleTheme}
					className="inline-flex items-center gap-1.5 px-2 py-1 bg-bg-tertiary border border-border rounded text-text-primary text-sm cursor-pointer hover:bg-bg-hover hover:border-accent transition-colors"
					title="Toggle Theme"
				>
					{theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
				</button>
				<button
					onClick={onToggleSidebar}
					className={`inline-flex items-center gap-1.5 px-2 py-1 border border-border rounded text-sm cursor-pointer transition-colors ${
						sidebarVisible
							? "bg-accent border-accent text-black"
							: "bg-bg-tertiary text-text-primary hover:bg-bg-hover hover:border-accent"
					}`}
					title="Toggle Sidebar (Ctrl+B)"
				>
					<PanelLeft size={16} />
				</button>
				<div className="flex gap-0.5 bg-bg-primary rounded p-0.5">
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
			className={`inline-flex items-center px-2 py-1 border border-border rounded text-sm cursor-pointer transition-colors ${
				active
					? "bg-accent border-accent text-black"
					: "bg-bg-tertiary text-text-primary hover:bg-bg-hover hover:border-accent"
			} disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none`}
		>
			{children}
		</button>
	);
}
