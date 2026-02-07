import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

let editorView: EditorView | null = null;
let changeCallback: ((content: string) => void) | null = null;
let isUpdatingFromExternal = false;

export function createEditor(parent: HTMLElement): EditorView {
  const state = EditorState.create({
    doc: "",
    extensions: [
      basicSetup,
      markdown(),
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isUpdatingFromExternal && changeCallback) {
          changeCallback(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        "&": {
          height: "100%",
        },
        ".cm-scroller": {
          overflow: "auto",
        },
      }),
    ],
  });

  editorView = new EditorView({
    state,
    parent,
  });

  return editorView;
}

export function setEditorContent(content: string): void {
  if (!editorView) return;

  isUpdatingFromExternal = true;
  editorView.dispatch({
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: content,
    },
  });
  isUpdatingFromExternal = false;
}

export function getEditorContent(): string {
  if (!editorView) return "";
  return editorView.state.doc.toString();
}

export function onEditorChange(callback: (content: string) => void): void {
  changeCallback = callback;
}
