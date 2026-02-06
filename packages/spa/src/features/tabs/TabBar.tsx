import { X } from "lucide-react";
import type { Tab } from "@/types/file";

interface TabBarProps {
	tabs: Tab[];
	activeTabId: string | null;
	onSwitch: (id: string) => void;
	onClose: (id: string) => void;
}

export function TabBar({ tabs, activeTabId, onSwitch, onClose }: TabBarProps) {
	if (tabs.length === 0) return null;

	return (
		<div className="flex bg-bg-secondary border-b border-border overflow-x-auto">
			<div className="flex min-h-[35px]">
				{tabs.map((tab) => (
					<div
						key={tab.id}
						className={`flex items-center gap-2 px-3 border-r border-border text-sm cursor-pointer whitespace-nowrap max-w-[200px] transition-colors ${
							tab.id === activeTabId
								? "bg-bg-primary text-text-primary border-b-2 border-b-accent"
								: "bg-bg-tertiary text-text-secondary hover:bg-bg-hover"
						}`}
						onClick={() => onSwitch(tab.id)}
						onAuxClick={(e) => {
							if (e.button === 1) onClose(tab.id);
						}}
					>
						<span
							className="overflow-hidden text-ellipsis"
							title={tab.path}
						>
							{tab.dirty && (
								<span className="text-warning mr-0.5">
									{"● "}
								</span>
							)}
							{getTabName(tab.path)}
						</span>
						<span
							className="flex items-center justify-center w-[18px] h-[18px] rounded opacity-60 hover:opacity-100 hover:bg-bg-hover transition-all"
							onClick={(e) => {
								e.stopPropagation();
								onClose(tab.id);
							}}
						>
							<X size={12} />
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function getTabName(path: string): string {
	return path.split("/").pop() || path;
}
