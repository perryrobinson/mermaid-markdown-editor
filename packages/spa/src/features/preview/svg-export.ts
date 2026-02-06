export function cleanSvgForExport(svg: SVGSVGElement): SVGSVGElement {
	const clone = svg.cloneNode(true) as SVGSVGElement;

	const viewport = clone.querySelector(".svg-pan-zoom_viewport");
	if (viewport) {
		viewport.removeAttribute("transform");
		(viewport as SVGGElement).style.transform = "";
	}

	const controls = clone.getElementById("svg-pan-zoom-controls");
	if (controls) {
		controls.remove();
	}

	clone.style.transform = "";
	return clone;
}

export async function copySvgToClipboard(
	svg: SVGSVGElement,
): Promise<boolean> {
	try {
		const svgClone = cleanSvgForExport(svg);
		await navigator.clipboard.writeText(svgClone.outerHTML);
		return true;
	} catch {
		return false;
	}
}

export async function downloadAsPng(
	svg: SVGSVGElement,
	filename: string,
): Promise<void> {
	const svgClone = cleanSvgForExport(svg);

	const bbox = svg.getBBox();
	const width = Math.ceil(bbox.width + 40);
	const height = Math.ceil(bbox.height + 40);

	svgClone.setAttribute("width", String(width));
	svgClone.setAttribute("height", String(height));

	const serializer = new XMLSerializer();
	const svgString = serializer.serializeToString(svgClone);
	const svgBlob = new Blob([svgString], {
		type: "image/svg+xml;charset=utf-8",
	});
	const svgUrl = URL.createObjectURL(svgBlob);

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;
	const img = new Image();

	const theme = document.documentElement.getAttribute("data-theme");
	const bg = theme === "light" ? "#ffffff" : "#1e1e1e";

	await new Promise<void>((resolve, reject) => {
		img.onload = () => {
			canvas.width = width * 2;
			canvas.height = height * 2;
			ctx.scale(2, 2);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, width, height);
			ctx.drawImage(img, 0, 0);
			resolve();
		};
		img.onerror = reject;
		img.src = svgUrl;
	});

	canvas.toBlob((blob) => {
		if (!blob) return;
		const pngUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = pngUrl;
		link.download = `${filename}.png`;
		link.click();
		URL.revokeObjectURL(svgUrl);
		URL.revokeObjectURL(pngUrl);
	}, "image/png");
}
