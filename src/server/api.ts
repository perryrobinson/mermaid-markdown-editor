import { Hono } from "hono";
import { join, relative, resolve } from "path";
import { readdir, stat } from "fs/promises";

const app = new Hono();

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

app.get("/api/files", async (c) => {
  try {
    const files = await getMarkdownFiles(process.cwd());
    return c.json({ files });
  } catch (error) {
    return c.json({ error: "Failed to list files" }, 500);
  }
});

app.get("/api/file", async (c) => {
  const filePath = c.req.query("path");
  if (!filePath) {
    return c.json({ error: "Missing path parameter" }, 400);
  }

  try {
    const absolutePath = resolve(process.cwd(), filePath);
    if (!absolutePath.startsWith(process.cwd())) {
      return c.json({ error: "Access denied" }, 403);
    }

    const file = Bun.file(absolutePath);
    if (!(await file.exists())) {
      return c.json({ error: "File not found" }, 404);
    }

    const content = await file.text();
    const stats = await stat(absolutePath);
    return c.json({ content, mtime: stats.mtime.getTime() });
  } catch (error) {
    return c.json({ error: "Failed to read file" }, 500);
  }
});

app.post("/api/file", async (c) => {
  try {
    const body = await c.req.json();
    const { path: filePath, content } = body;

    if (!filePath || content === undefined) {
      return c.json({ error: "Missing path or content" }, 400);
    }

    const absolutePath = resolve(process.cwd(), filePath);
    if (!absolutePath.startsWith(process.cwd())) {
      return c.json({ error: "Access denied" }, 403);
    }

    await Bun.write(absolutePath, content);
    const stats = await stat(absolutePath);
    return c.json({ success: true, mtime: stats.mtime.getTime() });
  } catch (error) {
    return c.json({ error: "Failed to write file" }, 500);
  }
});

export { app };
