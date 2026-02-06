# Mermaid Markdown Editor

A local browser-based tool for viewing and editing markdown files containing mermaid diagrams, with bidirectional real-time sync.

## Quick Start

```bash
bun install
bun run dev      # Build client and start server
```

Opens at http://localhost:3000

## Scripts

```bash
bun run dev            # Build client + start server
bun run start          # Start server (assumes client is already built)
bun run build:client   # Bundle client TypeScript + copy static assets to public/
bun run build:dist     # Build standalone single-file executable
```

## Project Structure

```
src/
├── server/
│   ├── index.ts      # Main entry, starts HTTP server
│   ├── api.ts        # REST endpoints + static file serving
│   ├── websocket.ts  # WebSocket for real-time sync
│   └── watcher.ts    # File system watcher
└── client/
    ├── index.html    # Main HTML shell
    ├── styles.css    # All styling
    ├── main.ts       # App initialization (entry point)
    ├── editor.ts     # CodeMirror 6 setup
    ├── preview.ts    # Markdown + Mermaid rendering + pan/zoom
    ├── tabs.ts       # Tab management
    ├── files.ts      # File picker + drag-drop
    ├── sync.ts       # WebSocket client
    └── divider.ts    # Resizable split pane
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Editor**: CodeMirror 6
- **Diagrams**: Mermaid.js
- **Pan/Zoom**: svg-pan-zoom (crisp vector rendering at all zoom levels)

## API Endpoints

- `GET /api/files` - List markdown files in cwd
- `GET /api/file?path=...` - Read file content
- `POST /api/file` - Write file (body: `{path, content}`)
- `WS /ws` - WebSocket for file change notifications
