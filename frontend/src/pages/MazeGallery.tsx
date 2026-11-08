import { useEffect, useMemo, useRef, useState } from 'react'
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
  const navigate = useNavigate()
  const carouselRef = useRef<CircularCarouselHandle>(null)
  const gridRefs = useRef<(HTMLAnchorElement | null)[]>([])

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

  const carouselItems: CircularCarouselItem[] = useMemo(
    () =>
      items
        ? items.map((item) => ({
            src: mazeThumbnailDataUrl(item.maze, 480, 480 / CARD_ASPECT),
            title: item.title,
            alt: item.title,
          }))
        : [],
    [items],
  )

  // Live search: the first map whose name/id contains the typed text, and
  // it recomputes on every keystroke, driving whichever view is showing.
  const matchIndex = useMemo(() => {
    if (!items || !query.trim()) return null
    const needle = normalize(query)
    const found = items.findIndex((item) => normalize(`${item.id} ${item.title}`).includes(needle))
    return found === -1 ? null : found
  }, [items, query])

  useEffect(() => {
    if (matchIndex === null) return
    if (view === 'carousel') {
      carouselRef.current?.focusIndex(matchIndex)
    } else {
      gridRefs.current[matchIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [matchIndex, view])

  const active = items?.[activeIndex]

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

      {items && (
        <>
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

          {view === 'carousel' ? (
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
                  onItemClick={(_, index) => navigate(`/labirintos/${items[index].id}`)}
                />
              </div>

              {active && (
                <div className="maze-gallery-active">
                  <h2>{active.title}</h2>
                  <p className="maze-gallery-active-desc">{describeMaze(active)}</p>
                  <p className="maze-gallery-active-count">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                  </p>
                  <Link to={`/labirintos/${active.id}`} className="maze-gallery-open">
                    Abrir mapa
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="maze-gallery-grid">
              {items.map((item, index) => (
                <Link
                  key={item.id}
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
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
