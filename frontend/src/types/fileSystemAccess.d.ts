// Minimal surface of the File System Access API this project actually uses
// (TS's bundled DOM lib doesn't ship these yet). Chromium-only (Chrome,
// Edge) as of writing — Firefox/Safari don't implement it, which is why
// every call site feature-detects with `'showDirectoryPicker' in window`
// before touching any of this.

interface FileSystemWritableFileStream {
  write(data: string | BufferSource | Blob): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface FileSystemDirectoryHandle {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
  queryPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
  requestPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
}

interface Window {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite'; id?: string; startIn?: string }) => Promise<FileSystemDirectoryHandle>
}
