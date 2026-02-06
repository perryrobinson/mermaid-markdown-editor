import { useEffect, useRef, useCallback } from "react";
import { EditorView } from "@codemirror/view";
import { createEditorState, setContent } from "@/lib/codemirror-setup";
import type { Theme } from "@/types/file";

interface UseCodeMirrorOptions {
	onChange: (content: string) => void;
	theme: Theme;
}

export function useCodeMirror({ onChange, theme }: UseCodeMirrorOptions) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const isExternalUpdate = useRef(false);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		if (!containerRef.current) return;

		// Preserve content when recreating for theme change
		const existingContent = viewRef.current?.state.doc.toString() ?? "";

		if (viewRef.current) {
			viewRef.current.destroy();
			viewRef.current = null;
		}

		const state = createEditorState(
			existingContent,
			(content) => onChangeRef.current(content),
			isExternalUpdate,
			theme,
		);

		const view = new EditorView({
			state,
			parent: containerRef.current,
		});

		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, [theme]);

	const setEditorContent = useCallback((content: string) => {
		if (viewRef.current) {
			setContent(viewRef.current, content, isExternalUpdate);
		}
	}, []);

	const getEditorContent = useCallback(() => {
		return viewRef.current?.state.doc.toString() ?? "";
	}, []);

	return { containerRef, setEditorContent, getEditorContent };
}
