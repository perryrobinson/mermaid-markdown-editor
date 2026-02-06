import type { FileStatus as FileStatusType } from "@/types/file";

interface FileStatusProps {
	status: FileStatusType;
}

export function FileStatus({ status }: FileStatusProps) {
	const config = {
		dirty: { icon: "●", color: "text-warning", label: "Unsaved changes" },
		saved: { icon: "✓", color: "text-success", label: "Saved" },
		syncing: { icon: "↻", color: "text-accent", label: "Saving..." },
	};

	const { icon, color, label } = config[status];

	return (
		<span className="text-xs text-text-secondary pl-2">
			<span className={`${color} mr-1 ${status === "syncing" ? "inline-block animate-spin" : ""}`}>
				{icon}
			</span>
			{label}
		</span>
	);
}
