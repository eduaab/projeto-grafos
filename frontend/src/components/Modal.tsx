import { useEffect, type ReactNode } from 'react'
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

export function Modal({ title, onClose, onConfirm, confirmLabel, confirmDisabled, children }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-stage" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon className="modal-close-icon" />
        </button>

        <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
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
