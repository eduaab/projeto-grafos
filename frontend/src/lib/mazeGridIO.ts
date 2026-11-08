// Grid <-> .txt plumbing for the Oficina de Campo editor. Pure data
// shuffling — no parsing into Cell/CellType here (that's parseMaze.ts, for
// the read-only viewer); the editor just moves single characters around.

export function createBlankGrid(rows: number, cols: number): string[][] {
  const grid: string[][] = []
  for (let r = 0; r < rows; r++) {
    const row: string[] = []
    for (let c = 0; c < cols; c++) {
      const border = r === 0 || r === rows - 1 || c === 0 || c === cols - 1
      row.push(border ? '#' : '.')
    }
    grid.push(row)
  }
  return grid
}

export function gridToText(grid: string[][]): string {
  return grid.map((row) => row.join('')).join('\n') + '\n'
}

/** Loads a .txt into an editable grid. Lenient (pads ragged rows with
 * walls) — the strict shape/character check is validateMaze.ts + the
 * sync-mapas.mjs rules that decide whether this would be accepted later. */
export function textToGrid(text: string): string[][] {
  const rows = text
    .split(/\r\n|\r|\n/)
    .filter((line) => !line.startsWith(';') && line.length > 0)
    .map((line) => Array.from(line))

  if (rows.length === 0) return createBlankGrid(5, 13)

  const cols = Math.max(...rows.map((row) => row.length))
  return rows.map((row) => {
    if (row.length === cols) return row
    return [...row, ...Array(cols - row.length).fill('#')]
  })
}

/** Resizes in place as much as possible: keeps the overlapping top-left
 * region, pads new rows/columns as wall border + floor interior so the
 * result still looks like a map, not a ragged crop.
 *
 * Two things the naive "just copy the overlap" version got wrong (the
 * "quadrado de parede do nada" bug): growing the grid carried the OLD
 * grid's own trailing border (its last row/column, previously the edge of
 * a smaller grid) into what is now the MIDDLE of the new one, leaving a
 * stray wall line nowhere near the new edge — so that trailing border is
 * skipped on growth, same as any interior cell would be. And copying must
 * never overwrite the NEW grid's own border ring, so shrinking can't leave
 * old interior content sitting where a wall is required. */
export function resizeGrid(grid: string[][], rows: number, cols: number): string[][] {
  const next = createBlankGrid(rows, cols)
  const oldRows = grid.length
  const oldCols = grid[0]?.length ?? 0
  const copyRows = Math.min(rows > oldRows ? oldRows - 1 : rows, oldRows)
  const copyCols = Math.min(cols > oldCols ? oldCols - 1 : cols, oldCols)

  for (let r = 0; r < copyRows; r++) {
    for (let c = 0; c < copyCols; c++) {
      const onNewBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1
      if (!onNewBorder) next[r][c] = grid[r][c]
    }
  }
  return next
}

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.txt') ? filename : `${filename}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}
