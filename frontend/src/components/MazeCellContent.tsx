import type { Cell } from '../lib/parseMaze'

export function MazeCellContent({ cell }: { cell: Cell }) {
  return cell.type === 'wall' || cell.type === 'floor' ? null : <span>{cell.char}</span>
}
