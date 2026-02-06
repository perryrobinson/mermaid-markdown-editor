import { useEffect, useRef, useCallback } from "react";
import { EditorView } from "@codemirror/view";
import { createEditorState, setContent } from "@/lib/codemirror-setup";

interface UseCodeMirrorOptions {
	onChange: (content: string) => void;
}

export function useCodeMirror({ onChange }: UseCodeMirrorOptions) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const isExternalUpdate = useRef(false);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		if (!containerRef.current) return;

		const state = createEditorState(
			"",
			(content) => onChangeRef.current(content),
			isExternalUpdate,
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
	}, []);

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
