import { useEffect } from "react";

interface ShortcutHandlers {
	onSave?: () => void;
	onOpenFile?: () => void;
	onOpenFolder?: () => void;
	onToggleSidebar?: () => void;
	onCycleViewMode?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			const mod = e.ctrlKey || e.metaKey;
			if (!mod) return;

			if (e.key === "s") {
				e.preventDefault();
				handlers.onSave?.();
			} else if (e.key === "o" && !e.shiftKey) {
				e.preventDefault();
				handlers.onOpenFile?.();
			} else if (e.key === "O" && e.shiftKey) {
				e.preventDefault();
				handlers.onOpenFolder?.();
			} else if (e.key === "b") {
				e.preventDefault();
				handlers.onToggleSidebar?.();
			} else if (e.key === "\\") {
				e.preventDefault();
				handlers.onCycleViewMode?.();
			}
		}

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handlers]);
}
