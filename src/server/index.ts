import { app } from "./api";
import { setupWebSocket, broadcastFileChange } from "./websocket";
import { watchDirectory, setWatchCallback } from "./watcher";
import homepage from "../client/index.html";

const PORT = 3000;

const server = Bun.serve({
  port: PORT,
  routes: {
    "/": homepage,
  },
  development: { hmr: true },
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
        return undefined as unknown as Response;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    if (url.pathname.startsWith("/api/")) {
      return app.fetch(req);
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: {
    open(ws) {
      ws.subscribe("file-changes");
    },
    message(ws, message) {},
    close(ws) {
      ws.unsubscribe("file-changes");
    },
  },
});

setupWebSocket(server);

// Set up file watcher callback
setWatchCallback((filePath: string, content: string) => {
  broadcastFileChange(filePath, content);
});

// Start watching the current directory for markdown files
watchDirectory(process.cwd());

console.log(`Server running at http://localhost:${PORT}`);
