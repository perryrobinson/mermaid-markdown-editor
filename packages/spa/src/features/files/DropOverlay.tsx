import { Upload } from "lucide-react";

interface DropOverlayProps {
	visible: boolean;
}

export function DropOverlay({ visible }: DropOverlayProps) {
	if (!visible) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
			<div
				className="flex flex-col items-center gap-4 p-10 bg-bg-secondary border-2 border-dashed border-accent rounded-2xl text-text-primary text-lg"
				style={{ boxShadow: "0 8px 32px var(--color-shadow-lg)" }}
			>
				<Upload size={48} className="text-accent" />
				<span>Drop markdown file here</span>
			</div>
		</div>
	);
}
