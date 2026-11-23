import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MazeGrid } from '../components/MazeGrid'
import { parseMaze, type ParsedMaze } from '../lib/parseMaze'
import './Home.css'

const COVER_ID = 'm03_tres_chaves'
const COVER_LEGEND = [
  ['S', 'Início'], ['G', 'Saída'], ['a–c', 'Chaves'], ['A–C', 'Portas'],
  ['~', 'Água'], [',', 'Lama'],
]

export function Home() {
  const [cover, setCover] = useState<ParsedMaze | 'error' | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/mapas/${COVER_ID}.txt`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao carregar o mapa da home.')
        return response.text()
      })
      .then((text) => {
        if (!controller.signal.aborted) setCover(parseMaze(text))
      })
      .catch(() => {
        if (!controller.signal.aborted) setCover('error')
      })

    return () => controller.abort()
  }, [])

  return (
    <section className="home">
      <div className="home-cover">
        <div className="home-intro">
          <h1>Labirintos na prática</h1>
          <p>
            Explore mapas com chaves, portas e terrenos de custos diferentes. Desenhe seu próprio labirinto no editor
            ou compare, passo a passo, os caminhos encontrados por BFS, DFS, Dijkstra e Bellman-Ford.
          </p>
          <div className="home-actions">
            <Link to="/labirintos" className="btn btn-primary">Explorar mapas</Link>
            <Link to="/editor" className="btn">Criar labirinto</Link>
          </div>
        </div>
        <figure className="home-exhibit">
          {cover === 'error' ? (
            <p className="notice notice-error" role="status">Não foi possível carregar a prévia do mapa.</p>
          ) : cover ? (
            <MazeGrid maze={cover} />
          ) : (
            <p className="notice" role="status">Carregando mapa…</p>
          )}
          <figcaption>
            <Link className="home-map-title" to={`/labirintos/${COVER_ID}`}>M03 — Três chaves</Link>
            {cover && cover !== 'error' && (
              <ul className="home-key">
                {COVER_LEGEND.map(([symbol, label]) => (
                  <li key={symbol}><b>{symbol}</b> {label}</li>
                ))}
              </ul>
            )}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
