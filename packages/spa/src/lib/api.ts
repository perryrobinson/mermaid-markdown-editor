export async function fetchFiles(): Promise<string[]> {
	const res = await fetch("/api/files");
	if (!res.ok) throw new Error("Failed to list files");
	const data = await res.json();
	return data.files;
}

export async function fetchFile(
	path: string,
): Promise<{ content: string; mtime: number }> {
	const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
	if (!res.ok) throw new Error("Failed to load file");
	return res.json();
}

export async function saveFile(
	path: string,
	content: string,
): Promise<{ success: boolean; mtime: number }> {
	const res = await fetch("/api/file", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ path, content }),
	});
	if (!res.ok) throw new Error("Failed to save file");
	return res.json();
}
