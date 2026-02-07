import { useCodeMirror } from "./useCodeMirror";
import { useImperativeHandle, forwardRef } from "react";

interface CodeEditorProps {
	onChange: (content: string) => void;
}

export interface CodeEditorHandle {
	setContent: (content: string) => void;
	getContent: () => string;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
	function CodeEditor({ onChange }, ref) {
		const { containerRef, setEditorContent, getEditorContent } =
			useCodeMirror({ onChange });

		useImperativeHandle(ref, () => ({
			setContent: setEditorContent,
			getContent: getEditorContent,
		}));

		return <div ref={containerRef} className="h-full overflow-auto" />;
	},
);
