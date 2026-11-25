import { useEffect, useRef, useState } from 'react'
import { CloseIcon } from './icons'
import './GraficoGaleria.css'

export type Grafico = {
  arquivo: string
  titulo: string
  legenda?: string
  rotulo?: string
}

type Props = {
  itens: Grafico[]
  pasta: string
  compacta?: boolean
}

export function GraficoGaleria({ itens, pasta, compacta = false }: Props) {
  const [aberto, setAberto] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])

  const caminho = (grafico: Grafico) => `${pasta}/${grafico.arquivo}`
  const atual = aberto === null ? null : itens[aberto]

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (aberto !== null && !dialog.open) dialog.showModal()
    if (aberto === null && dialog.open) dialog.close()
  }, [aberto])

  const fechar = () => {
    const indice = aberto
    setAberto(null)
    if (indice !== null) cardsRef.current[indice]?.focus()
  }

  const mover = (passo: number) => {
    setAberto((indice) => (indice === null ? null : (indice + passo + itens.length) % itens.length))
  }

  const teclado = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      mover(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      mover(-1)
    }
  }

  if (itens.length === 0) return null

  return (
    <>
      <ul className={compacta ? 'graficos-grade graficos-grade-compacta' : 'graficos-grade'}>
        {itens.map((grafico, indice) => (
          <li key={grafico.arquivo}>
            <button
              type="button"
              className="grafico-card"
              ref={(elemento) => { cardsRef.current[indice] = elemento }}
              onClick={() => setAberto(indice)}
            >
              <span className="grafico-card-imagem">
                <img src={caminho(grafico)} alt="" loading="lazy" />
              </span>
              <span className="grafico-card-texto">
                {grafico.rotulo && <span className="grafico-card-grupo">{grafico.rotulo}</span>}
                <span className="grafico-card-titulo">{grafico.titulo}</span>
                {grafico.legenda && <span className="grafico-card-legenda">{grafico.legenda}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="grafico-modal"
        aria-label={atual?.titulo ?? 'Gráfico'}
        onKeyDown={teclado}
        onCancel={(event) => {
          event.preventDefault()
          fechar()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) fechar()
        }}
      >
        {atual && aberto !== null && (
          <div className="grafico-modal-conteudo">
            <div className="grafico-modal-topo">
              <div>
                <p className="grafico-card-grupo">
                  {atual.rotulo ? `${atual.rotulo} · ` : ''}{aberto + 1} de {itens.length}
                </p>
                <h2>{atual.titulo}</h2>
                {atual.legenda && <p className="grafico-modal-legenda">{atual.legenda}</p>}
              </div>
              <button type="button" className="btn grafico-modal-fechar" aria-label="Fechar" onClick={fechar}>
                <CloseIcon className="grafico-modal-icone" />
              </button>
            </div>
            <div className="grafico-modal-imagem">
              <img src={caminho(atual)} alt={atual.titulo} />
            </div>
            <div className="grafico-modal-rodape">
              <span className="grafico-card-arquivo">{caminho(atual).slice(1)}</span>
              <div className="grafico-modal-acoes">
                {itens.length > 1 && (
                  <>
                    <button type="button" className="btn" onClick={() => mover(-1)}>← Anterior</button>
                    <button type="button" className="btn" onClick={() => mover(1)}>Próximo →</button>
                  </>
                )}
                <a className="btn btn-primary" href={caminho(atual)} target="_blank" rel="noreferrer">
                  Abrir imagem original
                </a>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
