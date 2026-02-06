import { basicSetup } from "codemirror";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

export function createEditorState(
	doc: string,
	onChange: (content: string) => void,
	isExternalUpdate: { current: boolean },
): EditorState {
	return EditorState.create({
		doc,
		extensions: [
			basicSetup,
			markdown(),
			oneDark,
			EditorView.updateListener.of((update) => {
				if (update.docChanged && !isExternalUpdate.current) {
					onChange(update.state.doc.toString());
				}
			}),
			EditorView.theme({
				"&": { height: "100%" },
				".cm-scroller": { overflow: "auto" },
			}),
		],
	});
}

export function setContent(
	view: EditorView,
	content: string,
	isExternalUpdate: { current: boolean },
) {
	isExternalUpdate.current = true;
	view.dispatch({
		changes: {
			from: 0,
			to: view.state.doc.length,
			insert: content,
		},
	});
	isExternalUpdate.current = false;
}
