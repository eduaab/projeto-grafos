import { useEffect, useRef, useState, type ReactNode } from 'react'
import './Modal.css'

type ModalProps = {
  title: string
  onClose: () => void
  onConfirm: () => void | Promise<void>
  confirmLabel: string
  confirmDisabled?: boolean
  danger?: boolean
  children: ReactNode
}

export function Modal({ title, onClose, onConfirm, confirmLabel, confirmDisabled, danger, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  const confirm = async () => {
    setPending(true)
    try {
      await onConfirm()
    } finally {
      setPending(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal-card"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose()
      }}
    >
      <div className="modal-content">
        <h2>{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={pending}>Cancelar</button>
          <button type="button" className={'btn ' + (danger ? 'btn-danger' : 'btn-primary')} onClick={confirm} disabled={pending || confirmDisabled}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
