import { createServer, handleApiRequest } from "./api";
import { setupWebSocket, broadcastFileChange } from "./websocket";
import { watchDirectory, setWatchCallback } from "./watcher";

const PORT = 3000;

const server = createServer(PORT);
setupWebSocket(server);

// Set up file watcher callback
setWatchCallback((filePath: string, content: string) => {
  broadcastFileChange(filePath, content);
});

// Start watching the current directory for markdown files
watchDirectory(process.cwd());

console.log(`Server running at http://localhost:${PORT}`);
