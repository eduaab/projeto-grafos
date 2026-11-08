import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ParsedMaze } from '../lib/parseMaze'
import { MazeCellContent } from './MazeCellContent'
import './MazeGrid.css'

type MazeGridProps = {
  maze: ParsedMaze
}

// Never smaller than the size already confirmed legible (m08, 71 cols), but
// free to grow when a small map has room to spare — that's the "mal dá pra
// ver os símbolos" complaint on maps like m01 (13 cols) sitting in a much
// wider column.
const MIN_CELL = 22
const MAX_CELL = 46

// No entrance animation here on purpose: the route curtain already is this
// page's entrance. A per-cell stagger on top would be a second entrance
// layered on the first — the grid should just already be there once revealed.
export function MazeGrid({ maze }: MazeGridProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(MIN_CELL)

  useEffect(() => {
    const el = viewportRef.current
    if (!el || maze.cols === 0) return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (!width) return
      // .maze-grid adds a 1px gap between columns plus a 2px border — left
      // out of this math, cellSize*cols alone comes out a few px wider than
      // the box actually measured, so a "perfectly fitting" grid still grew
      // a sliver of unwanted horizontal scroll.
      const overhead = (maze.cols - 1) * 1 + 2
      const ideal = Math.floor((width - overhead) / maze.cols)
      setCellSize(Math.max(MIN_CELL, Math.min(MAX_CELL, ideal)))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [maze.cols])

  const gridStyle = {
    '--maze-cell-size': `${cellSize}px`,
    gridTemplateColumns: `repeat(${maze.cols}, var(--maze-cell-size))`,
    gridTemplateRows: `repeat(${maze.rows}, var(--maze-cell-size))`,
  } as CSSProperties

  return (
    <div ref={viewportRef} className="maze-grid-viewport">
      <div
        className="maze-grid"
        style={gridStyle}
        role="img"
        aria-label={`Grade do labirinto, ${maze.cols} por ${maze.rows} células`}
      >
        {maze.grid.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`maze-cell maze-cell--${cell.type}`}>
              <MazeCellContent cell={cell} />
            </div>
          )),
        )}
      </div>
    </div>
  )
}
