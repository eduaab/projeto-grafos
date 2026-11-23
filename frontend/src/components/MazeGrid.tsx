import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ParsedMaze } from '../lib/parseMaze'
import { MazeCellContent } from './MazeCellContent'
import './MazeGrid.css'

type MazeGridProps = {
  maze: ParsedMaze
  trail?: number[][]
  maxCell?: number
  fitHeight?: boolean
}

const MIN_CELL = 22

export function MazeGrid({ maze, trail = [], maxCell = 60, fitHeight = false }: MazeGridProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(MIN_CELL)

  useEffect(() => {
    const el = viewportRef.current
    if (!el || maze.cols === 0 || maze.rows === 0) return

    const observer = new ResizeObserver((entries) => {
      const area = entries[0]?.contentRect
      if (!area?.width) return
      const widthFit = (area.width - (maze.cols - 1) * 2) / maze.cols
      const heightFit = fitHeight ? (area.height - (maze.rows - 1) * 2) / maze.rows : Infinity
      const ideal = Math.floor(Math.min(maxCell, widthFit, heightFit))
      setCellSize(Math.max(MIN_CELL, ideal))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [maze.cols, maze.rows, maxCell, fitHeight])

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
            <div key={`${r}-${c}`} className={'maze-cell maze-cell--' + cell.type + (trail.some(([row, col]) => row === r && col === c) ? ' maze-cell--trail' : '')}>
              <MazeCellContent cell={cell} />
            </div>
          )),
        )}
      </div>
    </div>
  )
}
