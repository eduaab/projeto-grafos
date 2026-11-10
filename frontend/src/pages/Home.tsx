import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import manifest from '../data/mapas.manifest.json'
import { parseMaze, type ParsedMaze } from '../lib/parseMaze'
import { MazeGrid } from '../components/MazeGrid'
import { ArrowIcon } from '../components/icons'
import './Home.css'

// The actual cover exhibit: a real catalogued maze, not an illustration —
// M03 for its mix of water/mud/keys/doors without being too large to read
// at hero scale (unlike m08's 71 columns).
const COVER_MAZE_ID = 'm03_tres_chaves'

const DESTINATIONS = [
  {
    to: '/labirintos',
    title: 'Sala de Mapas',
    description: 'Veja os labirintos catalogados, renderizados a partir dos próprios arquivos .txt.',
  },
  {
    to: '/editor',
    title: 'Oficina de Campo',
    description: 'Desenhe o seu próprio labirinto numa grade interativa, peça por peça.',
  },
  {
    to: '/importar-exportar',
    title: 'Arquivo & Transmissão',
    description: 'Importe um .txt existente ou exporte o labirinto que você desenhou.',
  },
]

export function Home() {
  const [cover, setCover] = useState<ParsedMaze | null>(null)

  useEffect(() => {
    const entry = manifest.find((item) => item.id === COVER_MAZE_ID)
    if (!entry) return
    let cancelled = false
    fetch(`/mapas/${entry.filename}`)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) setCover(parseMaze(text))
      })
      .catch(() => {
        /* the index list below still works without the cover render */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="home">
      <div className="home-cover">
        <div className="home-exhibit">
          <span className="home-exhibit-tag">Registro Nº 01 · M03 catalogado</span>
          {cover && (
            <div className="home-exhibit-grid">
              <MazeGrid maze={cover} />
            </div>
          )}
          <p className="home-exhibit-caption">17×10 células · 3 chaves, 3 portas, água e lama.</p>
        </div>

        <div className="home-brief">
          <span className="context-label">Dossiê de Operações</span>
          <h1>Dossiê de Operações do Labirinto</h1>
          <p className="home-hero-lede">
            Painel visual do projeto de Teoria dos Grafos: cada labirinto é um mapa de texto (<code>.txt</code>) que
            esconde chaves, portas e armadilhas, pensado para virar um grafo de estados.
          </p>

          <ol className="home-index">
            {DESTINATIONS.map((item, index) => (
              <li key={item.to}>
                <Link to={item.to} className="home-index-row">
                  <span className="home-index-num">{String(index + 1).padStart(2, '0')}</span>
                  <span className="home-index-text">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </span>
                  <ArrowIcon className="home-index-arrow" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
