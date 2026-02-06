import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import {
	ZoomIn,
	ZoomOut,
	RotateCcw,
	Copy,
	Image,
	X,
} from "lucide-react";
import svgPanZoom from "svg-pan-zoom";
import { cleanSvgForExport, copySvgToClipboard, downloadAsPng } from "./svg-export";

interface MermaidFullscreenProps {
	svg: SVGSVGElement;
	diagramId: string;
	onClose: () => void;
}

export function MermaidFullscreen({
	svg,
	diagramId,
	onClose,
}: MermaidFullscreenProps) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const spzRef = useRef<SvgPanZoom.Instance | null>(null);
	const svgRef = useRef<SVGSVGElement | null>(null);
	const [copyLabel, setCopyLabel] = useState("Copy");

	useEffect(() => {
		if (!viewportRef.current) return;

		const cleanSvg = cleanSvgForExport(svg);
		cleanSvg.setAttribute("height", "100%");
		cleanSvg.style.maxWidth = "100%";

		viewportRef.current.innerHTML = "";
		viewportRef.current.appendChild(cleanSvg);
		svgRef.current = cleanSvg;

		const spz = svgPanZoom(cleanSvg, {
			fit: true,
			center: true,
			controlIconsEnabled: false,
			maxZoom: 10,
			minZoom: 0.1,
			zoomScaleSensitivity: 0.3,
			panEnabled: true,
			zoomEnabled: true,
		});
		spzRef.current = spz;

		document.body.style.overflow = "hidden";

		return () => {
			spz.destroy();
			document.body.style.overflow = "";
		};
	}, [svg]);

	useEffect(() => {
		function handleEsc(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleEsc);
		return () => document.removeEventListener("keydown", handleEsc);
	}, [onClose]);

	const zoomIn = useCallback(() => spzRef.current?.zoomIn(), []);
	const zoomOut = useCallback(() => spzRef.current?.zoomOut(), []);
	const resetView = useCallback(() => {
		spzRef.current?.resetZoom();
		spzRef.current?.resetPan();
		spzRef.current?.fit();
		spzRef.current?.center();
	}, []);

	const handleCopy = useCallback(async () => {
		if (!svgRef.current) return;
		const ok = await copySvgToClipboard(svgRef.current);
		if (ok) {
			setCopyLabel("Copied!");
			setTimeout(() => setCopyLabel("Copy"), 1500);
		}
	}, []);

	const handleDownloadPng = useCallback(async () => {
		if (!svgRef.current) return;
		await downloadAsPng(svgRef.current, diagramId);
	}, [diagramId]);

	return createPortal(
		<div className="diagram-fullscreen-overlay">
			<div className="flex justify-between items-center px-4 py-3 bg-bg-secondary border-b border-border">
				<div className="flex gap-1 items-center">
					<FsButton onClick={zoomIn} title="Zoom In">
						<ZoomIn size={14} />
					</FsButton>
					<FsButton onClick={zoomOut} title="Zoom Out">
						<ZoomOut size={14} />
					</FsButton>
					<FsButton onClick={resetView} title="Reset">
						<RotateCcw size={14} />
					</FsButton>
					<div className="w-px h-6 bg-border mx-2" />
					<FsButton onClick={handleCopy} title="Copy SVG">
						<Copy size={14} />
						<span>{copyLabel}</span>
					</FsButton>
					<FsButton onClick={handleDownloadPng} title="Download PNG">
						<Image size={14} />
						<span>PNG</span>
					</FsButton>
				</div>
				<button
					type="button"
					onClick={onClose}
					title="Close (Esc)"
					className="flex items-center justify-center w-9 h-9 bg-bg-tertiary border border-border rounded text-text-primary cursor-pointer hover:bg-error hover:border-error hover:text-white transition-colors"
				>
					<X size={20} />
				</button>
			</div>
			<div ref={viewportRef} className="fullscreen-viewport" />
		</div>,
		document.body,
	);
}

function FsButton({
	children,
	onClick,
	title,
}: {
	children: React.ReactNode;
	onClick: () => void;
	title: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border-none rounded-md text-text-primary text-sm cursor-pointer hover:bg-bg-hover transition-colors"
		>
			{children}
		</button>
	);
}
