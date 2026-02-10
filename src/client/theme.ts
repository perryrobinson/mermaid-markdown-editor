import { bus } from "./eventBus";
import { renderPreview, setMermaidTheme } from "./preview";

type Theme = "light" | "dark";
let currentContent = "";

bus.on("editor:change", ({ content }) => {
	currentContent = content;
});

export function initTheme(): void {
	const saved = localStorage.getItem("theme") as Theme | null;
	const theme = saved || "light";
	applyTheme(theme, false);
}

function applyTheme(theme: Theme, rerender = true): void {
	document.documentElement.setAttribute("data-theme", theme);
	localStorage.setItem("theme", theme);
	setMermaidTheme(theme);
	updateThemeButtonIcon(theme);
	bus.emit("theme:change", { theme });

	if (rerender && currentContent) {
		renderPreview(currentContent);
	}
}

function toggleTheme(): void {
	const current = document.documentElement.getAttribute("data-theme") as Theme;
	applyTheme(current === "dark" ? "light" : "dark");
}

function updateThemeButtonIcon(theme: Theme): void {
	const darkIcon = document.querySelector(".theme-icon-dark") as HTMLElement;
	const lightIcon = document.querySelector(".theme-icon-light") as HTMLElement;

	if (darkIcon && lightIcon) {
		darkIcon.style.display = theme === "dark" ? "inline-block" : "none";
		lightIcon.style.display = theme === "light" ? "inline-block" : "none";
	}
}

export function setupThemeToggle(): void {
	const themeToggle = document.getElementById("theme-toggle");
	themeToggle?.addEventListener("click", toggleTheme);
}
