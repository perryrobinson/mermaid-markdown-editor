// File System Access API declarations
interface Window {
	showDirectoryPicker?: (options?: {
		mode?: string;
	}) => Promise<FileSystemDirectoryHandle>;
}

interface FileSystemDirectoryHandle {
	values(): AsyncIterableIterator<FileSystemHandle>;
}
