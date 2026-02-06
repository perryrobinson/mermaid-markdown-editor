import {
	createContext,
	useCallback,
	useEffect,
	type ReactNode,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Theme } from "@/types/file";

interface ThemeContextValue {
	theme: Theme;
	toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useLocalStorage<Theme>("theme", "light");

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
	}, [theme]);

	const toggleTheme = useCallback(() => {
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	}, [setTheme]);

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}
