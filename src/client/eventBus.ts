import type { Tab } from "./tabs";

export type ViewMode = "split" | "editor" | "preview";

type AppEvents = {
	"editor:change": { content: string };
	"tab:switch": { tab: Tab };
	"tab:add": { tab: Tab };
	"tab:remove": { tabId: string };
	"tab:allClosed": void;
	"tab:dirty": { tabId: string };
	"file:open": {
		path: string;
		content: string;
		handle?: FileSystemFileHandle;
	};
	"file:save": void;
	"file:saved": { path: string };
	"file:externalChange": { path: string; content: string };
	"theme:change": { theme: "light" | "dark" };
	"view:modeChange": { mode: ViewMode };
};

type EventHandler<T> = T extends void ? () => void : (data: T) => void;

class EventBus {
	private handlers = new Map<string, Set<Function>>();

	on<K extends keyof AppEvents>(
		event: K,
		handler: EventHandler<AppEvents[K]>,
	): void {
		if (!this.handlers.has(event)) {
			this.handlers.set(event, new Set());
		}
		this.handlers.get(event)!.add(handler);
	}

	off<K extends keyof AppEvents>(
		event: K,
		handler: EventHandler<AppEvents[K]>,
	): void {
		this.handlers.get(event)?.delete(handler);
	}

	emit<K extends keyof AppEvents>(
		event: K,
		...args: AppEvents[K] extends void ? [] : [AppEvents[K]]
	): void {
		const handlers = this.handlers.get(event);
		if (!handlers) return;
		for (const handler of handlers) {
			(handler as Function)(...args);
		}
	}
}

export const bus = new EventBus();
export type { AppEvents };
