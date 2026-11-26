import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { cellFromChar } from '../lib/parseMaze'
import { MazeCellContent } from './MazeCellContent'
import { HandIcon } from './icons'
import './MazeGrid.css'
import './MazeEditorGrid.css'

type MazeEditorGridProps = {
  grid: string[][]
  onPaint: (row: number, col: number) => void
}

const CELL_SIZE = 42
const CELL_GAP = 2
const MAX_ZOOM = 2.5
const ZOOM_STEP = 1.25

export function MazeEditorGrid({ grid, onPaint }: MazeEditorGridProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null)
  const [manualZoom, setManualZoom] = useState<number | null>(null)
  const [handMode, setHandMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const zoomCenter = useRef<{ x: number; y: number } | null>(null)
  const panDrag = useRef<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null)
  const paintDrag = useRef<{ pointerId: number; x: number; y: number; cell: HTMLDivElement } | null>(null)
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const fitZoom = viewport && cols > 0 && rows > 0 ? Math.min(
    MAX_ZOOM,
    viewport.width / (cols * (CELL_SIZE + CELL_GAP) - CELL_GAP),
    viewport.height / (rows * (CELL_SIZE + CELL_GAP) - CELL_GAP),
  ) : 1
  const minZoom = Math.min(.2, fitZoom)
  const zoom = manualZoom ?? fitZoom

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const padding = 2 * parseFloat(getComputedStyle(el).getPropertyValue('--editor-map-padding'))
      setViewport({
        width: Math.max(1, el.clientWidth - padding - 1),
        height: Math.max(1, el.clientHeight - padding - 1),
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = viewportRef.current
    const center = zoomCenter.current
    if (!el || !center) return
    zoomCenter.current = null
    el.scrollLeft = center.x * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = center.y * el.scrollHeight - el.clientHeight / 2
  }, [manualZoom])

  const changeZoom = (factor: number) => {
    const el = viewportRef.current
    if (el) {
      zoomCenter.current = {
        x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      }
    }
    setManualZoom(Math.max(minZoom, Math.min(MAX_ZOOM, zoom * factor)))
  }

  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (!handMode || event.button !== 0 || panDrag.current) return
    event.preventDefault()
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    panDrag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: target.scrollLeft,
      top: target.scrollTop,
    }
    setIsDragging(true)
  }

  const pan = (event: PointerEvent<HTMLDivElement>) => {
    const drag = panDrag.current
    if (!drag || event.pointerId !== drag.pointerId) return
    event.currentTarget.scrollLeft = drag.left + drag.x - event.clientX
    event.currentTarget.scrollTop = drag.top + drag.y - event.clientY
  }

  const stopPan = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== panDrag.current?.pointerId) return
    panDrag.current = null
    setIsDragging(false)
  }

  // [IA] ChatGPT – Corrigir a pintura duplicada ao distinguir clique de arrasto.
  const startPaint = (event: PointerEvent<HTMLDivElement>, row: number, col: number) => {
    if (handMode || event.button !== 0 || paintDrag.current) return
    event.preventDefault()
    const cell = event.currentTarget
    cell.setPointerCapture(event.pointerId)
    paintDrag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, cell }
    onPaint(row, col)
  }

  const continuePaint = (event: PointerEvent<HTMLDivElement>) => {
    const drag = paintDrag.current
    if (!drag || event.pointerId !== drag.pointerId || !(event.buttons & 1)) return
    if (event.clientX === drag.x && event.clientY === drag.y) return
    drag.x = event.clientX
    drag.y = event.clientY

    const cell = document.elementFromPoint(drag.x, drag.y)?.closest<HTMLDivElement>('[data-editor-cell]')
    if (!cell || cell === drag.cell || !event.currentTarget.contains(cell)) return
    drag.cell = cell
    onPaint(Number(cell.dataset.row), Number(cell.dataset.col))
  }

  const stopPaint = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId === paintDrag.current?.pointerId) paintDrag.current = null
  }

  const gridStyle = {
    '--maze-cell-size': `${CELL_SIZE * zoom}px`,
    gap: CELL_GAP * zoom,
    gridTemplateColumns: `repeat(${cols}, var(--maze-cell-size))`,
    gridTemplateRows: `repeat(${rows}, var(--maze-cell-size))`,
  } as CSSProperties

  return (
    <div className="maze-editor-frame">
      <div className="maze-editor-zoom" role="group" aria-label="Controles da área do labirinto">
        <button
          className="btn maze-editor-hand"
          type="button"
          aria-label="Mão"
          aria-pressed={handMode}
          title="Arrastar para mover o mapa"
          onClick={() => setHandMode(!handMode)}
        >
          <HandIcon />
        </button>
        <button className="btn" type="button" aria-label="Afastar" onClick={() => changeZoom(1 / ZOOM_STEP)} disabled={zoom <= minZoom}>−</button>
        <output>{Math.max(1, Math.round(zoom * 100))}%</output>
        <button className="btn" type="button" aria-label="Aproximar" onClick={() => changeZoom(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}>+</button>
        <button className="btn" type="button" onClick={() => setManualZoom(null)}>Ajustar à área</button>
      </div>
      <div
        ref={viewportRef}
        className="maze-grid-viewport maze-editor-viewport"
        data-hand={handMode || undefined}
        data-dragging={isDragging || undefined}
        role="region"
        aria-label="Área do labirinto"
        tabIndex={0}
        onPointerDown={startPan}
        onPointerMove={pan}
        onPointerUp={stopPan}
        onPointerCancel={stopPan}
        onLostPointerCapture={stopPan}
      >
        <div className="maze-editor-canvas">
          <div
              className="maze-grid maze-editor-grid"
              style={gridStyle}
              role="img"
              aria-label={`Grade do editor, ${cols} por ${rows} células`}
              onPointerMove={continuePaint}
              onPointerUp={stopPaint}
              onPointerCancel={stopPaint}
              onLostPointerCapture={stopPaint}
              onContextMenu={(event) => event.preventDefault()}
            >
              {grid.map((row, r) =>
                row.map((char, c) => {
                  const cell = cellFromChar(char)
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`maze-cell maze-editor-cell maze-cell--${cell.type}`}
                      data-editor-cell
                      data-row={r}
                      data-col={c}
                      onPointerDown={(event) => startPaint(event, r, c)}
                    >
                      <MazeCellContent cell={cell} />
                    </div>
                  )
                }),
              )}
            </div>
        </div>
      </div>
    </div>
  )
}
