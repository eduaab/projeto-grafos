import type { ReactNode } from 'react'
import type { CellType, Direction } from '../lib/parseMaze'
import { BonusIcon, ConveyorArrowIcon, GoalFlagIcon, SourceIcon, StartFlagIcon } from './mazeIcons'
import './MazeLegend.css'

type LegendEntry = { type: CellType; name: string; cost: string; render: () => ReactNode }

// Same visual language as MazeGrid (.maze-cell--<type>, .maze-cell-icon,
// .maze-cell-letter) so a legend swatch reads as "this exact tile", not an
// approximation of it. The conveyor shows ONE arrow (East, as a
// representative), not all four directions crammed into one swatch.
const LEGEND_ITEMS: LegendEntry[] = [
  { type: 'wall', name: 'Parede', cost: '—', render: () => null },
  { type: 'floor', name: 'Chão', cost: '1', render: () => null },
  { type: 'mud', name: 'Lama', cost: '3', render: () => null },
  { type: 'water', name: 'Água', cost: '5', render: () => null },
  { type: 'start', name: 'Início', cost: '1', render: () => <StartFlagIcon className="maze-cell-icon" /> },
  { type: 'goal', name: 'Saída', cost: '1', render: () => <GoalFlagIcon className="maze-cell-icon" /> },
  { type: 'key', name: 'Chave (a–d)', cost: '1', render: () => <span className="maze-cell-letter">a</span> },
  { type: 'door', name: 'Porta (A–D)', cost: '1', render: () => <span className="maze-cell-letter">A</span> },
  {
    type: 'conveyor',
    name: 'Esteira (uma seta por direção)',
    cost: '1',
    render: () => <ConveyorArrowIcon className="maze-cell-icon" direction={'E' as Direction} />,
  },
  { type: 'bonus', name: 'Bônus consumível', cost: '−4, depois 1', render: () => <BonusIcon className="maze-cell-icon" /> },
  { type: 'source', name: 'Fonte de energia', cost: '−2 sempre', render: () => <SourceIcon className="maze-cell-icon" /> },
]

export function MazeLegend() {
  return (
    <ul className="maze-legend">
      {LEGEND_ITEMS.map((item) => (
        <li key={item.type} className="maze-legend-item">
          <span className={`maze-legend-swatch maze-cell--${item.type}`}>{item.render()}</span>
          <span className="maze-legend-name">{item.name}</span>
          <span className="maze-legend-cost">{item.cost}</span>
        </li>
      ))}
    </ul>
  )
}
