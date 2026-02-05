import type { Server } from "bun";

let serverInstance: Server | null = null;

export function setupWebSocket(server: Server) {
  serverInstance = server;
}

export function broadcastFileChange(filePath: string, content: string) {
  if (!serverInstance) return;

  const message = JSON.stringify({
    type: "file-change",
    path: filePath,
    content,
    timestamp: Date.now(),
  });

  serverInstance.publish("file-changes", message);
}
