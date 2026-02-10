import { bus } from "./eventBus";
import { registerShortcut } from "./shortcuts";
import "./tabs.css";

export interface Tab {
	id: string;
	path: string;
	content: string;
	dirty: boolean;
	mtime?: number;
}

export class TabManager {
	private tabs: Tab[] = [];
	private activeTabId: string | null = null;
	private nextId = 1;

	// Overflow elements
	private wrapper: HTMLElement | null = null;
	private scrollLeftBtn: HTMLElement | null = null;
	private scrollRightBtn: HTMLElement | null = null;
	private listBtn: HTMLElement | null = null;
	private listDropdown: HTMLElement | null = null;
	private resizeObserver: ResizeObserver | null = null;

	constructor() {
		this.loadRecentFiles();
		this.initOverflow();
		this.renderTabs();
		this.registerShortcuts();
	}

	addTab(path: string, content: string, mtime?: number): Tab {
		const tab: Tab = {
			id: `tab-${this.nextId++}`,
			path,
			content,
			dirty: false,
			mtime,
		};

		this.tabs.push(tab);
		this.activeTabId = tab.id;
		this.saveRecentFiles();
		this.renderTabs();

		bus.emit("tab:add", { tab });
		return tab;
	}

	removeTab(id: string, force = false): void {
		const index = this.tabs.findIndex((t) => t.id === id);
		if (index === -1) return;

		const tab = this.tabs[index];
		if (!tab) return;

		if (tab.dirty && !force) {
			this.showCloseConfirmDialog(tab, () => {
				this.removeTab(id, true);
			});
			return;
		}

		this.tabs.splice(index, 1);
		bus.emit("tab:remove", { tabId: id });

		if (this.activeTabId === id) {
			if (this.tabs.length > 0) {
				const newIndex = Math.min(index, this.tabs.length - 1);
				const nextTab = this.tabs[newIndex];
				if (nextTab) this.switchToTab(nextTab.id);
			} else {
				this.activeTabId = null;
				bus.emit("tab:allClosed");
			}
		}

		this.saveRecentFiles();
		this.renderTabs();
	}

	private showCloseConfirmDialog(tab: Tab, onConfirm: () => void): void {
		const dialog = document.createElement("div");
		dialog.className = "confirm-dialog";
		dialog.innerHTML = `
      <div class="confirm-content">
        <h3>Unsaved Changes</h3>
        <p>"${this.getTabName(tab.path)}" has unsaved changes. Close anyway?</p>
        <div class="confirm-actions">
          <button class="btn" id="confirm-cancel">Cancel</button>
          <button class="btn btn-danger" id="confirm-close">Close Without Saving</button>
        </div>
      </div>
    `;

		document.body.appendChild(dialog);

		dialog.querySelector("#confirm-cancel")?.addEventListener("click", () => {
			dialog.remove();
		});

		dialog
			.querySelector("#confirm-close")
			?.addEventListener("click", () => {
				dialog.remove();
				onConfirm();
			});

		dialog.addEventListener("click", (e) => {
			if (e.target === dialog) {
				dialog.remove();
			}
		});
	}

	switchToTab(id: string): void {
		const tab = this.tabs.find((t) => t.id === id);
		if (!tab) return;

		this.activeTabId = id;
		this.renderTabs();

		bus.emit("tab:switch", { tab });
	}

	getActiveTab(): Tab | null {
		return this.tabs.find((t) => t.id === this.activeTabId) || null;
	}

	getAllTabs(): Tab[] {
		return [...this.tabs];
	}

	findTabByPath(path: string): Tab | undefined {
		return this.tabs.find((t) => t.path === path);
	}

	hasDirtyTabs(): boolean {
		return this.tabs.some((t) => t.dirty);
	}

	updateTabDisplay(): void {
		this.renderTabs();
	}

	private getTabName(path: string): string {
		return path.split("/").pop() || path;
	}

	// --- Overflow ---

	private initOverflow(): void {
		this.wrapper = document.getElementById("tabs-wrapper");
		this.scrollLeftBtn = document.getElementById("tab-scroll-left");
		this.scrollRightBtn = document.getElementById("tab-scroll-right");
		this.listBtn = document.getElementById("tab-list-btn");

		// Create dropdown
		this.listDropdown = document.createElement("div");
		this.listDropdown.className = "tab-list-dropdown";
		const tabBar = document.getElementById("tab-bar");
		if (tabBar) {
			tabBar.style.position = "relative";
			tabBar.appendChild(this.listDropdown);
		}

		// Scroll buttons
		this.scrollLeftBtn?.addEventListener("click", () => {
			this.wrapper?.querySelector(".tabs")?.scrollBy({ left: -200, behavior: "smooth" });
		});
		this.scrollRightBtn?.addEventListener("click", () => {
			this.wrapper?.querySelector(".tabs")?.scrollBy({ left: 200, behavior: "smooth" });
		});

		// Mouse wheel on wrapper
		this.wrapper?.addEventListener("wheel", (e) => {
			const tabs = this.wrapper?.querySelector(".tabs");
			if (!tabs) return;
			e.preventDefault();
			tabs.scrollLeft += e.deltaY;
		}, { passive: false });

		// Tab list dropdown toggle
		this.listBtn?.addEventListener("click", (e) => {
			e.stopPropagation();
			this.toggleDropdown();
		});

		// Close dropdown on outside click
		document.addEventListener("click", () => {
			this.listDropdown?.classList.remove("open");
		});

		// Scroll event for updating button states
		const tabsEl = this.wrapper?.querySelector(".tabs");
		tabsEl?.addEventListener("scroll", () => {
			this.updateScrollButtons();
		});

		// ResizeObserver
		if (this.wrapper) {
			this.resizeObserver = new ResizeObserver(() => {
				this.updateOverflowState();
			});
			this.resizeObserver.observe(this.wrapper);
		}
	}

	private updateOverflowState(): void {
		const tabsEl = this.wrapper?.querySelector(".tabs") as HTMLElement;
		if (!tabsEl) return;

		const isOverflowing = tabsEl.scrollWidth > tabsEl.clientWidth;

		this.scrollLeftBtn?.classList.toggle("visible", isOverflowing);
		this.scrollRightBtn?.classList.toggle("visible", isOverflowing);
		this.listBtn?.classList.toggle("visible", this.tabs.length > 0);

		this.updateScrollButtons();
	}

	private updateScrollButtons(): void {
		const tabsEl = this.wrapper?.querySelector(".tabs") as HTMLElement;
		if (!tabsEl) return;

		const atStart = tabsEl.scrollLeft <= 0;
		const atEnd =
			tabsEl.scrollLeft + tabsEl.clientWidth >= tabsEl.scrollWidth - 1;

		if (this.scrollLeftBtn) {
			(this.scrollLeftBtn as HTMLButtonElement).disabled = atStart;
		}
		if (this.scrollRightBtn) {
			(this.scrollRightBtn as HTMLButtonElement).disabled = atEnd;
		}
	}

	private scrollActiveTabIntoView(): void {
		const tabsEl = this.wrapper?.querySelector(".tabs") as HTMLElement;
		if (!tabsEl) return;

		const activeEl = tabsEl.querySelector(".tab.active") as HTMLElement;
		if (!activeEl) return;

		const tabsRect = tabsEl.getBoundingClientRect();
		const activeRect = activeEl.getBoundingClientRect();

		if (activeRect.left < tabsRect.left) {
			tabsEl.scrollBy({
				left: activeRect.left - tabsRect.left - 8,
				behavior: "smooth",
			});
		} else if (activeRect.right > tabsRect.right) {
			tabsEl.scrollBy({
				left: activeRect.right - tabsRect.right + 8,
				behavior: "smooth",
			});
		}
	}

	private toggleDropdown(): void {
		if (!this.listDropdown) return;

		const isOpen = this.listDropdown.classList.toggle("open");
		if (isOpen) {
			this.renderDropdown();
		}
	}

	private renderDropdown(): void {
		if (!this.listDropdown) return;

		this.listDropdown.innerHTML = "";
		for (const tab of this.tabs) {
			const item = document.createElement("button");
			item.className = `tab-list-item${tab.id === this.activeTabId ? " active" : ""}`;

			const name = document.createElement("span");
			name.textContent = this.getTabName(tab.path);
			item.appendChild(name);

			if (tab.dirty) {
				const dot = document.createElement("span");
				dot.className = "dirty-indicator";
				dot.textContent = "\u25CF";
				item.appendChild(dot);
			}

			item.title = tab.path;
			item.addEventListener("click", (e) => {
				e.stopPropagation();
				this.switchToTab(tab.id);
				this.listDropdown?.classList.remove("open");
			});

			this.listDropdown.appendChild(item);
		}
	}

	private registerShortcuts(): void {
		registerShortcut({ key: "Tab", ctrl: true }, () => {
			this.cycleTab(1);
		});
		registerShortcut({ key: "Tab", ctrl: true, shift: true }, () => {
			this.cycleTab(-1);
		});
	}

	private cycleTab(direction: number): void {
		if (this.tabs.length <= 1) return;
		const currentIndex = this.tabs.findIndex(
			(t) => t.id === this.activeTabId,
		);
		if (currentIndex === -1) return;
		const next =
			(currentIndex + direction + this.tabs.length) % this.tabs.length;
		const nextTab = this.tabs[next];
		if (nextTab) this.switchToTab(nextTab.id);
	}

	// --- Rendering ---

	private renderTabs(): void {
		const container = document.getElementById("tabs");
		if (!container) return;

		container.innerHTML = "";

		for (const tab of this.tabs) {
			const tabElement = document.createElement("div");
			tabElement.className = `tab${tab.id === this.activeTabId ? " active" : ""}${tab.dirty ? " dirty" : ""}`;
			tabElement.innerHTML = `
        <span class="tab-title" title="${tab.path}">${this.getTabName(tab.path)}</span>
        <span class="tab-close" title="Close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
      `;

			tabElement.addEventListener("click", (e) => {
				if ((e.target as HTMLElement).closest(".tab-close")) {
					this.removeTab(tab.id);
				} else {
					this.switchToTab(tab.id);
				}
			});

			tabElement.addEventListener("auxclick", (e) => {
				if (e.button === 1) {
					this.removeTab(tab.id);
				}
			});

			container.appendChild(tabElement);
		}

		// After rendering, update overflow and scroll active tab into view
		requestAnimationFrame(() => {
			this.updateOverflowState();
			this.scrollActiveTabIntoView();
		});
	}

	private saveRecentFiles(): void {
		const recentPaths = this.tabs.map((t) => t.path).slice(-10);
		localStorage.setItem(
			"mermaid-editor-recent",
			JSON.stringify(recentPaths),
		);
	}

	private loadRecentFiles(): void {
		try {
			const stored = localStorage.getItem("mermaid-editor-recent");
			if (stored) {
				JSON.parse(stored);
			}
		} catch {
			// Ignore errors
		}
	}
}
