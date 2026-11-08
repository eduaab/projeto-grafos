// "Salvar" writes the .txt straight to data/mapas_criados/ — no browser
// download dialog, ideally no prompt of any kind. Two ways, tried in order:
//
// 1. The dev server's /__save-mapa endpoint (vite.config.ts) — zero clicks,
//    but only exists while running `npm run dev` (it's dev-only Node
//    middleware, absent from the production build and from `vite preview`).
// 2. The File System Access API — works from any Chromium browser even
//    without the dev server, but needs the user to grant folder access via
//    a native picker once per session (there's no way around that part:
//    a page can't just name an arbitrary disk path and write to it).
//
// If neither is available (Firefox/Safari with no dev server), saving
// fails and the caller falls back to telling the user to use "Baixar.txt".

async function saveViaDevServer(filename: string, text: string): Promise<boolean> {
  try {
    const response = await fetch('/__save-mapa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, text }),
    })
    if (!response.ok) return false
    const result = (await response.json()) as { ok: boolean }
    return result.ok
  } catch {
    return false // no dev server listening (production build, vite preview, …)
  }
}

let cachedDirHandle: FileSystemDirectoryHandle | null = null

async function ensureWritableDir(): Promise<FileSystemDirectoryHandle> {
  if (cachedDirHandle) {
    const permission = await cachedDirHandle.queryPermission({ mode: 'readwrite' })
    if (permission === 'granted') return cachedDirHandle
    if ((await cachedDirHandle.requestPermission({ mode: 'readwrite' })) === 'granted') return cachedDirHandle
    cachedDirHandle = null // revoked or denied — ask again below
  }
  if (!window.showDirectoryPicker) throw new Error('not-supported')
  const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'mapas-criados' })
  cachedDirHandle = handle
  return handle
}

async function saveViaFileSystemAccess(filename: string, text: string): Promise<void> {
  const dir = await ensureWritableDir()
  const name = filename.endsWith('.txt') ? filename : `${filename}.txt`
  const fileHandle = await dir.getFileHandle(name, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(text)
  await writable.close()
}

export type SaveResult = { via: 'dev-server' | 'file-system-access' }

/** Tries the zero-click dev-server route first, then the pick-a-folder
 * API. Throws if neither works (caller shows the user a clear message —
 * see Editor.tsx's saveError handling) or if the user cancels the picker
 * (DOMException "AbortError", which the caller treats as a no-op, not an
 * error). */
export async function saveToMapasCriados(filename: string, text: string): Promise<SaveResult> {
  if (await saveViaDevServer(filename, text)) return { via: 'dev-server' }
  await saveViaFileSystemAccess(filename, text)
  return { via: 'file-system-access' }
}

async function deleteViaDevServer(filename: string): Promise<boolean> {
  try {
    const response = await fetch('/__delete-mapa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    })
    if (!response.ok) return false
    const result = (await response.json()) as { ok: boolean }
    return result.ok
  } catch {
    return false // no dev server listening (production build, vite preview, …)
  }
}

async function deleteViaFileSystemAccess(filename: string): Promise<void> {
  const dir = await ensureWritableDir()
  const name = filename.endsWith('.txt') ? filename : `${filename}.txt`
  await dir.removeEntry(name)
}

/** Same two-route fallback as saveToMapasCriados — only ever reaches
 * data/mapas_criados/ (the dev-server route hardcodes that directory;
 * the File System Access route reuses the same handle the user already
 * granted for saving). Official and group maps aren't deletable through
 * either path. */
export async function deleteFromMapasCriados(filename: string): Promise<SaveResult> {
  if (await deleteViaDevServer(filename)) return { via: 'dev-server' }
  await deleteViaFileSystemAccess(filename)
  return { via: 'file-system-access' }
}
