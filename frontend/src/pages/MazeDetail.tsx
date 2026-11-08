import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import manifest from '../data/mapas.manifest.json'
import { parseMaze, type ParsedMaze } from '../lib/parseMaze'
import { deleteFromMapasCriados } from '../lib/saveToFolder'
import { MazeGrid } from '../components/MazeGrid'
import { MazeLegend } from '../components/MazeLegend'
import { Modal } from '../components/Modal'
import { TrashIcon } from '../components/icons'
import { groupLabel } from '../lib/mazeDescriptions'
import './MazeDetail.css'

export function MazeDetail() {
  const { id } = useParams<{ id: string }>()
  const entry = manifest.find((m) => m.id === id)
  const navigate = useNavigate()
  const [maze, setMaze] = useState<ParsedMaze | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  const confirmDelete = async () => {
    if (!entry) return
    setDeleteError(null)
    try {
      await deleteFromMapasCriados(entry.filename)
      navigate('/labirintos')
      return
    } catch (err) {
      // AbortError: the user closed the folder picker — not a real error.
      if (err instanceof DOMException && err.name === 'AbortError') {
        // no-op
      } else if (err instanceof Error && err.message === 'not-supported') {
        setDeleteError(`Este navegador não consegue apagar o arquivo direto — apague "data/mapas_criados/${entry.filename}" manualmente.`)
      } else {
        setDeleteError('Não consegui apagar — veja se a pasta ainda está acessível e tente de novo.')
      }
    }
    setDeleteOpen(false)
  }

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
      <div className="maze-detail-topbar">
        <Link to="/labirintos" className="maze-detail-back">
          ← Voltar à Sala de Mapas
        </Link>

        {entry.group === 'criado' && (
          <button type="button" className="maze-detail-delete" onClick={() => setDeleteOpen(true)}>
            <TrashIcon className="maze-detail-delete-icon" />
            Deletar mapa
          </button>
        )}
      </div>

      <div className="maze-detail-header">
        <span className="context-label">{groupLabel(entry.group)}</span>
        <h1>{entry.title}</h1>
        <p className="maze-detail-dims">
          {entry.cols}×{entry.rows} · {entry.keys} chave(s) · {entry.doors} porta(s)
        </p>
      </div>

      {error && <p className="maze-detail-error">{error}</p>}
      {deleteError && <p className="maze-detail-error">{deleteError}</p>}

      {maze && (
        <div className="maze-detail-body">
          <div className="maze-detail-grid-wrap">
            <MazeGrid maze={maze} />
          </div>
          <MazeLegend />
        </div>
      )}

      {deleteOpen && (
        <Modal title="Apagar este labirinto?" onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} confirmLabel="Apagar">
          <p>
            "{entry.title}" será apagado permanentemente de <code>data/mapas_criados/{entry.filename}</code>. Essa ação não
            pode ser desfeita.
          </p>
        </Modal>
      )}
    </section>
  )
}
