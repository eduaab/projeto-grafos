import type { CellType, Direction } from '../lib/parseMaze'
import { MazeCellContent } from './MazeCellContent'
import './MazeGrid.css' // shares .maze-cell / .maze-cell--<type> tile styling
import './MazePalette.css'

export type PaletteTool = { char: string; type: CellType; label: string; direction?: Direction }

export const PALETTE: PaletteTool[] = [
  { char: '#', type: 'wall', label: 'Parede' },
  { char: '.', type: 'floor', label: 'Chão' },
  { char: ',', type: 'mud', label: 'Lama' },
  { char: '~', type: 'water', label: 'Água' },
  { char: 'S', type: 'start', label: 'Início' },
  { char: 'G', type: 'goal', label: 'Saída' },
  { char: 'a', type: 'key', label: 'Chave a' },
  { char: 'b', type: 'key', label: 'Chave b' },
  { char: 'c', type: 'key', label: 'Chave c' },
  { char: 'd', type: 'key', label: 'Chave d' },
  { char: 'A', type: 'door', label: 'Porta A' },
  { char: 'B', type: 'door', label: 'Porta B' },
  { char: 'C', type: 'door', label: 'Porta C' },
  { char: 'D', type: 'door', label: 'Porta D' },
  { char: '>', type: 'conveyor', label: 'Esteira →', direction: 'E' },
  { char: '<', type: 'conveyor', label: 'Esteira ←', direction: 'W' },
  { char: '^', type: 'conveyor', label: 'Esteira ↑', direction: 'N' },
  { char: 'v', type: 'conveyor', label: 'Esteira ↓', direction: 'S' },
  { char: '+', type: 'bonus', label: 'Bônus' },
  { char: '*', type: 'source', label: 'Fonte' },
]

type MazePaletteProps = {
  selected: string
  onSelect: (char: string) => void
}

export function MazePalette({ selected, onSelect }: MazePaletteProps) {
  return (
    <div className="maze-palette" role="radiogroup" aria-label="Ferramenta de pintura">
      {PALETTE.map((tool) => (
        <button
          key={tool.char}
          type="button"
          role="radio"
          aria-checked={tool.char === selected}
          title={tool.label}
          className={'maze-palette-tool maze-cell' + ` maze-cell--${tool.type}` + (tool.char === selected ? ' is-selected' : '')}
          onClick={() => onSelect(tool.char)}
        >
          <MazeCellContent cell={{ type: tool.type, char: tool.char, direction: tool.direction }} />
        </button>
      ))}
    </div>
  )
}
