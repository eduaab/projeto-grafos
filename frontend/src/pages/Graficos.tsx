import { useEffect, useRef, useState } from 'react'
import graficos from '../data/graficos.json'
import { CloseIcon } from '../components/icons'
import './Graficos.css'

type Grafico = (typeof graficos)[number]

const GRUPOS = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'algoritmos', rotulo: 'Algoritmos' },
  { id: 'exploratorios', rotulo: 'Exploratórios' },
  { id: 'explanatorios', rotulo: 'Explanatórios' },
  { id: 'apoio', rotulo: 'Apoio' },
]

const NOME_GRUPO: Record<string, string> = {
  algoritmos: 'Algoritmos',
  exploratorios: 'Exploratório',
  explanatorios: 'Explanatório',
  apoio: 'Apoio',
}

const caminho = (grafico: Grafico) => `/parte2/${grafico.arquivo}`

export function Graficos() {
  const [filtro, setFiltro] = useState('todos')
  const [aberto, setAberto] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])

  const visiveis = filtro === 'todos' ? graficos : graficos.filter((grafico) => grafico.grupo === filtro)
  const atual = aberto === null ? null : visiveis[aberto]

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
    setAberto((indice) => (indice === null ? null : (indice + passo + visiveis.length) % visiveis.length))
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

  const escolherFiltro = (id: string) => {
    setFiltro(id)
    setAberto(null)
  }

  return (
    <section className="graficos">
      <header className="page-header graficos-header">
        <p className="graficos-kicker">Parte 2 · dataset ICEWS</p>
        <h1>Gráficos da Parte 2</h1>
        <p>
          Comparação dos algoritmos no grafo de relações entre países (250 países, 29.381 arestas) e análise dos dados
          do ICEWS de 1995 a 2022. Clique em um gráfico para vê-lo em tamanho maior.
        </p>
      </header>

      <div className="graficos-filtros" role="group" aria-label="Filtrar gráficos">
        {GRUPOS.map((grupo) => {
          const quantidade = grupo.id === 'todos'
            ? graficos.length
            : graficos.filter((grafico) => grafico.grupo === grupo.id).length
          return (
            <button
              key={grupo.id}
              type="button"
              className="btn"
              aria-pressed={filtro === grupo.id}
              onClick={() => escolherFiltro(grupo.id)}
            >
              {grupo.rotulo} · {quantidade}
            </button>
          )
        })}
      </div>

      <ul className="graficos-grade">
        {visiveis.map((grafico, indice) => (
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
                <span className="grafico-card-grupo">{NOME_GRUPO[grafico.grupo]}</span>
                <span className="grafico-card-titulo">{grafico.titulo}</span>
                <span className="grafico-card-legenda">{grafico.legenda}</span>
                <span className="grafico-card-arquivo">{grafico.arquivo}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="grafico-modal"
        aria-labelledby="grafico-modal-titulo"
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
                  {NOME_GRUPO[atual.grupo]} · {aberto + 1} de {visiveis.length}
                </p>
                <h2 id="grafico-modal-titulo">{atual.titulo}</h2>
                <p className="grafico-modal-legenda">{atual.legenda}</p>
              </div>
              <button type="button" className="btn grafico-modal-fechar" aria-label="Fechar" onClick={fechar}>
                <CloseIcon className="grafico-modal-icone" />
              </button>
            </div>
            <div className="grafico-modal-imagem">
              <img src={caminho(atual)} alt={atual.titulo} />
            </div>
            <div className="grafico-modal-rodape">
              <span className="grafico-card-arquivo">out/parte2/{atual.arquivo}</span>
              <div className="grafico-modal-acoes">
                <button type="button" className="btn" onClick={() => mover(-1)}>← Anterior</button>
                <button type="button" className="btn" onClick={() => mover(1)}>Próximo →</button>
                <a className="btn btn-primary" href={caminho(atual)} target="_blank" rel="noreferrer">
                  Abrir imagem original
                </a>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  )
}
