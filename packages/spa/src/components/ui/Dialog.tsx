import type { ReactNode } from "react";

interface DialogProps {
	children: ReactNode;
	onClose?: () => void;
}

export function Dialog({ children, onClose }: DialogProps) {
	return (
		<div
			className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose?.();
			}}
		>
			<div
				className="bg-bg-secondary rounded-xl border border-border p-6 max-w-[500px] w-[90%] animate-[fadeIn_150ms_ease-out]"
				style={{ boxShadow: "0 8px 32px var(--color-shadow-lg)" }}
			>
				{children}
			</div>
		</div>
	);
}
