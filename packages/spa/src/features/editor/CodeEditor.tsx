import { useCodeMirror } from "./useCodeMirror";
import { useImperativeHandle, forwardRef } from "react";
import type { Theme } from "@/types/file";

interface CodeEditorProps {
	onChange: (content: string) => void;
	theme: Theme;
}

export interface CodeEditorHandle {
	setContent: (content: string) => void;
	getContent: () => string;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
	function CodeEditor({ onChange, theme }, ref) {
		const { containerRef, setEditorContent, getEditorContent } =
			useCodeMirror({ onChange, theme });

		useImperativeHandle(ref, () => ({
			setContent: setEditorContent,
			getContent: getEditorContent,
		}));

		return <div ref={containerRef} className="h-full overflow-auto" />;
	},
);
