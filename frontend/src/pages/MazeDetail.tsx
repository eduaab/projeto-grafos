import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import manifest from '../data/mapas.manifest.json'
import { parseMaze, type ParsedMaze } from '../lib/parseMaze'
import { MazeGrid } from '../components/MazeGrid'
import { MazeLegend } from '../components/MazeLegend'
import { groupLabel } from '../lib/mazeDescriptions'
import './MazeDetail.css'

export function MazeDetail() {
  const { id } = useParams<{ id: string }>()
  const entry = manifest.find((m) => m.id === id)
  const [maze, setMaze] = useState<ParsedMaze | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!entry) return
    let cancelled = false
    setMaze(null)
    setError(null)

    fetch(`/mapas/${entry.filename}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Falha ao carregar ${entry.filename}`)
        return response.text()
      })
      .then((text) => {
        if (!cancelled) setMaze(parseMaze(text))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar o labirinto.')
      })

    return () => {
      cancelled = true
    }
  }, [entry])

  if (!entry) {
    return (
      <section className="maze-detail">
        <Link to="/labirintos" className="maze-detail-back">
          ← Voltar à Sala de Mapas
        </Link>
        <p className="maze-detail-error">Labirinto "{id}" não encontrado no catálogo.</p>
      </section>
    )
  }

  return (
    <section className="maze-detail">
      <Link to="/labirintos" className="maze-detail-back">
        ← Voltar à Sala de Mapas
      </Link>

      <div className="maze-detail-header">
        <span className="context-label">{groupLabel(entry.group)}</span>
        <h1>{entry.title}</h1>
        <p className="maze-detail-dims">
          {entry.cols}×{entry.rows} · {entry.keys} chave(s) · {entry.doors} porta(s)
        </p>
      </div>

      {error && <p className="maze-detail-error">{error}</p>}

      {maze && (
        <div className="maze-detail-body">
          <div className="maze-detail-grid-wrap">
            <MazeGrid maze={maze} />
          </div>
          <MazeLegend />
        </div>
      )}
    </section>
  )
}
