import { useState, useCallback } from "react";
import {
	ZoomIn,
	ZoomOut,
	RotateCcw,
	Copy,
	Image,
	Maximize2,
} from "lucide-react";
import { useMermaid } from "./useMermaid";
import { copySvgToClipboard, downloadAsPng } from "./svg-export";
import { MermaidFullscreen } from "./MermaidFullscreen";
import { useTheme } from "@/hooks/useTheme";

interface MermaidDiagramProps {
	code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
	const { theme } = useTheme();
	const { containerRef, svgRef, error, zoomIn, zoomOut, resetView } =
		useMermaid(code, theme);
	const [copyLabel, setCopyLabel] = useState("Copy");
	const [isFullscreen, setIsFullscreen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: svgRef is a stable ref
	const handleCopy = useCallback(async () => {
		if (!svgRef.current) return;
		const ok = await copySvgToClipboard(svgRef.current);
		if (ok) {
			setCopyLabel("Copied!");
			setTimeout(() => setCopyLabel("Copy"), 1500);
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: svgRef is a stable ref
	const handleDownloadPng = useCallback(async () => {
		if (!svgRef.current) return;
		await downloadAsPng(svgRef.current, "diagram");
	}, []);

	if (error) {
		return <div className="mermaid-error">{error}</div>;
	}

	return (
		<>
			<div className="relative my-6 rounded-lg overflow-hidden bg-bg-secondary">
				<div className="flex gap-1 p-2 bg-bg-tertiary border-b border-border">
					<ToolbarButton onClick={zoomIn} title="Zoom In">
						<ZoomIn size={14} />
					</ToolbarButton>
					<ToolbarButton onClick={zoomOut} title="Zoom Out">
						<ZoomOut size={14} />
					</ToolbarButton>
					<ToolbarButton onClick={resetView} title="Reset">
						<RotateCcw size={14} />
					</ToolbarButton>
					<div className="w-px h-5 bg-border mx-1 self-center" />
					<ToolbarButton onClick={handleCopy} title="Copy SVG">
						<Copy size={14} />
						<span className="text-xs">{copyLabel}</span>
					</ToolbarButton>
					<ToolbarButton
						onClick={handleDownloadPng}
						title="Download PNG"
					>
						<Image size={14} />
						<span className="text-xs">PNG</span>
					</ToolbarButton>
					<div className="w-px h-5 bg-border mx-1 self-center" />
					<ToolbarButton
						onClick={() => setIsFullscreen(true)}
						title="Full Screen"
					>
						<Maximize2 size={14} />
					</ToolbarButton>
				</div>
				<div ref={containerRef} className="mermaid-viewport" />
			</div>

			{isFullscreen && svgRef.current && (
				<MermaidFullscreen
					svg={svgRef.current}
					diagramId="fullscreen"
					onClose={() => setIsFullscreen(false)}
				/>
			)}
		</>
	);
}

function ToolbarButton({
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
			className="flex items-center gap-1 px-2 py-1 bg-transparent border-none rounded-md text-text-secondary text-xs cursor-pointer hover:bg-bg-hover hover:text-text-primary transition-colors"
		>
			{children}
		</button>
	);
}
