import { ThemeProvider } from "./providers/ThemeProvider";
import { WebSocketProvider } from "./providers/WebSocketProvider";
import { AppLayout } from "./layout/AppLayout";

export function App() {
	return (
		<ThemeProvider>
			<WebSocketProvider>
				<AppLayout />
			</WebSocketProvider>
		</ThemeProvider>
	);
}
