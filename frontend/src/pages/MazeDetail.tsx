import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import manifest from '../data/mapas.manifest.json'
import { parseMaze, type ParsedMaze } from '../lib/parseMaze'
import { deleteFromMapasCriados } from '../lib/saveToFolder'
import { MazeGrid } from '../components/MazeGrid'
import { MazeLegend } from '../components/MazeLegend'
import { Modal } from '../components/Modal'
import { displayMazeTitle, groupLabel } from '../lib/mazeDescriptions'
import './MazeDetail.css'

export function MazeDetail() {
  const { id } = useParams<{ id: string }>()
  return <MazeDetailContent key={id} id={id} />
}

function MazeDetailContent({ id }: { id?: string }) {
  const entry = manifest.find((m) => m.id === id)
  const navigate = useNavigate()
  const [maze, setMaze] = useState<ParsedMaze | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!entry) return
    let cancelled = false
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

  return (
    <section className="maze-detail">
      {!entry ? (
        <div className="page-header maze-detail-header">
          <h1>Mapa não encontrado</h1>
          <p>O mapa “{id}” não está no catálogo.</p>
        </div>
      ) : (
        <>
          <div className="page-header maze-detail-header">
            <h1>{displayMazeTitle(entry)}</h1>
            <p>
              {groupLabel(entry.group)} · {entry.cols} colunas × {entry.rows} linhas · {entry.keys}{' '}
              {entry.keys === 1 ? 'chave' : 'chaves'} · {entry.doors} {entry.doors === 1 ? 'porta' : 'portas'}
            </p>
          </div>
          <div className="maze-detail-body">
            <div className="maze-detail-preview">
              {error && <p className="notice notice-error" role="alert">{error}</p>}
              {!maze && !error && <p className="notice" role="status">Carregando mapa…</p>}
              {maze && <MazeGrid maze={maze} maxCell={100} fitHeight />}
            </div>
            <aside className="maze-detail-sidebar" aria-label="Informações e ações do mapa">
              <div className="maze-detail-panel">
                {maze && <MazeLegend maze={maze} />}
                <section className="maze-detail-actions" aria-labelledby="maze-detail-actions-title">
                  <h2 id="maze-detail-actions-title">Ações do mapa</h2>
                  {deleteError && <p className="notice notice-error" role="alert">{deleteError}</p>}
                  <a className="btn btn-primary" href={'/labirinto_interativo.html?' + new URLSearchParams({ mapa: entry.id, arquivo: entry.filename })}>
                    Abrir simulador
                  </a>
                  {maze && (
                    <Link className="btn" to="/editor" state={{ editorMap: {
                      grid: maze.grid.map((row) => row.map((cell) => cell.char)),
                      filename: entry.id + '_copia.txt',
                    } }}>
                      Editar cópia
                    </Link>
                  )}
                  {entry.group === 'criado' && (
                    <button type="button" className="btn btn-danger" onClick={() => setDeleteOpen(true)}>Excluir mapa</button>
                  )}
                </section>
              </div>
            </aside>
          </div>
          {deleteOpen && (
            <Modal title="Excluir mapa" onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} confirmLabel="Excluir mapa" danger>
              <p>O arquivo <strong>{entry.filename}</strong> será excluído de <code>data/mapas_criados</code>.</p>
            </Modal>
          )}
        </>
      )}
    </section>
  )
}
