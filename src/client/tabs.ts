export interface Tab {
  id: string;
  path: string;
  content: string;
  dirty: boolean;
  mtime?: number;
}

type TabSwitchCallback = (tab: Tab) => void;

export class TabManager {
  private tabs: Tab[] = [];
  private activeTabId: string | null = null;
  private tabSwitchCallback: TabSwitchCallback | null = null;
  private nextId = 1;

  constructor() {
    this.loadRecentFiles();
    this.renderTabs();
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

    return tab;
  }

  removeTab(id: string): void {
    const index = this.tabs.findIndex((t) => t.id === id);
    if (index === -1) return;

    const tab = this.tabs[index];

    // Check if tab is dirty
    if (tab.dirty) {
      if (!confirm(`"${this.getTabName(tab.path)}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    this.tabs.splice(index, 1);

    // If closing active tab, switch to another
    if (this.activeTabId === id) {
      if (this.tabs.length > 0) {
        const newIndex = Math.min(index, this.tabs.length - 1);
        this.switchToTab(this.tabs[newIndex].id);
      } else {
        this.activeTabId = null;
      }
    }

    this.saveRecentFiles();
    this.renderTabs();
  }

  switchToTab(id: string): void {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab) return;

    this.activeTabId = id;
    this.renderTabs();

    if (this.tabSwitchCallback) {
      this.tabSwitchCallback(tab);
    }
  }

  getActiveTab(): Tab | null {
    return this.tabs.find((t) => t.id === this.activeTabId) || null;
  }

  findTabByPath(path: string): Tab | undefined {
    return this.tabs.find((t) => t.path === path);
  }

  onTabSwitch(callback: TabSwitchCallback): void {
    this.tabSwitchCallback = callback;
  }

  updateTabDisplay(): void {
    this.renderTabs();
  }

  private getTabName(path: string): string {
    return path.split("/").pop() || path;
  }

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

      // Middle-click to close
      tabElement.addEventListener("auxclick", (e) => {
        if (e.button === 1) {
          this.removeTab(tab.id);
        }
      });

      container.appendChild(tabElement);
    }
  }

  private saveRecentFiles(): void {
    const recentPaths = this.tabs.map((t) => t.path).slice(-10);
    localStorage.setItem("mermaid-editor-recent", JSON.stringify(recentPaths));
  }

  private loadRecentFiles(): void {
    // Just load the paths for reference, don't actually open them
    try {
      const stored = localStorage.getItem("mermaid-editor-recent");
      if (stored) {
        // Could be used to show a recent files menu
        JSON.parse(stored);
      }
    } catch {
      // Ignore errors
    }
  }
}
