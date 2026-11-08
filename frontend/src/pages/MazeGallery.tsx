import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import manifest from '../data/mapas.manifest.json'
import { parseMaze, type ParsedMaze } from '../lib/parseMaze'
import { mazeThumbnailDataUrl } from '../lib/mazeThumbnailImage'
import { CircularCarousel, type CircularCarouselHandle, type CircularCarouselItem } from '../components/CircularCarousel'
import { GridIcon, SearchIcon } from '../components/icons'
import { describeMaze } from '../lib/mazeDescriptions'
import './MazeGallery.css'

type ManifestEntry = (typeof manifest)[number]
type GalleryItem = ManifestEntry & { maze: ParsedMaze }
type View = 'carousel' | 'grid'
type GroupFilter = 'all' | ManifestEntry['group']

const GROUP_FILTERS: { value: GroupFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'oficial', label: 'Mapas Oficiais' },
  { value: 'grupo', label: 'Mapas do Grupo' },
  { value: 'criado', label: 'Mapas Criados' },
]

// Exit simultaneous and plain (the user already decided to filter it out);
// entrance gets a short stagger capped at the first handful of cards so a
// big result set doesn't make the last card wait through a long queue.
type CardVariantArgs = { index: number; reduced: boolean }

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

const cardVariants = {
  hidden: ({ reduced }: CardVariantArgs) => ({ opacity: 0, scale: reduced ? 1 : 0.95 }),
  visible: ({ index, reduced }: CardVariantArgs) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: reduced ? 0.12 : 0.2,
      ease: EASE_OUT,
      delay: reduced ? 0 : Math.min(index, 6) * 0.03,
    },
  }),
  exit: ({ reduced }: CardVariantArgs) => ({
    opacity: 0,
    scale: reduced ? 1 : 0.95,
    transition: { duration: reduced ? 0.12 : 0.15, ease: EASE_OUT },
  }),
}

// CircularCarousel's cards share one aspect ratio — generate every thumbnail
// at that same ratio so each maze's own letterboxing already matches the
// card shape, instead of the card's object-fit cropping into it again.
const CARD_ASPECT = 1.5

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function MazeGallery() {
  const [items, setItems] = useState<GalleryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [view, setView] = useState<View>('carousel')
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  const navigate = useNavigate()
  const carouselRef = useRef<CircularCarouselHandle>(null)
  const gridRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let cancelled = false

    Promise.all(
      manifest.map(async (entry) => {
        const response = await fetch(`/mapas/${entry.filename}`)
        if (!response.ok) throw new Error(`Falha ao carregar ${entry.filename}`)
        const text = await response.text()
        return { ...entry, maze: parseMaze(text) }
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

  // The group filter narrows what the carousel/grid actually render — search
  // and the active-index bookkeeping below all operate on this, not on the
  // full `items`, so an index always points at something currently visible.
  const visibleItems = useMemo(
    () => (items ? (groupFilter === 'all' ? items : items.filter((item) => item.group === groupFilter)) : null),
    [items, groupFilter],
  )

  // Filtering changes which indices exist — land back on the first card
  // instead of keeping a now-meaningless offset into the new subset.
  useEffect(() => {
    setActiveIndex(0)
  }, [groupFilter])

  const carouselItems: CircularCarouselItem[] = useMemo(
    () =>
      visibleItems
        ? visibleItems.map((item) => ({
            src: mazeThumbnailDataUrl(item.maze, 480, 480 / CARD_ASPECT),
            title: item.title,
            alt: item.title,
          }))
        : [],
    [visibleItems],
  )

  // Live search: the first map whose name/id contains the typed text, and
  // it recomputes on every keystroke, driving whichever view is showing.
  const matchIndex = useMemo(() => {
    if (!visibleItems || !query.trim()) return null
    const needle = normalize(query)
    const found = visibleItems.findIndex((item) => normalize(`${item.id} ${item.title}`).includes(needle))
    return found === -1 ? null : found
  }, [visibleItems, query])

  useEffect(() => {
    if (matchIndex === null) return
    if (view === 'carousel') {
      carouselRef.current?.focusIndex(matchIndex)
    } else {
      gridRefs.current[matchIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [matchIndex, view])

  const active = visibleItems?.[activeIndex]

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

          <div className="maze-gallery-toolbar">
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

            <button
              type="button"
              className="maze-view-toggle"
              onClick={() => setView((v) => (v === 'carousel' ? 'grid' : 'carousel'))}
            >
              <GridIcon className="maze-view-toggle-icon" />
              {view === 'carousel' ? 'Ver em grade' : 'Ver em carrossel'}
            </button>
          </div>

          {visibleItems.length === 0 ? (
            <p className="maze-gallery-empty">Nenhum labirinto neste filtro ainda.</p>
          ) : view === 'carousel' ? (
            <div className="maze-gallery-stage-group">
              <div className="maze-gallery-carousel">
                <CircularCarousel
                  ref={carouselRef}
                  items={carouselItems}
                  preset="cylinder"
                  intro="rise"
                  autoplay="drift"
                  speed={10}
                  cardWidth={380}
                  aspectRatio={CARD_ASPECT}
                  gap={36}
                  onChange={setActiveIndex}
                  onItemClick={(_, index) => navigate(`/labirintos/${visibleItems[index].id}`)}
                />
              </div>

              {active && (
                <div className="maze-gallery-active">
                  <h2>{active.title}</h2>
                  <p className="maze-gallery-active-desc">{describeMaze(active)}</p>
                  <p className="maze-gallery-active-count">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(visibleItems.length).padStart(2, '0')}
                  </p>
                  <Link to={`/labirintos/${active.id}`} className="maze-gallery-open">
                    Abrir mapa
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="maze-gallery-grid">
              <AnimatePresence mode="popLayout">
                {visibleItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout={!reducedMotion}
                    custom={{ index, reduced: Boolean(reducedMotion) }}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ layout: { duration: 0.2, ease: EASE_OUT } }}
                  >
                    <Link
                      ref={(element) => {
                        gridRefs.current[index] = element
                      }}
                      to={`/labirintos/${item.id}`}
                      className={'maze-gallery-card' + (index === matchIndex ? ' is-matched' : '')}
                    >
                      <img className="maze-gallery-card-thumb" src={carouselItems[index]?.src} alt="" />
                      <div className="maze-gallery-card-body">
                        <h2>{item.title}</h2>
                        <p>
                          {item.cols}×{item.rows}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </section>
  )
}
