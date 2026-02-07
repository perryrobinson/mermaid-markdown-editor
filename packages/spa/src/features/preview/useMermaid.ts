import { useEffect, useRef, useCallback, useState } from "react";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import type { Theme } from "@/types/file";

let initialized = false;

function initMermaid(theme: Theme) {
	mermaid.initialize({
		startOnLoad: false,
		theme: theme === "dark" ? "dark" : "default",
		securityLevel: "loose",
		fontFamily: "inherit",
	});
	initialized = true;
}

export function useMermaid(code: string, theme: Theme) {
	const containerRef = useRef<HTMLDivElement>(null);
	const spzRef = useRef<SvgPanZoom.Instance | null>(null);
	const svgRef = useRef<SVGSVGElement | null>(null);
	const [error, setError] = useState<string | null>(null);
	const idRef = useRef(
		`mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
	);

	const render = useCallback(async () => {
		if (!containerRef.current) return;

		// Clean up previous
		if (spzRef.current) {
			spzRef.current.destroy();
			spzRef.current = null;
		}
		svgRef.current = null;

		initMermaid(theme);

		try {
			const { svg } = await mermaid.render(idRef.current, code);
			if (!containerRef.current) return;

			const temp = document.createElement("div");
			temp.innerHTML = svg;
			const svgElement = temp.querySelector("svg") as SVGSVGElement;

			if (svgElement) {
				svgElement.setAttribute("height", "100%");
				svgElement.style.maxWidth = "100%";

				containerRef.current.innerHTML = "";
				containerRef.current.appendChild(svgElement);
				svgRef.current = svgElement;

				const spz = svgPanZoom(svgElement, {
					fit: true,
					center: true,
					controlIconsEnabled: false,
					maxZoom: 5,
					minZoom: 0.1,
					zoomScaleSensitivity: 0.3,
					panEnabled: true,
					zoomEnabled: true,
				});
				spzRef.current = spz;
				setError(null);
			}
		} catch (err: any) {
			setError(err.message || String(err));
			if (containerRef.current) {
				containerRef.current.innerHTML = "";
			}
		}
	}, [code, theme]);

	useEffect(() => {
		// Generate a new unique ID for each render cycle to avoid mermaid ID conflicts
		idRef.current = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		render();
		return () => {
			if (spzRef.current) {
				spzRef.current.destroy();
				spzRef.current = null;
			}
		};
	}, [render]);

	const zoomIn = useCallback(() => spzRef.current?.zoomIn(), []);
	const zoomOut = useCallback(() => spzRef.current?.zoomOut(), []);
	const resetView = useCallback(() => {
		spzRef.current?.resetZoom();
		spzRef.current?.resetPan();
		spzRef.current?.fit();
		spzRef.current?.center();
	}, []);

	return {
		containerRef,
		svgRef,
		error,
		zoomIn,
		zoomOut,
		resetView,
	};
}
