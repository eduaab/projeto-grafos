import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import manifest from '../data/mapas.manifest.json'
import { parseMaze, type ParsedMaze } from '../lib/parseMaze'
import { mazeThumbnailDataUrl } from '../lib/mazeThumbnailImage'
import { SearchIcon } from '../components/icons'
import { describeMaze, groupLabel } from '../lib/mazeDescriptions'
import './MazeGallery.css'

type ManifestEntry = (typeof manifest)[number]
type GalleryItem = ManifestEntry & { maze: ParsedMaze; thumb: string }
type GroupFilter = 'all' | ManifestEntry['group']

const GROUP_FILTERS: { value: GroupFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'oficial', label: 'Mapas Oficiais' },
  { value: 'grupo', label: 'Mapas do Grupo' },
  { value: 'criado', label: 'Mapas Criados' },
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
  const rowRefs = useRef<(HTMLAnchorElement | null)[]>([])
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

  // The group filter narrows what actually renders — search's matchIndex
  // below operates on this subset, not the full `items`.
  const visibleItems = useMemo(
    () => (items ? (groupFilter === 'all' ? items : items.filter((item) => item.group === groupFilter)) : null),
    [items, groupFilter],
  )

  // Live search: the first map whose name/id contains the typed text.
  const matchIndex = useMemo(() => {
    if (!visibleItems || !query.trim()) return null
    const needle = normalize(query)
    const found = visibleItems.findIndex((item) => normalize(`${item.id} ${item.title}`).includes(needle))
    return found === -1 ? null : found
  }, [visibleItems, query])

  useEffect(() => {
    if (matchIndex === null) return
    rowRefs.current[matchIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [matchIndex])

  return (
    <section className="maze-gallery">
      <div className="maze-gallery-header">
        <span className="context-label">Sala de Mapas</span>
        <h1>Labirintos Catalogados</h1>
        <p className="maze-gallery-lede">
          {items ? `${items.length} labirinto(s) lido(s) direto de data/mapas.` : 'Carregando labirintos…'}
        </p>
      </div>

      {error && <p className="maze-gallery-error">{error}</p>}

      {items && visibleItems && (
        <>
          <div className="maze-gallery-filters" role="tablist" aria-label="Filtrar por catálogo">
            {GROUP_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={groupFilter === option.value}
                className={'maze-filter' + (groupFilter === option.value ? ' is-active' : '')}
                onClick={() => setGroupFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="maze-search">
            <SearchIcon className="maze-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar mapa…"
              aria-label="Buscar labirinto pelo nome"
            />
          </label>

          {visibleItems.length === 0 ? (
            <p className="maze-gallery-empty">Nenhum labirinto neste filtro ainda.</p>
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
                        rowRefs.current[index] = element
                      }}
                      to={`/labirintos/${item.id}`}
                      className={'maze-gallery-row' + (index === matchIndex ? ' is-matched' : '')}
                    >
                      <img className="maze-gallery-row-thumb" src={item.thumb} alt="" />
                      <div className="maze-gallery-row-main">
                        <h2>{item.title}</h2>
                        <p>{describeMaze(item)}</p>
                      </div>
                      <div className="maze-gallery-row-meta">
                        <span className="maze-gallery-row-group">{groupLabel(item.group)}</span>
                        <span className="maze-gallery-row-dims">
                          {item.cols}×{item.rows}
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
