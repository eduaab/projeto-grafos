import { useRef, useState } from 'react'
import etapas from '../data/linha_do_tempo.json'
import graficos from '../data/graficos.json'
import { GraficoGaleria, type Grafico } from './GraficoGaleria'
import './LinhaDoTempo.css'

type Etapa = (typeof etapas)[number]
type Modo = 'cards' | 'secoes'

const REPOSITORIO = 'https://github.com/eduaab/projeto-grafos/blob/main/'

const graficosDa = (etapa: Etapa): Grafico[] =>
  etapa.graficos.flatMap((arquivo) => graficos.filter((grafico) => grafico.arquivo === arquivo))

function Arquivos({ etapa }: { etapa: Etapa }) {
  return (
    <ul className="etapa-arquivos">
      {etapa.arquivos.map((arquivo) => (
        <li key={arquivo}>
          <a href={REPOSITORIO + arquivo} target="_blank" rel="noreferrer">{arquivo}</a>
        </li>
      ))}
    </ul>
  )
}

function TextoDoGrupo() {
  return <p className="etapa-texto-grupo">Decisões e motivos desta etapa (texto do grupo).</p>
}

function DetalheEtapa({ etapa }: { etapa: Etapa }) {
  return (
    <>
      {etapa.detalhe && <p className="etapa-detalhe">{etapa.detalhe}</p>}
      <TextoDoGrupo />
      <Arquivos etapa={etapa} />
      <GraficoGaleria itens={graficosDa(etapa)} pasta="/parte2" compacta />
    </>
  )
}

function Cards() {
  const [selecionada, setSelecionada] = useState(0)
  const trilhoRef = useRef<HTMLOListElement>(null)
  const etapa = etapas[selecionada]

  const escolher = (indice: number) => {
    const proxima = (indice + etapas.length) % etapas.length
    setSelecionada(proxima)
    trilhoRef.current?.children[proxima]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  return (
    <div className="ldt-cards">
      <div className="ldt-trilho-moldura">
        <button type="button" className="btn ldt-seta" aria-label="Etapa anterior" onClick={() => escolher(selecionada - 1)}>←</button>
        <ol className="ldt-trilho" ref={trilhoRef}>
          {etapas.map((item, indice) => {
            const capa = graficosDa(item)[0]
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="ldt-card"
                  aria-pressed={indice === selecionada}
                  onClick={() => escolher(indice)}
                >
                  <span className="ldt-numero">{String(indice + 1).padStart(2, '0')}</span>
                  <span className="ldt-card-titulo">{item.titulo}</span>
                  <span className="ldt-card-resumo">{item.resumo}</span>
                  <span className="ldt-card-capa">
                    {capa ? <img src={`/parte2/${capa.arquivo}`} alt="" loading="lazy" /> : <span>sem gráfico</span>}
                  </span>
                  <span className="ldt-card-rodape">
                    {item.graficos.length} gráfico{item.graficos.length === 1 ? '' : 's'}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <button type="button" className="btn ldt-seta" aria-label="Próxima etapa" onClick={() => escolher(selecionada + 1)}>→</button>
      </div>

      <article className="ldt-painel" aria-live="polite">
        <p className="ldt-kicker">Etapa {selecionada + 1} de {etapas.length}</p>
        <h3>{etapa.titulo}</h3>
        <p className="etapa-resumo">{etapa.resumo}</p>
        <DetalheEtapa etapa={etapa} />
      </article>
    </div>
  )
}

function Secoes() {
  return (
    <ol className="ldt-secoes">
      {etapas.map((etapa, indice) => (
        <li key={etapa.id} className="ldt-secao">
          <span className="ldt-marcador" aria-hidden="true">{String(indice + 1).padStart(2, '0')}</span>
          <div className="ldt-secao-corpo">
            <h3>{etapa.titulo}</h3>
            <p className="etapa-resumo">{etapa.resumo}</p>
            <DetalheEtapa etapa={etapa} />
          </div>
        </li>
      ))}
    </ol>
  )
}

export function LinhaDoTempo() {
  const [modo, setModo] = useState<Modo>('cards')

  return (
    <div className="ldt">
      <div className="ldt-modos" role="group" aria-label="Formato da linha do tempo">
        <button type="button" className="btn" aria-pressed={modo === 'cards'} onClick={() => setModo('cards')}>
          Cards laterais
        </button>
        <button type="button" className="btn" aria-pressed={modo === 'secoes'} onClick={() => setModo('secoes')}>
          Seções verticais
        </button>
      </div>
      {modo === 'cards' ? <Cards /> : <Secoes />}
    </div>
  )
}
