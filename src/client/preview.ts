import mermaid from "mermaid";
import panzoom, { PanZoom } from "panzoom";

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "inherit",
});

const panzoomInstances: Map<string, PanZoom> = new Map();
let diagramCounter = 0;

// Simple markdown to HTML converter
function parseMarkdown(md: string): { html: string; mermaidBlocks: { id: string; code: string }[] } {
  let html = md;

  // Extract mermaid blocks FIRST (before HTML escaping ruins the arrows)
  const mermaidBlocks: { id: string; code: string }[] = [];
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, (_, code) => {
    const id = `mermaid-${++diagramCounter}`;
    mermaidBlocks.push({ id, code: code.trim() });
    return `%%%MERMAID_${id}%%%`;
  });

  // Extract other code blocks before escaping
  const codeBlocks: { id: string; lang: string; code: string }[] = [];
  let codeBlockId = 0;
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const id = `code-${++codeBlockId}`;
    codeBlocks.push({ id, lang: lang || "", code: code.trim() });
    return `%%%CODE_${id}%%%`;
  });

  // Extract inline code before escaping
  const inlineCode: { id: string; code: string }[] = [];
  let inlineId = 0;
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const id = `inline-${++inlineId}`;
    inlineCode.push({ id, code });
    return `%%%INLINE_${id}%%%`;
  });

  // Now escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Restore mermaid placeholders
  for (const { id } of mermaidBlocks) {
    html = html.replace(`%%%MERMAID_${id}%%%`, `<div class="mermaid-placeholder" data-id="${id}"></div>`);
  }

  // Restore code blocks with escaped content
  for (const { id, lang, code } of codeBlocks) {
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = html.replace(`%%%CODE_${id}%%%`, `<pre><code class="language-${lang}">${escapedCode}</code></pre>`);
  }

  // Restore inline code with escaped content
  for (const { id, code } of inlineCode) {
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = html.replace(`%%%INLINE_${id}%%%`, `<code>${escapedCode}</code>`);
  }

  // Headers
  html = html.replace(/^######\s+(.*)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.*)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/___([^_]+)___/g, "<strong><em>$1</em></strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Horizontal rule
  html = html.replace(/^---+$/gm, "<hr>");

  // Blockquotes
  html = html.replace(/^>\s+(.*)$/gm, "<blockquote>$1</blockquote>");

  // Unordered lists
  html = html.replace(/^(\s*)-\s+(.*)$/gm, (_, indent, content) => {
    const level = Math.floor(indent.length / 2);
    return `<li data-level="${level}">${content}</li>`;
  });

  // Wrap consecutive list items
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    return `<ul>${match}</ul>`;
  });

  // Ordered lists
  html = html.replace(/^(\s*)\d+\.\s+(.*)$/gm, (_, indent, content) => {
    const level = Math.floor(indent.length / 2);
    return `<oli data-level="${level}">${content}</oli>`;
  });

  html = html.replace(/(<oli[^>]*>.*<\/oli>\n?)+/g, (match) => {
    return `<ol>${match.replace(/oli>/g, "li>")}</ol>`;
  });

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (_, content) => {
    const cells = content.split("|").map((c: string) => c.trim());
    const isHeader = cells.every((c: string) => /^-+$/.test(c));
    if (isHeader) return "<!-- table-separator -->";
    return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join("")}</tr>`;
  });

  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, (match) => {
    const rows = match.split("<!-- table-separator -->");
    if (rows.length === 2) {
      const header = rows[0].replace(/<td>/g, "<th>").replace(/<\/td>/g, "</th>");
      return `<table><thead>${header}</thead><tbody>${rows[1]}</tbody></table>`;
    }
    return `<table>${match.replace(/<!-- table-separator -->/g, "")}</table>`;
  });

  // Paragraphs
  html = html
    .split("\n\n")
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (
        block.startsWith("<") &&
        (block.startsWith("<h") ||
          block.startsWith("<ul") ||
          block.startsWith("<ol") ||
          block.startsWith("<table") ||
          block.startsWith("<pre") ||
          block.startsWith("<blockquote") ||
          block.startsWith("<hr") ||
          block.startsWith("<div"))
      ) {
        return block;
      }
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return { html, mermaidBlocks };
}

export async function renderPreview(content: string): Promise<void> {
  const previewElement = document.getElementById("preview");
  if (!previewElement) return;

  // Clean up old panzoom instances
  for (const instance of panzoomInstances.values()) {
    instance.dispose();
  }
  panzoomInstances.clear();

  // Parse markdown
  const { html, mermaidBlocks } = parseMarkdown(content);
  previewElement.innerHTML = html;

  // Render mermaid diagrams
  for (const { id, code } of mermaidBlocks) {
    const placeholder = previewElement.querySelector(`[data-id="${id}"]`);
    if (!placeholder) continue;

    const container = document.createElement("div");
    container.className = "mermaid-container";
    container.innerHTML = `
      <div class="mermaid-toolbar">
        <button class="zoom-in" title="Zoom In">+</button>
        <button class="zoom-out" title="Zoom Out">−</button>
        <button class="zoom-reset" title="Reset">Reset</button>
      </div>
      <div class="mermaid-viewport">
        <div class="mermaid-content"></div>
      </div>
    `;

    const mermaidContent = container.querySelector(".mermaid-content")!;

    try {
      const { svg } = await mermaid.render(id, code);
      mermaidContent.innerHTML = svg;

      // Setup panzoom
      const viewport = container.querySelector(".mermaid-viewport") as HTMLElement;
      const svgElement = mermaidContent.querySelector("svg") as SVGSVGElement;

      if (svgElement) {
        // Center the diagram
        svgElement.style.transformOrigin = "center center";

        const pz = panzoom(mermaidContent as HTMLElement, {
          maxZoom: 5,
          minZoom: 0.1,
          bounds: false,
          boundsPadding: 0.1,
        });

        panzoomInstances.set(id, pz);

        // Toolbar controls
        container.querySelector(".zoom-in")?.addEventListener("click", () => {
          const transform = pz.getTransform();
          pz.smoothZoom(viewport.clientWidth / 2, viewport.clientHeight / 2, 1.25);
        });

        container.querySelector(".zoom-out")?.addEventListener("click", () => {
          const transform = pz.getTransform();
          pz.smoothZoom(viewport.clientWidth / 2, viewport.clientHeight / 2, 0.8);
        });

        container.querySelector(".zoom-reset")?.addEventListener("click", () => {
          pz.moveTo(0, 0);
          pz.zoomAbs(0, 0, 1);
        });
      }
    } catch (error: any) {
      mermaidContent.innerHTML = `<div class="mermaid-error">Error rendering diagram:\n${error.message || error}</div>`;
    }

    placeholder.replaceWith(container);
  }
}
