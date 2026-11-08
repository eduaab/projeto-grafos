import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import './Modal.css'

type ModalProps = {
  title: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel: string
  confirmDisabled?: boolean
  children: ReactNode
}

const MAX_TILT_DEG = 8 // noticeable without making the maze preview hard to read

export function Modal({ title, onClose, onConfirm, confirmLabel, confirmDisabled, children }: ModalProps) {
  const tiltRef = useRef<HTMLDivElement>(null)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // A light "catches the light as it tilts" touch (inspired by reactbits.dev's
  // ReflectiveCard — that one drives the reflection from a WebGL shader
  // compositing your webcam or a video; this is a plain CSS/pointer version:
  // no camera, no GPU shader, just a subtle tilt + a glare highlight that
  // follows the cursor). The card is the title + maze preview, tilting as one
  // piece. The close button and Cancelar/confirm buttons live outside it
  // entirely — floating on the overlay with no enclosing panel of their own
  // — so they stay put under the cursor instead of drifting with the card.
  // Direct style writes, not React state — this fires on every pointermove
  // and a re-render per move would drop frames.
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotionRef.current || event.pointerType !== 'mouse') return
    const el = tiltRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
    el.style.setProperty('--rc-rotate-x', `${(-ny * MAX_TILT_DEG).toFixed(2)}deg`)
    el.style.setProperty('--rc-rotate-y', `${(nx * MAX_TILT_DEG).toFixed(2)}deg`)
    el.style.setProperty('--rc-glare-x', `${(((nx + 1) / 2) * 100).toFixed(1)}%`)
    el.style.setProperty('--rc-glare-y', `${(((ny + 1) / 2) * 100).toFixed(1)}%`)
    el.style.setProperty('--rc-glare-opacity', '1')
  }

  const resetTilt = () => {
    const el = tiltRef.current
    if (!el) return
    el.style.setProperty('--rc-rotate-x', '0deg')
    el.style.setProperty('--rc-rotate-y', '0deg')
    el.style.setProperty('--rc-glare-opacity', '0')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-stage" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon className="modal-close-icon" />
        </button>

        <div
          ref={tiltRef}
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetTilt}
        >
          <h2 className="modal-card-title">{title}</h2>
          <div className="modal-body">{children}</div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
