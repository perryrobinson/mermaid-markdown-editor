import type { ReactNode } from "react";

interface DialogProps {
	children: ReactNode;
	onClose?: () => void;
}

export function Dialog({ children, onClose }: DialogProps) {
	return (
		<div
			className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000]"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose?.();
			}}
		>
			<div className="bg-bg-secondary rounded-lg p-6 max-w-[500px] w-[90%]">
				{children}
			</div>
		</div>
	);
}
