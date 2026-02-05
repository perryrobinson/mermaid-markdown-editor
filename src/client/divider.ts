export function setupDivider(): void {
  const divider = document.getElementById("divider");
  const editorPane = document.getElementById("editor-pane");
  const previewPane = document.getElementById("preview-pane");
  const splitPane = document.getElementById("split-pane");

  if (!divider || !editorPane || !previewPane || !splitPane) return;

  let isDragging = false;
  let startX = 0;
  let startEditorWidth = 0;

  divider.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startEditorWidth = editorPane.offsetWidth;
    divider.classList.add("dragging");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const newWidth = startEditorWidth + deltaX;
    const containerWidth = splitPane.offsetWidth;
    const minWidth = 200;
    const maxWidth = containerWidth - minWidth - 4; // 4px for divider

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      const editorPercent = (newWidth / containerWidth) * 100;
      const previewPercent = 100 - editorPercent - (4 / containerWidth) * 100;

      editorPane.style.flex = "none";
      editorPane.style.width = `${editorPercent}%`;
      previewPane.style.flex = "none";
      previewPane.style.width = `${previewPercent}%`;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove("dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });

  // Double-click to reset to 50/50
  divider.addEventListener("dblclick", () => {
    editorPane.style.flex = "1";
    editorPane.style.width = "";
    previewPane.style.flex = "1";
    previewPane.style.width = "";
  });
}
