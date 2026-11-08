import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { cellFromChar } from '../lib/parseMaze'
import { MazeCellContent } from './MazeCellContent'
import './MazeGrid.css'
import './MazeEditorGrid.css'

type MazeEditorGridProps = {
  grid: string[][]
  onPaint: (row: number, col: number) => void
}

// Bigger floor than the read-only viewer (22-46px) — this is something you
// click/drag on, not just look at, and touch targets want to be ≥44px.
const MIN_CELL = 28
const MAX_CELL = 56

export function MazeEditorGrid({ grid, onPaint }: MazeEditorGridProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(MIN_CELL)
  const paintingRef = useRef(false)
  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  useEffect(() => {
    const el = viewportRef.current
    if (!el || cols === 0) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (!width) return
      // Same gap+border accounting as MazeGrid — otherwise the computed
      // cell size is a few px too generous and the grid grows a sliver
      // wider than its box.
      const overhead = (cols - 1) * 1 + 2
      const ideal = Math.floor((width - overhead) / cols)
      setCellSize(Math.max(MIN_CELL, Math.min(MAX_CELL, ideal)))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [cols])

  useEffect(() => {
    const stop = () => {
      paintingRef.current = false
    }
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])

  const gridStyle = {
    '--maze-cell-size': `${cellSize}px`,
    gridTemplateColumns: `repeat(${cols}, var(--maze-cell-size))`,
    gridTemplateRows: `repeat(${rows}, var(--maze-cell-size))`,
  } as CSSProperties

  return (
    <div ref={viewportRef} className="maze-grid-viewport">
      <div
        className="maze-grid maze-editor-grid"
        style={gridStyle}
        role="img"
        aria-label={`Grade do editor, ${cols} por ${rows} células`}
        onContextMenu={(event) => event.preventDefault()}
      >
        {grid.map((row, r) =>
          row.map((char, c) => {
            const cell = cellFromChar(char)
            return (
              <div
                key={`${r}-${c}`}
                className={`maze-cell maze-editor-cell maze-cell--${cell.type}`}
                onPointerDown={(event) => {
                  event.preventDefault()
                  paintingRef.current = true
                  onPaint(r, c)
                }}
                onPointerEnter={() => {
                  if (paintingRef.current) onPaint(r, c)
                }}
              >
                <MazeCellContent cell={cell} />
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
