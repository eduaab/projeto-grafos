import { PALETTE } from '../lib/tileStyle'
import './MazeGrid.css' // shares .maze-cell / .maze-cell--<type> tile styling
import './MazePalette.css'

type MazePaletteProps = {
  selected: string
  onSelect: (char: string) => void
}

const GROUPS = [
  { label: 'Terrenos', tools: PALETTE.slice(0, 4) },
  { label: 'Início e saída', tools: PALETTE.slice(4, 6) },
  { label: 'Chaves', tools: PALETTE.slice(6, 10) },
  { label: 'Portas', tools: PALETTE.slice(10, 14) },
  { label: 'Esteiras', tools: PALETTE.slice(14, 18) },
  { label: 'Peças especiais', tools: PALETTE.slice(18) },
]

export function MazePalette({ selected, onSelect }: MazePaletteProps) {
  return (
    <section className="maze-palette" aria-label="Ferramenta de pintura">
      <h2>Pincel</h2>
      <div className="maze-palette-groups">
        {GROUPS.map((group) => (
          <div key={group.label} className="maze-palette-group" role="group" aria-label={group.label}>
            <p>{group.label}</p>
            <div className="maze-palette-tools">
              {group.tools.map((tool) => (
                <button
                  key={tool.char}
                  type="button"
                  aria-pressed={tool.char === selected}
                  title={tool.label}
                  aria-label={tool.label}
                  className={'maze-palette-tool maze-cell maze-cell--' + tool.type}
                  onClick={() => onSelect(tool.char)}
                >
                  {tool.char}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
