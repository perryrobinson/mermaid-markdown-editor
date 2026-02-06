import { useState, useCallback, useRef } from "react";
import type { Tab } from "@/types/file";

export function useTabManager() {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<string | null>(null);
	const nextId = useRef(1);

	const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

	const addTab = useCallback(
		(path: string, content: string, mtime?: number): Tab => {
			const tab: Tab = {
				id: `tab-${nextId.current++}`,
				path,
				content,
				dirty: false,
				mtime,
			};
			setTabs((prev) => [...prev, tab]);
			setActiveTabId(tab.id);
			saveRecentFiles([...tabs.map((t) => t.path), path]);
			return tab;
		},
		[tabs],
	);

	const removeTab = useCallback(
		(id: string) => {
			setTabs((prev) => {
				const index = prev.findIndex((t) => t.id === id);
				if (index === -1) return prev;
				const next = prev.filter((t) => t.id !== id);
				// If closing active tab, switch to another
				if (activeTabId === id) {
					if (next.length > 0) {
						const newIndex = Math.min(index, next.length - 1);
						setActiveTabId(next[newIndex]?.id ?? null);
					} else {
						setActiveTabId(null);
					}
				}
				saveRecentFiles(next.map((t) => t.path));
				return next;
			});
		},
		[activeTabId],
	);

	const switchToTab = useCallback((id: string) => {
		setActiveTabId(id);
	}, []);

	const findTabByPath = useCallback(
		(path: string) => {
			return tabs.find((t) => t.path === path);
		},
		[tabs],
	);

	const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
		setTabs((prev) =>
			prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
		);
	}, []);

	const markDirty = useCallback(
		(content: string) => {
			if (!activeTabId) return;
			setTabs((prev) =>
				prev.map((t) =>
					t.id === activeTabId
						? { ...t, content, dirty: true }
						: t,
				),
			);
		},
		[activeTabId],
	);

	const markSaved = useCallback(
		(mtime?: number) => {
			if (!activeTabId) return;
			setTabs((prev) =>
				prev.map((t) =>
					t.id === activeTabId
						? { ...t, dirty: false, mtime: mtime ?? t.mtime }
						: t,
				),
			);
		},
		[activeTabId],
	);

	const hasDirtyTabs = tabs.some((t) => t.dirty);

	return {
		tabs,
		activeTab,
		activeTabId,
		addTab,
		removeTab,
		switchToTab,
		findTabByPath,
		updateTab,
		markDirty,
		markSaved,
		hasDirtyTabs,
	};
}

function saveRecentFiles(paths: string[]) {
	try {
		localStorage.setItem(
			"mermaid-editor-recent",
			JSON.stringify(paths.slice(-10)),
		);
	} catch {
		// Ignore
	}
}
