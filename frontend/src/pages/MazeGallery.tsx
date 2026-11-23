import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import manifest from '../data/mapas.manifest.json'
import { parseMaze, type ParsedMaze } from '../lib/parseMaze'
import { mazeThumbnailDataUrl } from '../lib/mazeThumbnailImage'
import { describeMaze, displayMazeTitle, groupLabel } from '../lib/mazeDescriptions'
import './MazeGallery.css'

type ManifestEntry = (typeof manifest)[number]
type GalleryItem = ManifestEntry & { maze: ParsedMaze; thumb: string }
type GroupFilter = 'all' | ManifestEntry['group']

const GROUP_FILTERS: { value: GroupFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'oficial', label: 'Mapas oficiais' },
  { value: 'grupo', label: 'Mapas do grupo' },
  { value: 'criado', label: 'Mapas criados' },
]

// Thumbnail aspect of each row's small preview image.
const THUMB_ASPECT = 1.4

// Exit simultaneous and plain (the user already decided to filter it out);
// entrance gets a short stagger capped at the first handful of rows so a
// big result set doesn't make the last row wait through a long queue.
type RowVariantArgs = { index: number; reduced: boolean }

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

const rowVariants = {
  hidden: ({ reduced }: RowVariantArgs) => ({ opacity: 0, y: reduced ? 0 : -6 }),
  visible: ({ index, reduced }: RowVariantArgs) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: reduced ? 0.12 : 0.2,
      ease: EASE_OUT,
      delay: reduced ? 0 : Math.min(index, 8) * 0.025,
    },
  }),
  exit: ({ reduced }: RowVariantArgs) => ({
    opacity: 0,
    y: reduced ? 0 : -6,
    transition: { duration: reduced ? 0.12 : 0.15, ease: EASE_OUT },
  }),
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function MazeGallery() {
  const [items, setItems] = useState<GalleryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  const rowRefs = useRef(new Map<string, HTMLAnchorElement>())
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let cancelled = false

    Promise.all(
      manifest.map(async (entry) => {
        const response = await fetch(`/mapas/${entry.filename}`)
        if (!response.ok) throw new Error(`Falha ao carregar ${entry.filename}`)
        const text = await response.text()
        const maze = parseMaze(text)
        return { ...entry, maze, thumb: mazeThumbnailDataUrl(maze, 240, 240 / THUMB_ASPECT) }
      }),
    )
      .then((loaded) => {
        if (!cancelled) setItems(loaded)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar os labirintos.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const visibleItems = useMemo(
    () => (items ? (groupFilter === 'all' ? items : items.filter((item) => item.group === groupFilter)) : null),
    [items, groupFilter],
  )

  const matchId = useMemo(() => {
    if (!visibleItems || !query.trim()) return null
    const needle = normalize(query)
    const found = visibleItems.find((item) => normalize(`${item.id} ${displayMazeTitle(item)}`).includes(needle))
    return found?.id ?? null
  }, [visibleItems, query])

  useEffect(() => {
    if (matchId) rowRefs.current.get(matchId)?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'nearest' })
  }, [matchId, reducedMotion])

  const search = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!matchId) return
    const match = rowRefs.current.get(matchId)
    match?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'nearest' })
    match?.focus({ preventScroll: true })
  }

  return (
    <section className="maze-gallery">
      <h1 className="visually-hidden">Mapas</h1>

      <form className="maze-search" onSubmit={search} role="search">
        <input
          className="field"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou código"
          aria-label="Buscar por nome ou código"
        />
        <button className="btn" type="submit">Buscar</button>
      </form>

      <div className="maze-gallery-filters" role="group" aria-label="Filtrar por catálogo">
        {GROUP_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={groupFilter === option.value}
            className="btn"
            onClick={() => setGroupFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {!items && !error && <p className="notice" role="status">Carregando mapas…</p>}
      {query.trim() && visibleItems?.length && matchId === null ? (
        <p className="notice" role="status">Nenhum mapa corresponde à busca neste catálogo.</p>
      ) : null}

      {visibleItems && (
        <>
          {visibleItems.length === 0 ? (
            <div className="maze-gallery-empty">
              <p>{groupFilter === 'criado' ? 'Nenhum mapa criado ainda.' : 'Nenhum labirinto neste filtro.'}</p>
              {groupFilter === 'criado' && <Link to="/editor" className="btn btn-primary">Abrir editor</Link>}
            </div>
          ) : (
            <ul className="maze-gallery-list">
              <AnimatePresence mode="popLayout">
                {visibleItems.map((item, index) => (
                  <motion.li
                    key={item.id}
                    layout={!reducedMotion}
                    custom={{ index, reduced: Boolean(reducedMotion) }}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ layout: { duration: 0.2, ease: EASE_OUT } }}
                  >
                    <Link
                      ref={(element) => {
                        if (element) rowRefs.current.set(item.id, element)
                        else rowRefs.current.delete(item.id)
                      }}
                      to={`/labirintos/${item.id}`}
                      className={'maze-gallery-row' + (item.id === matchId ? ' is-matched' : '')}
                    >
                      <img className="maze-gallery-row-thumb" src={item.thumb} alt="" />
                      <div className="maze-gallery-row-main">
                        <h2>{displayMazeTitle(item)}</h2>
                        <p>{describeMaze(item)}</p>
                      </div>
                      <div className="maze-gallery-row-meta">
                        <span className="maze-gallery-row-group">{groupLabel(item.group)}</span>
                        <span className="maze-gallery-row-dims">
                          {item.cols} × {item.rows}
                        </span>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}
    </section>
  )
}
