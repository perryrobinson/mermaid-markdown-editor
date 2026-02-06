import { Check, Circle, RefreshCw } from "lucide-react";
import type { FileStatus as FileStatusType } from "@/types/file";

interface FileStatusProps {
	status: FileStatusType;
}

export function FileStatus({ status }: FileStatusProps) {
	const config = {
		dirty: {
			icon: <Circle size={12} />,
			className: "bg-warning/10 text-warning",
			label: "Unsaved",
		},
		saved: {
			icon: <Check size={12} />,
			className: "bg-success/10 text-success",
			label: "Saved",
		},
		syncing: {
			icon: <RefreshCw size={12} className="animate-spin" />,
			className: "bg-accent/10 text-accent",
			label: "Saving...",
		},
	};

	const { icon, className, label } = config[status];

	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
		>
			{icon}
			{label}
		</span>
	);
}
