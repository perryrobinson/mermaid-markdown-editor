import type { Server } from "bun";
import { join, relative, resolve, extname } from "path";
import { readdir, stat } from "fs/promises";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        await scan(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".markdown"))) {
        files.push(relative(dir, fullPath));
      }
    }
  }

  await scan(dir);
  return files.sort();
}

async function serveStatic(pathname: string): Promise<Response | null> {
  // Determine the client directory path
  // Try multiple locations to support both dev and compiled modes
  const clientDirCandidates = [
    join(import.meta.dir, "../../dist/client"),      // dev mode (from src/server/)
    join(import.meta.dir, "../client"),               // compiled binary in dist/bin/ → dist/client/
    join(process.cwd(), "dist/client"),               // running from project root
    join(process.cwd(), "../dist/client"),            // parent directory
  ];

  let clientDir: string | null = null;

  // Find the first existing client directory
  for (const candidate of clientDirCandidates) {
    const file = Bun.file(join(candidate, "index.html"));
    if (await file.exists()) {
      clientDir = candidate;
      break;
    }
  }

  if (!clientDir) {
    return null; // No client directory found
  }

  // For root path, serve index.html
  if (pathname === "/" || pathname === "") {
    const indexPath = join(clientDir, "index.html");
    const file = Bun.file(indexPath);
    if (await file.exists()) {
      return new Response(file, {
        headers: { "Content-Type": "text/html" },
      });
    }
  }

  // Try direct path match
  const filePath = join(clientDir, pathname);
  const file = Bun.file(filePath);
  if (await file.exists()) {
    const ext = extname(pathname);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    return new Response(file, {
      headers: { "Content-Type": contentType },
    });
  }

  return null;
}

export function handleApiRequest(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (pathname === "/api/files" && req.method === "GET") {
    return handleListFiles();
  }

  if (pathname === "/api/file" && req.method === "GET") {
    const filePath = url.searchParams.get("path");
    if (!filePath) {
      return new Response(JSON.stringify({ error: "Missing path parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return handleReadFile(filePath);
  }

  if (pathname === "/api/file" && req.method === "POST") {
    return handleWriteFile(req);
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleListFiles(): Promise<Response> {
  try {
    const files = await getMarkdownFiles(process.cwd());
    return new Response(JSON.stringify({ files }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to list files" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleReadFile(filePath: string): Promise<Response> {
  try {
    // Resolve to absolute path, ensuring it's within cwd
    const absolutePath = resolve(process.cwd(), filePath);
    if (!absolutePath.startsWith(process.cwd())) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const file = Bun.file(absolutePath);
    if (!(await file.exists())) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const content = await file.text();
    const stats = await stat(absolutePath);

    return new Response(JSON.stringify({
      content,
      mtime: stats.mtime.getTime()
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to read file" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleWriteFile(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path: filePath, content } = body;

    if (!filePath || content === undefined) {
      return new Response(JSON.stringify({ error: "Missing path or content" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Resolve to absolute path, ensuring it's within cwd
    const absolutePath = resolve(process.cwd(), filePath);
    if (!absolutePath.startsWith(process.cwd())) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await Bun.write(absolutePath, content);
    const stats = await stat(absolutePath);

    return new Response(JSON.stringify({
      success: true,
      mtime: stats.mtime.getTime()
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to write file" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export function createServer(port: number) {
  return Bun.serve({
    port,
    async fetch(req, server) {
      const url = new URL(req.url);

      // Handle WebSocket upgrade
      if (url.pathname === "/ws") {
        if (server.upgrade(req)) {
          return undefined as unknown as Response;
        }
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // Handle API requests
      if (url.pathname.startsWith("/api/")) {
        return handleApiRequest(req);
      }

      // Serve static files
      const staticResponse = await serveStatic(url.pathname);
      if (staticResponse) {
        return staticResponse;
      }

      // Fallback to index.html for SPA routing
      const clientDirCandidates = [
        join(import.meta.dir, "../../dist/client"),
        join(import.meta.dir, "../client"),
        join(process.cwd(), "dist/client"),
        join(process.cwd(), "../dist/client"),
      ];

      for (const candidate of clientDirCandidates) {
        const indexFile = Bun.file(join(candidate, "index.html"));
        if (await indexFile.exists()) {
          return new Response(indexFile, {
            headers: { "Content-Type": "text/html" },
          });
        }
      }

      return new Response("Not found", { status: 404 });
    },
    websocket: {
      open(ws) {
        ws.subscribe("file-changes");
      },
      message(ws, message) {
        // Handle client messages if needed
      },
      close(ws) {
        ws.unsubscribe("file-changes");
      },
    },
  });
}
