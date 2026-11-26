// [IA] Gemini – Tabelas e cartões dos casos obrigatórios da Parte 2 (parte2_report.json).
import { useEffect, useState } from 'react'
import './Resultados.css'

type BuscaFonte = {
  bfs_alcancados: number
  bfs_max_camada: number
  bfs_camadas: Record<string, number>
  dfs_contagem_arestas: {
    arvore: number
    retorno: number
    avanco: number
    cruzamento: number
  }
  dfs_tem_ciclo: boolean
  dfs_exemplo_ciclo?: string[]
}

type ArestaCiclo = {
  origem: string
  destino: string
  peso: number
  n_eventos: number
  par_fraco: boolean
}

type CicloNegativo = {
  ciclo: string[]
  custo_ciclo: number
  arestas_ciclo: ArestaCiclo[]
  usa_par_fraco: boolean
}

type RecorteSemCiclo = {
  n_nos: number
  n_arestas: number
  n_negativas: number
  nos_sem_saida: number
  top_5_ordem: string[]
  execucoes: Record<string, { alcancados: number; ciclo: string[] | null; dfs_arestas_retorno: number }>
}

type Parte2Report = {
  casos_obrigatorios: {
    bfs_dfs_3_fontes: Record<string, BuscaFonte>
    bellman_ford_com_ciclo: Record<string, CicloNegativo>
    bellman_ford_sem_ciclo: RecorteSemCiclo
  }
  robustez_sem_pares_fracos: {
    n_arestas: number
    bellman_ford_com_ciclo: Record<string, CicloNegativo>
  }
}

const PAISES_PT: Record<string, string> = {
  'United States': 'Estados Unidos',
  Brazil: 'Brasil',
  Israel: 'Israel',
  'Russian Federation': 'Rússia',
  China: 'China',
  Japan: 'Japão',
  Guyana: 'Guiana',
  'Curaçao': 'Curaçao',
  'Saint Helena': 'Santa Helena',
  Ecuador: 'Equador',
}

function paisPt(nome: string): string {
  return PAISES_PT[nome] ?? nome
}

function fmtInt(valor: number): string {
  const sinal = valor < 0 ? '−' : ''
  return sinal + Math.abs(valor).toLocaleString('pt-BR')
}

function fmtPeso(valor: number, comSinalPositivo = false): string {
  const sinal = valor < 0 ? '−' : comSinalPositivo && valor > 0 ? '+' : ''
  const texto = Math.abs(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })
  return `${sinal}${texto}`
}

function formatarCamadas(camadas: Record<string, number>): string {
  return Object.entries(camadas)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, qtd]) => fmtInt(qtd))
    .join(' · ')
}

function CartaoCiclo({
  titulo,
  subtitulo,
  ciclo,
}: {
  titulo: string
  subtitulo: string
  ciclo: CicloNegativo
}) {
  return (
    <article className="resultado-card">
      <div className="resultado-card-topo">
        <span className="resultado-card-titulo">{titulo}</span>
        <span className="badge badge-erro">custo {fmtPeso(ciclo.custo_ciclo)}</span>
      </div>
      <p className="resultado-card-sub">{subtitulo}</p>
      <p className="resultado-destaque">{ciclo.ciclo.map(paisPt).join(' → ')}</p>
      <ul className="resultado-lista">
        {ciclo.arestas_ciclo.map((aresta) => (
          <li key={`${aresta.origem}-${aresta.destino}`}>
            <span>
              {paisPt(aresta.origem)} → {paisPt(aresta.destino)}
            </span>
            <span className="num">
              {fmtPeso(aresta.peso, true)} · {fmtInt(aresta.n_eventos)}{' '}
              {aresta.n_eventos === 1 ? 'evento' : 'eventos'}
              {aresta.par_fraco && (
                <>
                  {' '}
                  <span className="badge badge-alerta">par fraco</span>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function ResultadosParte2() {
  const [report, setReport] = useState<Parte2Report | 'error' | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/resultados/parte2_report.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao carregar parte2_report.json')
        return response.json() as Promise<Parte2Report>
      })
      .then((json) => {
        if (!controller.signal.aborted) setReport(json)
      })
      .catch(() => {
        if (!controller.signal.aborted) setReport('error')
      })

    return () => controller.abort()
  }, [])

  if (report === null) {
    return <p className="notice" role="status">Carregando resultados da Parte 2…</p>
  }

  if (report === 'error') {
    return (
      <p className="notice notice-error" role="status">
        Não foi possível carregar os resultados de <code>parte2_report.json</code>.
      </p>
    )
  }

  const { bfs_dfs_3_fontes: buscas, bellman_ford_com_ciclo: bfCompleto, bellman_ford_sem_ciclo: recorte } =
    report.casos_obrigatorios
  const cicloCompleto = bfCompleto.Brazil ?? Object.values(bfCompleto)[0]
  const cicloSemFracos =
    report.robustez_sem_pares_fracos.bellman_ford_com_ciclo.Brazil ??
    Object.values(report.robustez_sem_pares_fracos.bellman_ford_com_ciclo)[0]
  const execEua = recorte.execucoes['United States']
  const execBrasil = recorte.execucoes.Brazil

  return (
    <div className="resultados-secao">
      <div className="resultado-bloco">
        <div className="resultado-cabecalho">
          <h3>Casos obrigatórios: BFS e DFS nas três fontes</h3>
          <p>
            Camadas alcançadas pela BFS e classificação de arestas da DFS no grafo completo
            (<code>parte2_report.json</code>).
          </p>
        </div>

        <div className="tabela-wrap">
          <table className="resultado-tabela">
            <thead>
              <tr>
                <th>Fonte</th>
                <th>Países por camada (BFS)</th>
                <th>Árvore / retorno / avanço / cruzamento (DFS)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(buscas).map(([fonte, caso]) => {
                const c = caso.dfs_contagem_arestas
                return (
                  <tr key={fonte}>
                    <td>
                      <strong>{paisPt(fonte)}</strong>
                    </td>
                    <td className="num">{formatarCamadas(caso.bfs_camadas)}</td>
                    <td className="num">
                      {fmtInt(c.arvore)} / {fmtInt(c.retorno)} / {fmtInt(c.avanco)} / {fmtInt(c.cruzamento)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="resultado-bloco">
        <div className="resultado-cabecalho">
          <h3>Ciclo negativo no Bellman-Ford: grafo completo × sem pares fracos</h3>
          <p>
            Retirar arestas de evento único altera qual ciclo é encontrado, mas a rede continua tendo ciclo negativo.
          </p>
        </div>

        <div className="resultado-grade-2">
          {cicloCompleto && (
            <CartaoCiclo
              titulo="Grafo completo"
              subtitulo="Inclui arestas com apenas 1 evento (pares fracos)."
              ciclo={cicloCompleto}
            />
          )}
          {cicloSemFracos && (
            <CartaoCiclo
              titulo="Sem pares fracos"
              subtitulo={`Grafo filtrado com ${fmtInt(report.robustez_sem_pares_fracos.n_arestas)} arestas (n ≥ 2 eventos).`}
              ciclo={cicloSemFracos}
            />
          )}
        </div>
      </div>

      <div className="resultado-bloco">
        <div className="resultado-cabecalho">
          <h3>Recorte acíclico no Bellman-Ford</h3>
        </div>
        <p className="resultado-faixa">
          Recorte com <strong className="num">{fmtInt(recorte.n_nos)}</strong> países,{' '}
          <strong className="num">{fmtInt(recorte.n_arestas)}</strong> arestas e{' '}
          <strong className="num">{fmtInt(recorte.n_negativas)}</strong> negativas (
          <span className="num">{fmtInt(recorte.nos_sem_saida)}</span> nós sem saída).
          {execEua && (
            <>
              {' '}
              A partir dos <strong>Estados Unidos</strong> alcança{' '}
              <strong className="num">{fmtInt(execEua.alcancados)}</strong> países,{' '}
              {execEua.ciclo ? 'com ciclo' : 'sem ciclo'} e com{' '}
              <strong className="num">{fmtInt(execEua.dfs_arestas_retorno)}</strong> arestas de retorno
              {execBrasil && (
                <>
                  {' '}
                  (a partir do <strong>Brasil</strong>: <span className="num">{fmtInt(execBrasil.alcancados)}</span>{' '}
                  alcançados e <span className="num">{fmtInt(execBrasil.dfs_arestas_retorno)}</span> arestas de retorno)
                </>
              )}
              .
            </>
          )}{' '}
          A ordem de atividade começa por <strong>{recorte.top_5_ordem.map(paisPt).join(', ')}</strong>.
        </p>
      </div>
    </div>
  )
}
