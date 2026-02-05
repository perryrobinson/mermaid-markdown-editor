import { watch, FSWatcher } from "fs";
import { join, relative, extname } from "path";
import { readdir, stat } from "fs/promises";

type WatchCallback = (filePath: string, content: string) => void;

let watchCallback: WatchCallback | null = null;
const watchers: FSWatcher[] = [];
const recentChanges = new Map<string, number>();

export function setWatchCallback(callback: WatchCallback) {
  watchCallback = callback;
}

async function handleFileChange(absolutePath: string, relativePath: string) {
  // Debounce rapid changes (e.g., from editors that save multiple times)
  const now = Date.now();
  const lastChange = recentChanges.get(absolutePath) || 0;
  if (now - lastChange < 100) return;
  recentChanges.set(absolutePath, now);

  // Clean up old entries
  for (const [path, time] of recentChanges) {
    if (now - time > 5000) {
      recentChanges.delete(path);
    }
  }

  try {
    const file = Bun.file(absolutePath);
    if (await file.exists()) {
      const content = await file.text();
      if (watchCallback) {
        watchCallback(relativePath, content);
      }
    }
  } catch (error) {
    console.error(`Error reading changed file ${relativePath}:`, error);
  }
}

function watchDir(dirPath: string, baseDir: string) {
  try {
    const watcher = watch(dirPath, async (eventType, filename) => {
      if (!filename) return;

      const ext = extname(filename);
      if (ext !== ".md" && ext !== ".markdown") return;

      const absolutePath = join(dirPath, filename);
      const relativePath = relative(baseDir, absolutePath);

      // Small delay to let the file system settle
      setTimeout(() => handleFileChange(absolutePath, relativePath), 50);
    });

    watchers.push(watcher);
  } catch (error) {
    console.error(`Error watching directory ${dirPath}:`, error);
  }
}

async function scanAndWatch(dir: string, baseDir: string) {
  watchDir(dir, baseDir);

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        const subDir = join(dir, entry.name);
        await scanAndWatch(subDir, baseDir);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
}

export async function watchDirectory(dir: string) {
  // Close any existing watchers
  for (const watcher of watchers) {
    watcher.close();
  }
  watchers.length = 0;

  await scanAndWatch(dir, dir);
  console.log(`Watching for markdown file changes in ${dir}`);
}

export function stopWatching() {
  for (const watcher of watchers) {
    watcher.close();
  }
  watchers.length = 0;
}
