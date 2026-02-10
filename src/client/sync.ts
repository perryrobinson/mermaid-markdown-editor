import { bus } from "./eventBus";

let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 2000;

export function setupSync(): void {
	connect();
}

function connect(): void {
	if (ws?.readyState === WebSocket.OPEN) return;

	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	const wsUrl = `${protocol}//${window.location.host}/ws`;

	ws = new WebSocket(wsUrl);

	ws.onopen = () => {
		console.log("WebSocket connected");
		reconnectAttempts = 0;
	};

	ws.onmessage = (event) => {
		try {
			const message = JSON.parse(event.data);

			if (message.type === "file-change") {
				bus.emit("file:externalChange", {
					path: message.path,
					content: message.content,
				});
			}
		} catch (error) {
			console.error("Error processing WebSocket message:", error);
		}
	};

	ws.onclose = () => {
		console.log("WebSocket disconnected");
		scheduleReconnect();
	};

	ws.onerror = (error) => {
		console.error("WebSocket error:", error);
	};
}

function scheduleReconnect(): void {
	if (reconnectTimer) return;
	if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
		console.log("Max reconnection attempts reached");
		return;
	}

	reconnectAttempts++;
	const delay = RECONNECT_DELAY * Math.min(reconnectAttempts, 5);

	reconnectTimer = window.setTimeout(() => {
		reconnectTimer = null;
		connect();
	}, delay);
}

export function disconnect(): void {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}

	if (ws) {
		ws.close();
		ws = null;
	}
}
