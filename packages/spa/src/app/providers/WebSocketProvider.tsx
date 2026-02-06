import {
	createContext,
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";

interface FileChangeEvent {
	path: string;
	content: string;
	timestamp: number;
}

type FileChangeListener = (event: FileChangeEvent) => void;

interface WebSocketContextValue {
	connected: boolean;
	addListener: (listener: FileChangeListener) => () => void;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(
	null,
);

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 2000;

export function WebSocketProvider({ children }: { children: ReactNode }) {
	const [connected, setConnected] = useState(false);
	const wsRef = useRef<WebSocket | null>(null);
	const listenersRef = useRef<Set<FileChangeListener>>(new Set());
	const reconnectAttemptsRef = useRef(0);
	const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const connectRef = useRef<() => void>(null);

	const scheduleReconnect = useCallback(() => {
		if (reconnectTimerRef.current) return;
		if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return;

		reconnectAttemptsRef.current++;
		const delay =
			RECONNECT_DELAY *
			Math.min(reconnectAttemptsRef.current, 5);

		reconnectTimerRef.current = setTimeout(() => {
			reconnectTimerRef.current = null;
			connectRef.current?.();
		}, delay);
	}, []);

	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) return;

		const protocol =
			window.location.protocol === "https:" ? "wss:" : "ws:";
		const wsUrl = `${protocol}//${window.location.host}/ws`;
		const ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			setConnected(true);
			reconnectAttemptsRef.current = 0;
		};

		ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				if (message.type === "file-change") {
					const evt: FileChangeEvent = {
						path: message.path,
						content: message.content,
						timestamp: message.timestamp,
					};
					for (const listener of listenersRef.current) {
						listener(evt);
					}
				}
			} catch {
				// Ignore parse errors
			}
		};

		ws.onclose = () => {
			setConnected(false);
			scheduleReconnect();
		};

		ws.onerror = () => {
			// onclose will fire after this
		};

		wsRef.current = ws;
	}, [scheduleReconnect]);

	connectRef.current = connect;

	useEffect(() => {
		connect();
		return () => {
			if (reconnectTimerRef.current) {
				clearTimeout(reconnectTimerRef.current);
			}
			wsRef.current?.close();
		};
	}, [connect]);

	const addListener = useCallback((listener: FileChangeListener) => {
		listenersRef.current.add(listener);
		return () => {
			listenersRef.current.delete(listener);
		};
	}, []);

	return (
		<WebSocketContext.Provider value={{ connected, addListener }}>
			{children}
		</WebSocketContext.Provider>
	);
}
