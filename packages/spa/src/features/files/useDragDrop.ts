import { useState, useEffect, useRef } from "react";

export function useDragDrop(
	onDrop: (files: File[]) => void,
) {
	const [isDragging, setIsDragging] = useState(false);
	const counter = useRef(0);

	useEffect(() => {
		function handleDragEnter(e: DragEvent) {
			e.preventDefault();
			counter.current++;
			setIsDragging(true);
		}

		function handleDragLeave(e: DragEvent) {
			e.preventDefault();
			counter.current--;
			if (counter.current === 0) {
				setIsDragging(false);
			}
		}

		function handleDragOver(e: DragEvent) {
			e.preventDefault();
		}

		function handleDrop(e: DragEvent) {
			e.preventDefault();
			counter.current = 0;
			setIsDragging(false);

			const files = e.dataTransfer?.files;
			if (!files || files.length === 0) return;

			const mdFiles = Array.from(files).filter(
				(f) =>
					f.name.endsWith(".md") || f.name.endsWith(".markdown"),
			);
			if (mdFiles.length > 0) {
				onDrop(mdFiles);
			}
		}

		document.addEventListener("dragenter", handleDragEnter);
		document.addEventListener("dragleave", handleDragLeave);
		document.addEventListener("dragover", handleDragOver);
		document.addEventListener("drop", handleDrop);

		return () => {
			document.removeEventListener("dragenter", handleDragEnter);
			document.removeEventListener("dragleave", handleDragLeave);
			document.removeEventListener("dragover", handleDragOver);
			document.removeEventListener("drop", handleDrop);
		};
	}, [onDrop]);

	return { isDragging };
}
