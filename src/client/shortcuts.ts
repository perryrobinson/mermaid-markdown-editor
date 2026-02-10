interface Shortcut {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	handler: (e: KeyboardEvent) => void;
}

const shortcuts: Shortcut[] = [];

export function registerShortcut(
	combo: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean },
	handler: (e: KeyboardEvent) => void,
): void {
	shortcuts.push({ ...combo, handler });
}

export function initShortcuts(): void {
	document.addEventListener("keydown", (e) => {
		for (const s of shortcuts) {
			const ctrl = e.ctrlKey || e.metaKey;
			if (!!s.ctrl !== ctrl) continue;
			if (!!s.shift !== e.shiftKey) continue;
			if (!!s.alt !== e.altKey) continue;
			if (e.key !== s.key) continue;

			e.preventDefault();
			s.handler(e);
			return;
		}
	});
}
