import type { Cell } from '../lib/parseMaze'
import { BonusIcon, ConveyorArrowIcon, GoalFlagIcon, SourceIcon, StartFlagIcon } from './mazeIcons'

// The glyph/icon drawn on top of a tile — shared by MazeGrid (read-only
// viewer) and the Oficina de Campo editor, so a painted cell looks exactly
// like the same cell would in the viewer.
export function MazeCellContent({ cell }: { cell: Cell }) {
  switch (cell.type) {
    case 'key':
      return <span className="maze-cell-letter">{cell.char}</span>
    case 'door':
      return <span className="maze-cell-letter">{cell.char}</span>
    case 'conveyor':
      return cell.direction ? <ConveyorArrowIcon className="maze-cell-icon" direction={cell.direction} /> : null
    case 'bonus':
      return <BonusIcon className="maze-cell-icon" />
    case 'source':
      return <SourceIcon className="maze-cell-icon" />
    case 'start':
      return <StartFlagIcon className="maze-cell-icon" />
    case 'goal':
      return <GoalFlagIcon className="maze-cell-icon" />
    default:
      return null
  }
}
