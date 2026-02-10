# Mermaid Markdown Editor — Product Requirements Document

## 1. Overview

A local, browser-based markdown editor with first-class support for Mermaid diagrams. Users open markdown files from their filesystem, edit them with live preview, and interact with rendered diagrams (pan, zoom, export). The app runs as a local server — no cloud, no accounts, no internet required.

### Core Value Proposition

Edit markdown files containing Mermaid diagrams with a live, interactive preview — all locally, with real-time sync to the filesystem.

---

## 2. Target Users

- Developers documenting architecture with Mermaid diagrams
- Technical writers working with markdown + diagrams
- Anyone who wants a local, fast, distraction-free markdown+diagram editor

---

## 3. Functional Requirements

### 3.1 File Management

#### Opening Files
- **File picker**: Open one or multiple `.md`/`.markdown` files via OS file dialog (Ctrl+O)
- **Folder picker**: Open an entire directory to browse markdown files (Ctrl+Shift+O)
- **Drag and drop**: Drop markdown files anywhere on the window to open them
- **Duplicate prevention**: If a file is already open in a tab, switch to it instead of opening a new tab

#### Saving Files
- **Save shortcut**: Ctrl+S saves the active file
- **File System Access API** (preferred): Write directly to the filesystem via browser handle — no server roundtrip
- **Server API fallback**: POST content to server for saving if browser API unavailable
- **Save status indicator**: Visual feedback showing dirty/saved/syncing state in the toolbar

#### File Explorer Sidebar
- **Tree view**: Hierarchical folder/file display after opening a folder
- **Folder collapsing**: Click folders to expand/collapse
- **File filtering**: Only show `.md` and `.markdown` files; exclude hidden dirs and `node_modules`
- **Sorting**: Folders first, then alphabetical
- **Active file highlighting**: Currently open file visually distinguished
- **Refresh button**: Re-scan the directory
- **Resizable**: Drag the sidebar divider to resize (180px–400px)
- **Toggle**: Show/hide sidebar with Ctrl+B
- **Empty state**: "Open Folder" button when no directory loaded

### 3.2 Editor

#### Text Editing
- **CodeMirror 6**: Full-featured code editor component
- **Markdown syntax highlighting**: Language-aware highlighting
- **Line numbers**: Visible by default
- **Standard editing**: Undo/redo, copy/paste, find/replace, auto-indent
- **Dark syntax theme**: OneDark theme for the editor

#### Editor Behavior
- **Real-time preview**: Every keystroke updates the preview pane
- **External update handling**: When file changes externally, editor updates without triggering a feedback loop (flag-based guard)
- **Full height**: Editor fills its pane completely

### 3.3 Preview

#### Markdown Rendering
Render standard markdown to HTML, including:
- Headings (H1–H6, with H1/H2 having bottom borders)
- Bold, italic, bold+italic
- Links (clickable) and images (embedded)
- Fenced code blocks with language labels
- Inline code with styled background
- Blockquotes with left border accent
- Unordered and ordered lists with nesting
- Tables with header/body separation
- Horizontal rules
- Paragraphs (double newline separated)

#### Mermaid Diagram Rendering
- **Detection**: Identify ` ```mermaid ` fenced code blocks
- **Async rendering**: Render each diagram via Mermaid.js with unique IDs per render cycle
- **Error display**: Show a styled error message if a diagram has syntax errors
- **Theme-aware**: Re-render diagrams when theme changes (light uses default Mermaid theme, dark uses Mermaid dark theme)

#### Diagram Interaction
Each rendered diagram gets:
- **Pan and zoom viewport**: Mouse drag to pan, scroll wheel to zoom (min 0.1x, max 5x)
- **Per-diagram toolbar**:
  - Zoom in (+)
  - Zoom out (−)
  - Reset view (fit and center)
  - Copy SVG to clipboard
  - Download as PNG (2x resolution, theme-appropriate background)
  - Fullscreen toggle

#### Fullscreen Diagram View
- **Overlay mode**: Diagram fills the viewport
- **Header**: Toolbar + close button
- **Extended zoom**: Up to 10x in fullscreen
- **ESC to close**
- **Separate pan/zoom instance**: Fresh state on enter

### 3.4 Tab Management

- **Multi-tab**: Multiple files open simultaneously as tabs
- **Tab display**: Filename, truncated at 200px with ellipsis
- **Active tab**: Visually highlighted with accent color border
- **Dirty indicator**: Orange dot prefix on tabs with unsaved changes
- **Close button**: Per-tab X icon
- **Middle-click to close**: Browser-style tab behavior
- **Close confirmation**: Modal dialog when closing a dirty tab ("Keep editing" / "Close without saving")
- **Auto-switch on close**: When closing the active tab, switch to an adjacent tab
- **Empty state**: When all tabs are closed, show an empty state with "Open File" prompts

### 3.5 View Modes

Three mutually exclusive layout modes:
- **Split view** (default): Editor on left, preview on right, with draggable divider
- **Editor only**: Full-width editor, preview hidden
- **Preview only**: Full-width preview, editor hidden
- **Cycle shortcut**: Ctrl+\ cycles through modes
- **Toolbar buttons**: Three buttons in toolbar to switch directly

### 3.6 Split Pane Divider

- **Draggable**: 4px wide, cursor changes on hover
- **Double-click to reset**: Returns to 50/50 split
- **Visual feedback**: Accent color on hover/drag

### 3.7 Theming

- **Light and dark themes**: Toggle via toolbar button (sun/moon icons)
- **Persistence**: Theme preference saved to localStorage
- **CSS custom properties**: All colors defined as variables on `:root`, overridden by `[data-theme="dark"]`
- **Preview re-render**: Mermaid diagrams re-render on theme change to match

#### Color Tokens (Light / Dark)
| Token          | Light   | Dark    |
| -------------- | ------- | ------- |
| bg-primary     | #ffffff | #1e1e1e |
| bg-secondary   | #f5f5f5 | #252526 |
| bg-tertiary    | #eeeeee | #2d2d2d |
| text-primary   | #1a1a1a | #e0e0e0 |
| text-secondary | #666666 | #a0a0a0 |
| border-color   | #d0d0d0 | #3c3c3c |
| accent-color   | #0277bd | #4fc3f7 |

### 3.8 Real-Time Filesystem Sync

#### Server-Side File Watching
- **Recursive watcher**: Monitor all subdirectories for markdown file changes
- **Debouncing**: 100ms debounce to prevent duplicate events
- **Filtering**: Only `.md`/`.markdown` files; exclude hidden dirs and `node_modules`
- **Broadcast**: On change, read file and publish content via WebSocket

#### WebSocket Client
- **Auto-connect**: Connect on app initialization
- **Reconnection**: Exponential backoff (2s base, max 10 attempts)
- **File change messages**: `{type: "file-change", path, content, timestamp}`

#### Conflict Resolution
- **If tab is clean**: Silently update content from external change
- **If tab is dirty**: Show conflict dialog:
  - "File Changed Externally"
  - "Keep My Changes" — do nothing
  - "Load External Changes" — replace local content, clear dirty flag

---

## 4. Non-Functional Requirements

### 4.1 Architecture
- **Local-only**: Server binds to localhost, no auth needed
- **Runtime**: Bun
- **No framework required**: The original uses vanilla TypeScript; a framework (React, etc.) is fine for a rewrite
- **Single-page app**: All interaction in one page, no routing needed
- **Server + client**: Server handles file I/O and watching; client handles editing and rendering

### 4.2 API

| Method | Endpoint                | Purpose                                           |
| ------ | ----------------------- | ------------------------------------------------- |
| GET    | `/api/files`            | List markdown files in CWD (recursive)            |
| GET    | `/api/file?path=<path>` | Read file content + mtime                         |
| POST   | `/api/file`             | Write file `{path, content}` → `{success, mtime}` |
| WS     | `/ws`                   | File change notifications (pub/sub)               |

**Security**: All file paths validated to be within CWD (path traversal protection).

### 4.3 Performance
- **Debounced file watching** (100ms)
- **Feedback loop prevention**: Guard flag when updating editor from external source
- **Unique diagram IDs per render cycle**: Prevent Mermaid ID collisions
- **svg-pan-zoom cleanup**: Destroy instances before re-rendering to prevent memory leaks

### 4.4 Browser Compatibility
- **Primary**: Modern Chromium browsers (File System Access API support)
- **Fallback**: Firefox/Safari — degrade to `<input>` file picker and `webkitdirectory` for folders (read-only folder access; saving falls back to server API)

### 4.5 Build & Distribution
- **Dev mode**: Hot-reload server + bundled client
- **Production**: Build client, serve static files from server
- **Standalone binary** (optional): Compile to single executable with `bun build --compile`

---

## 5. Keyboard Shortcuts

| Shortcut     | Action                                             |
| ------------ | -------------------------------------------------- |
| Ctrl+S       | Save active file                                   |
| Ctrl+O       | Open file picker                                   |
| Ctrl+Shift+O | Open folder picker                                 |
| Ctrl+B       | Toggle sidebar                                     |
| Ctrl+\       | Cycle view mode (split → editor → preview → split) |
| ESC          | Close fullscreen diagram                           |

---

## 6. UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Toolbar: [Open ▾] [Save] [Status]    [Theme] [Sidebar] [View Mode] │
├─────────────────────────────────────────────────────┤
│ Tab Bar: [file1.md ●] [file2.md] [file3.md ×]                      │
├────────┬──────────────────┬─┬───────────────────────┤
│Explorer│    Editor         │▎│     Preview           │
│  Tree  │  (CodeMirror 6)  │▎│  (Rendered markdown   │
│        │                   │▎│   + Mermaid diagrams) │
│        │                   │▎│                       │
│        │                   │▎│   ┌─────────────┐    │
│        │                   │▎│   │ Diagram      │    │
│        │                   │▎│   │ [+][-][⟳][⤓] │    │
│        │                   │▎│   │  (pan/zoom)  │    │
│        │                   │▎│   └─────────────┘    │
├────────┴──────────────────┴─┴───────────────────────┤
```

---

## 7. Edge Cases & Error Handling

- **No file open**: Show empty state with "Open File" / "Open Folder" prompts
- **All tabs closed**: Return to empty state, disable view mode buttons
- **Unsaved changes on close**: Confirmation dialog before discarding
- **File read/write errors**: Alert dialog with error message
- **Mermaid syntax errors**: Inline error display in preview (red box, error text)
- **WebSocket disconnect**: Auto-reconnect with backoff; graceful degradation if sync unavailable
- **Duplicate file open**: Switch to existing tab
- **External file change + local edits**: Conflict resolution dialog
- **Non-markdown file dropped**: Ignore silently
- **Empty folder**: "No markdown files found" message in sidebar
- **Clipboard copy failure**: Catch and alert
- **Deep/large folder structures**: Recursive scan (no hard limits, but exclude `node_modules` and hidden dirs)

---

## 8. Out of Scope (for initial build)

- Cloud sync or remote collaboration
- Authentication or multi-user support
- Auto-save
- Git integration
- Search across files
- Markdown extensions beyond standard (no footnotes, no task lists, etc.)
- Mobile/responsive layout
- Plugin system
- VS Code extension (was explored on a branch but reverted)

---

## 9. Dependencies (Reference)

These are the key libraries used in the original. A rewrite may substitute equivalents.

| Library      | Purpose                       |
| ------------ | ----------------------------- |
| Bun          | Runtime, bundler, test runner |
| Hono         | HTTP server framework         |
| CodeMirror 6 | Text editor                   |
| Mermaid.js   | Diagram rendering             |
| svg-pan-zoom | Pan/zoom on SVG diagrams      |
| Biome        | Linter + formatter            |
