import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";

// Current mermaid theme
let currentMermaidTheme: "dark" | "default" = "default";

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: currentMermaidTheme,
  securityLevel: "loose",
  fontFamily: "inherit",
});

export function setMermaidTheme(theme: "light" | "dark"): void {
  currentMermaidTheme = theme === "dark" ? "dark" : "default";
  mermaid.initialize({
    startOnLoad: false,
    theme: currentMermaidTheme,
    securityLevel: "loose",
    fontFamily: "inherit",
  });
}

function getThemeBackground(): string {
  const theme = document.documentElement.getAttribute("data-theme");
  return theme === "light" ? "#ffffff" : "#1e1e1e";
}

const spzInstances: Map<string, SvgPanZoom.Instance> = new Map();
let diagramCounter = 0;

// Simple markdown to HTML converter
function parseMarkdown(md: string): { html: string; mermaidBlocks: { id: string; code: string }[] } {
  let html = md;

  // Extract mermaid blocks FIRST (before HTML escaping ruins the arrows)
  // Support both plain mermaid and mermaid with YAML frontmatter
  const mermaidBlocks: { id: string; code: string }[] = [];
  html = html.replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, code) => {
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
    if (rows.length === 2 && rows[0] !== undefined && rows[1] !== undefined) {
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

  // Clean up old svg-pan-zoom instances
  for (const instance of spzInstances.values()) {
    instance.destroy();
  }
  spzInstances.clear();

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
        <span class="toolbar-sep"></span>
        <button class="copy-svg" title="Copy SVG to clipboard">Copy</button>
        <button class="download-png" title="Download as PNG">PNG</button>
        <span class="toolbar-sep"></span>
        <button class="fullscreen-btn" title="Full Screen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>
      </div>
      <div class="mermaid-viewport"></div>
    `;

    const viewport = container.querySelector(".mermaid-viewport") as HTMLElement;

    try {
      const { svg } = await mermaid.render(id, code);

      // Parse SVG and configure for svg-pan-zoom
      const temp = document.createElement("div");
      temp.innerHTML = svg;
      const svgElement = temp.querySelector("svg") as SVGSVGElement;

      if (svgElement) {
        // Let svg-pan-zoom handle sizing — match mermaid live editor approach
        svgElement.setAttribute("height", "100%");
        svgElement.style.maxWidth = "100%";

        // SVG must be in the DOM before svg-pan-zoom init
        viewport.appendChild(svgElement);
        placeholder.replaceWith(container);

        const spz = svgPanZoom(svgElement, {
          fit: true,
          center: true,
          controlIconsEnabled: false,
          maxZoom: 5,
          minZoom: 0.1,
          zoomScaleSensitivity: 0.3,
          panEnabled: true,
          zoomEnabled: true,
        });

        spzInstances.set(id, spz);

        // Toolbar controls
        container.querySelector(".zoom-in")?.addEventListener("click", () => {
          spz.zoomIn();
        });

        container.querySelector(".zoom-out")?.addEventListener("click", () => {
          spz.zoomOut();
        });

        container.querySelector(".zoom-reset")?.addEventListener("click", () => {
          spz.resetZoom();
          spz.resetPan();
          spz.fit();
          spz.center();
        });

        // Export controls
        const copyButton = container.querySelector(".copy-svg") as HTMLButtonElement;
        copyButton?.addEventListener("click", async () => {
          await copySvgToClipboard(svgElement, copyButton);
        });

        const pngButton = container.querySelector(".download-png") as HTMLButtonElement;
        pngButton?.addEventListener("click", async () => {
          await downloadAsPng(svgElement, id);
        });

        // Fullscreen button
        const fullscreenBtn = container.querySelector(".fullscreen-btn") as HTMLButtonElement;
        fullscreenBtn?.addEventListener("click", () => {
          openDiagramFullscreen(svgElement, id);
        });

        continue; // skip the replaceWith below since we already did it
      }
    } catch (error: any) {
      viewport.innerHTML = `<div class="mermaid-error">Error rendering diagram:\n${error.message || error}</div>`;
    }

    placeholder.replaceWith(container);
  }
}

function cleanSvgForExport(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;

  // Remove svg-pan-zoom's viewport transform wrapper
  // svg-pan-zoom adds a <g> with class "svg-pan-zoom_viewport" that has a transform
  const viewport = clone.querySelector(".svg-pan-zoom_viewport");
  if (viewport) {
    viewport.removeAttribute("transform");
    // Also reset any style transform
    (viewport as SVGGElement).style.transform = "";
  }

  // Remove any control icons added by svg-pan-zoom
  const controls = clone.getElementById("svg-pan-zoom-controls");
  if (controls) {
    controls.remove();
  }

  // Remove inline style transforms from the root SVG
  clone.style.transform = "";

  return clone;
}

async function copySvgToClipboard(svg: SVGSVGElement, button: HTMLButtonElement): Promise<void> {
  try {
    const svgClone = cleanSvgForExport(svg);
    await navigator.clipboard.writeText(svgClone.outerHTML);

    // Brief visual feedback
    const originalText = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  } catch (error) {
    console.error("Failed to copy SVG:", error);
    alert("Failed to copy to clipboard");
  }
}

async function downloadAsPng(svg: SVGSVGElement, id: string): Promise<void> {
  try {
    const svgClone = cleanSvgForExport(svg);

    // Get dimensions
    const bbox = svg.getBBox();
    const width = Math.ceil(bbox.width + 40);
    const height = Math.ceil(bbox.height + 40);

    // Set explicit dimensions on the clone
    svgClone.setAttribute("width", String(width));
    svgClone.setAttribute("height", String(height));

    // Serialize SVG to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);

    // Create blob and URL
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create canvas and draw
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        canvas.width = width * 2; // 2x for better quality
        canvas.height = height * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = getThemeBackground();
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = reject;
      img.src = svgUrl;
    });

    // Convert to PNG and download
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error("Failed to create PNG");
      }
      const pngUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${id}.png`;
      link.click();

      // Clean up
      URL.revokeObjectURL(svgUrl);
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
  } catch (error) {
    console.error("Failed to download PNG:", error);
    alert("Failed to download PNG");
  }
}

function openDiagramFullscreen(svg: SVGSVGElement, diagramId: string): void {
  // Clone SVG and clean it for fresh pan/zoom
  const cleanSvg = cleanSvgForExport(svg);
  cleanSvg.setAttribute("height", "100%");
  cleanSvg.style.maxWidth = "100%";

  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "diagram-fullscreen-overlay";
  overlay.innerHTML = `
    <div class="fullscreen-header">
      <div class="fullscreen-toolbar">
        <button class="zoom-in" title="Zoom In">+</button>
        <button class="zoom-out" title="Zoom Out">−</button>
        <button class="zoom-reset" title="Reset">Reset</button>
        <span class="toolbar-sep"></span>
        <button class="copy-svg" title="Copy SVG">Copy</button>
        <button class="download-png" title="Download PNG">PNG</button>
      </div>
      <button class="fullscreen-close" title="Close (Esc)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="fullscreen-viewport"></div>
  `;

  // Insert SVG directly into viewport (no wrapper div)
  const fullscreenViewport = overlay.querySelector(".fullscreen-viewport")!;
  fullscreenViewport.appendChild(cleanSvg);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // Initialize svg-pan-zoom (SVG is now in the DOM)
  const spz = svgPanZoom(cleanSvg, {
    fit: true,
    center: true,
    controlIconsEnabled: false,
    maxZoom: 10,
    minZoom: 0.1,
    zoomScaleSensitivity: 0.3,
    panEnabled: true,
    zoomEnabled: true,
  });

  // Wire up zoom toolbar buttons
  overlay.querySelector(".zoom-in")?.addEventListener("click", () => {
    spz.zoomIn();
  });

  overlay.querySelector(".zoom-out")?.addEventListener("click", () => {
    spz.zoomOut();
  });

  overlay.querySelector(".zoom-reset")?.addEventListener("click", () => {
    spz.resetZoom();
    spz.resetPan();
    spz.fit();
    spz.center();
  });

  // Wire up copy button
  const copyButton = overlay.querySelector(".copy-svg") as HTMLButtonElement;
  copyButton?.addEventListener("click", async () => {
    await copySvgToClipboard(cleanSvg, copyButton);
  });

  // Wire up PNG button
  const pngButton = overlay.querySelector(".download-png") as HTMLButtonElement;
  pngButton?.addEventListener("click", async () => {
    await downloadAsPng(cleanSvg, diagramId);
  });

  // Close handler
  const close = () => {
    spz.destroy();
    overlay.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", handleEsc);
  };

  overlay.querySelector(".fullscreen-close")?.addEventListener("click", close);

  // ESC key handler
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };
  document.addEventListener("keydown", handleEsc);
}
