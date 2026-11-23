import type { CellType, ParsedMaze } from '../lib/parseMaze'
import { PALETTE } from '../lib/tileStyle'
import './MazeLegend.css'

const COSTS: Partial<Record<CellType, string>> = { wall: '—', mud: '3', water: '5', bonus: '−4, depois 1', source: '−2 sempre' }
const ORDER = '#.SGabcdABCD,~><^v+*'
const LEGEND = [...PALETTE].sort((a, b) => ORDER.indexOf(a.char) - ORDER.indexOf(b.char))

export function MazeLegend({ maze }: { maze: ParsedMaze }) {
  const pieces = new Set(maze.grid.flat().map((cell) => cell.type === 'floor' ? '.' : cell.char))

  return (
    <section className="maze-legend" aria-labelledby="maze-legend-title">
      <h2 id="maze-legend-title">Peças deste mapa</h2>
      <ul>
        {LEGEND.filter(({ char }) => pieces.has(char)).map(({ char, type, label }) => {
          const cost = COSTS[type] ?? '1'
          return (
            <li key={char}>
              <span className={'maze-legend-swatch maze-cell maze-cell--' + type}>{char}</span>
              <span>{label}</span>
              <span className="maze-legend-cost" aria-label={'Custo: ' + cost}>{cost}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
