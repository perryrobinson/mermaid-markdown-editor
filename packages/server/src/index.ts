import { app } from "./api.ts";
import { setupWebSocket, broadcastFileChange } from "./websocket.ts";
import { watchDirectory, setWatchCallback } from "./watcher.ts";

const PORT = 3000;

// In production, serve the built SPA static files
const isProd = process.env.NODE_ENV === "production";

if (isProd) {
	const { serveStatic } = await import("hono/bun");
	const { resolve } = await import("path");
	const spaDistPath = resolve(import.meta.dir, "../../../packages/spa/dist");

	// Serve static assets from SPA build
	app.use("/*", serveStatic({ root: spaDistPath }));

	// SPA fallback: serve index.html for non-API routes
	app.get("*", serveStatic({ root: spaDistPath, path: "index.html" }));
}

const server = Bun.serve({
	port: PORT,
	async fetch(req, server) {
		const url = new URL(req.url);

		if (url.pathname === "/ws") {
			if (server.upgrade(req)) {
				return undefined as unknown as Response;
			}
			return new Response("WebSocket upgrade failed", { status: 400 });
		}

		return app.fetch(req);
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
