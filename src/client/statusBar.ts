export function updateFileStatus(
	status: "dirty" | "saved" | "syncing",
): void {
	const statusElement = document.getElementById("file-status")!;
	statusElement.className = "file-status " + status;

	switch (status) {
		case "dirty":
			statusElement.textContent = "Unsaved changes";
			break;
		case "saved":
			statusElement.textContent = "Saved";
			break;
		case "syncing":
			statusElement.textContent = "Saving...";
			break;
	}
}
