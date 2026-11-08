import { useMemo } from 'react'
import { parseMaze } from '../lib/parseMaze'
import { gridToText } from '../lib/mazeGridIO'
import { validateGrid } from '../lib/validateMaze'
import { MazeGrid } from './MazeGrid'
import './MazePreviewPane.css'

type MazePreviewPaneProps = {
  grid: string[][]
}

/** The "how it'll actually look" preview shown inside the Modal before a
 * save/download/import is confirmed — same MazeGrid used everywhere else,
 * so what you confirm is exactly what you get. */
export function MazePreviewPane({ grid }: MazePreviewPaneProps) {
  const maze = useMemo(() => parseMaze(gridToText(grid)), [grid])
  const validation = useMemo(() => validateGrid(grid), [grid])

  return (
    <div className="maze-preview-pane">
      <div className="maze-preview-grid">
        <MazeGrid maze={maze} />
      </div>

      {validation.valid ? (
        <p className="maze-preview-ok">Pronto — tem início e saída.</p>
      ) : (
        <ul className="maze-preview-issues">
          {validation.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
