import { useCallback, useRef } from "react";

interface UseResizableOptions {
	direction: "horizontal" | "vertical";
	min: number;
	max: number;
	onResize: (size: number) => void;
	onResizeEnd?: () => void;
}

export function useResizable({
	direction,
	min,
	max,
	onResize,
	onResizeEnd,
}: UseResizableOptions) {
	const isDragging = useRef(false);
	const startPos = useRef(0);
	const startSize = useRef(0);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging.current) return;
			const pos = direction === "horizontal" ? e.clientX : e.clientY;
			const delta = pos - startPos.current;
			const newSize = startSize.current + delta;
			if (newSize >= min && newSize <= max) {
				onResize(newSize);
			}
		},
		[direction, min, max, onResize],
	);

	const handleMouseUp = useCallback(() => {
		if (!isDragging.current) return;
		isDragging.current = false;
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
		onResizeEnd?.();
	}, [handleMouseMove, onResizeEnd]);

	const onMouseDown = useCallback(
		(e: React.MouseEvent, currentSize: number) => {
			isDragging.current = true;
			startPos.current =
				direction === "horizontal" ? e.clientX : e.clientY;
			startSize.current = currentSize;
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[direction, handleMouseMove, handleMouseUp],
	);

	return { onMouseDown };
}
