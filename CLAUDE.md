# Mermaid Markdown Editor

A local browser-based tool for viewing and editing markdown files containing mermaid diagrams, with bidirectional real-time sync.

## Quick Start

```bash
bun install        # Install all workspace dependencies
bun run dev        # Start API server (:3000) + Vite dev server (:5173)
```

- Development: open http://localhost:5173 (Vite proxies API/WebSocket to :3000)
- Production: `bun run build && bun run start` → http://localhost:3000

## Project Structure

Bun workspace monorepo with two packages:

```
packages/
├── server/                    # Bun + Hono API server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # Bun.serve() — dev/prod modes
│       ├── api.ts             # REST endpoints (Hono)
│       ├── websocket.ts       # WebSocket broadcasting
│       └── watcher.ts         # File system watcher
│
└── spa/                       # React SPA (Vite + Tailwind CSS v4)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts         # React + Tailwind plugins, proxy config
    ├── index.html
    └── src/
        ├── main.tsx           # ReactDOM entry
        ├── styles/app.css     # Tailwind @theme tokens + dark mode overrides
        ├── app/
        │   ├── App.tsx        # Root: ThemeProvider > WebSocketProvider > AppLayout
        │   ├── providers/     # ThemeProvider, WebSocketProvider
        │   └── layout/        # AppLayout (main orchestrator)
        ├── components/ui/     # Shared UI: Dialog
        ├── features/
        │   ├── editor/        # CodeMirror wrapper (useCodeMirror, CodeEditor)
        │   ├── preview/       # react-markdown + MermaidDiagram + fullscreen + svg-export
        │   ├── tabs/          # useTabManager + TabBar
        │   ├── file-tree/     # useDirectoryPicker + FileTree
        │   ├── files/         # useDragDrop + DropOverlay
        │   └── toolbar/       # Toolbar, OpenMenu, FileStatus
        ├── hooks/             # useTheme, useWebSocket, useKeyboardShortcuts, useResizable, useLocalStorage
        ├── lib/               # api.ts (fetch wrappers), codemirror-setup.ts
        └── types/             # file.ts, global.d.ts
```

## Tech Stack

- **Runtime**: Bun
- **Server**: Hono
- **Client**: React 19, Vite 6, Tailwind CSS v4
- **Editor**: CodeMirror 6
- **Markdown**: react-markdown + remark-gfm
- **Diagrams**: Mermaid.js + svg-pan-zoom
- **Icons**: lucide-react

## API Endpoints

- `GET /api/files` - List markdown files in cwd
- `GET /api/file?path=...` - Read file content
- `POST /api/file` - Write file (body: `{path, content}`)
- `WS /ws` - WebSocket for file change notifications

## Scripts

```bash
bun run dev          # Start both dev servers (API + Vite)
bun run dev:server   # Start API server only (:3000)
bun run dev:spa      # Start Vite dev server only (:5173)
bun run build        # Build SPA for production
bun run start        # Start server in production mode (serves built SPA)
bun run typecheck    # Typecheck both packages
bun run lint         # Lint all packages
```

## Bun Preferences

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>`
- Use `bun test` instead of jest/vitest
- Use `Bun.serve()` for HTTP/WebSocket (not express)
- Use `Bun.file()` for file operations
