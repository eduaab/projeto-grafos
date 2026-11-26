// [IA] Gemini – Tabelas e cartões de resultados da Parte 1 (métricas, camadas, modelagens e m05).
import { useEffect, useState } from 'react'
import './Resultados.css'

type GrafoResumo = {
  ordem: number
  tamanho: number
  densidade: number
}

type MetricaMapa = {
  G_pos: GrafoResumo
  G_est: GrafoResumo
  teto_teorico: number
  taxa_ocupacao: number
  numero_chaves: number
  numero_bonus: number
  multiplicidade_maxima: number
  casas_com_multiplicidade_maxima: number
  numero_becos: number
  becos: string[]
}

type ArcoCamada = {
  origem_camada: string
  destino_camada: string
  casa: { linha: number; coluna: number; simbolo: string }
  quantidade: number
}

type CamadasMapa = {
  camadas: Record<string, GrafoResumo>
  total_arcos_entre_camadas: number
  arcos_entre_camadas: ArcoCamada[]
}

type LinhaModelagem = {
  mapa: string
  abordagem: string
  passos: string
  caminho_valido: boolean
  observacao: string
}

type BellmanM05 = {
  g_pos: { status: string; ciclo?: string[]; custo: number }
  g_est: { status: string; custo: number }
}

type DadosParte1 = {
  metricas: Record<string, MetricaMapa>
  camadas: Record<string, CamadasMapa>
  modelagem: LinhaModelagem[]
  m05: BellmanM05
}

const NOMES_MAPAS: Record<string, [string, string]> = {
  m01_terreno: ['m01', 'Terreno'],
  m02_uma_chave: ['m02', 'Uma chave'],
  m03_tres_chaves: ['m03', 'Três chaves'],
  m04_esteiras: ['m04', 'Esteiras'],
  m05_bonus: ['m05', 'Bônus'],
  m06_fonte: ['m06', 'Fonte'],
  m07_impossivel: ['m07', 'Impossível'],
  m08_grande: ['m08', 'Grande'],
  mapa_grupo_armadilha: ['grupo_armadilha', 'Armadilha'],
  mapa_grupo_cofre: ['grupo_cofre', 'Cofre'],
}

const MAPAS_CAMADAS = ['m02_uma_chave', 'm03_tres_chaves'] as const
const ABORDAGENS = [
  { chave: 'portas_como_chao', titulo: 'Porta como chão' },
  { chave: 'portas_como_parede', titulo: 'Porta como parede' },
  { chave: 'grafo_de_estados', titulo: 'Grafo de estados' },
] as const

function fmtInt(valor: number): string {
  const sinal = valor < 0 ? '−' : ''
  return sinal + Math.abs(valor).toLocaleString('pt-BR')
}

function fmtPct(fracao: number, casas = 1): string {
  return `${(fracao * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`
}

function nomeMapa(id: string): [string, string] {
  return NOMES_MAPAS[id] ?? [id, '']
}

function parseComparacaoCsv(texto: string): LinhaModelagem[] {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)

  if (linhas.length < 2) return []

  const cabecalho = linhas[0].split(',').map((campo) => campo.trim())
  const idx = (campo: string) => cabecalho.indexOf(campo)

  return linhas.slice(1).map((linha) => {
    const colunas = linha.split(',')
    return {
      mapa: (colunas[idx('mapa')] ?? '').trim(),
      abordagem: (colunas[idx('abordagem')] ?? '').trim(),
      passos: (colunas[idx('passos')] ?? '').trim(),
      caminho_valido: (colunas[idx('caminho_valido')] ?? '').trim().toLowerCase() === 'true',
      observacao: colunas.slice(idx('observacao')).join(',').trim(),
    }
  })
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Falha ao carregar ${url}`)
  return response.json() as Promise<T>
}

async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Falha ao carregar ${url}`)
  return response.text()
}

export function ResultadosParte1() {
  const [dados, setDados] = useState<DadosParte1 | 'error' | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    Promise.all([
      fetchJson<Record<string, MetricaMapa>>('/resultados/metricas_global.json', signal),
      fetchJson<Record<string, CamadasMapa>>('/resultados/camadas.json', signal),
      fetchText('/resultados/comparacao_modelagem.csv', signal).then(parseComparacaoCsv),
      fetchJson<BellmanM05>('/resultados/bellman_ford_g_pos_m05.json', signal),
    ])
      .then(([metricas, camadas, modelagem, m05]) => {
        if (!signal.aborted) setDados({ metricas, camadas, modelagem, m05 })
      })
      .catch(() => {
        if (!signal.aborted) setDados('error')
      })

    return () => controller.abort()
  }, [])

  if (dados === null) {
    return <p className="notice" role="status">Carregando resultados da Parte 1…</p>
  }

  if (dados === 'error') {
    return (
      <p className="notice notice-error" role="status">
        Não foi possível carregar os arquivos de resultados da Parte 1.
      </p>
    )
  }

  const entradasMetricas = Object.entries(dados.metricas)

  const mapasModelagem: string[] = []
  const porMapaAbordagem = new Map<string, LinhaModelagem>()
  for (const linha of dados.modelagem) {
    if (!mapasModelagem.includes(linha.mapa)) mapasModelagem.push(linha.mapa)
    porMapaAbordagem.set(`${linha.mapa}|${linha.abordagem}`, linha)
  }

  return (
    <div className="resultados-secao">
      <div className="resultado-bloco">
        <div className="resultado-cabecalho">
          <h3>Métricas dos grafos de posições e de estados</h3>
          <p>
            Comparação entre o grafo de posições (G_pos) e o grafo de estados alcançáveis (G_est),
            lida direto de <code>metricas_global.json</code> e <code>camadas.json</code>.
          </p>
        </div>

        <div className="tabela-wrap">
          <table className="resultado-tabela">
            <thead>
              <tr>
                <th>Mapa</th>
                <th>G_pos (V/E)</th>
                <th>G_est (V/E)</th>
                <th>Densidade G_est</th>
                <th>Teto</th>
                <th>Ocupação (%)</th>
                <th>Multiplicidade máx. (casas)</th>
                <th>Becos</th>
              </tr>
            </thead>
            <tbody>
              {entradasMetricas.map(([id, m]) => {
                const [codigo, sub] = nomeMapa(id)
                const casasTexto = m.casas_com_multiplicidade_maxima === 1 ? 'casa' : 'casas'
                return (
                  <tr key={id}>
                    <td>
                      <span className="mapa-celula" title={id}>
                        <span className="mapa-codigo">{codigo}</span>
                        {sub && <span className="mapa-sub">{sub}</span>}
                      </span>
                    </td>
                    <td className="num">{fmtInt(m.G_pos.ordem)} / {fmtInt(m.G_pos.tamanho)}</td>
                    <td className="num">{fmtInt(m.G_est.ordem)} / {fmtInt(m.G_est.tamanho)}</td>
                    <td className="num">{fmtPct(m.G_est.densidade, 2)}</td>
                    <td className="num">{fmtInt(m.teto_teorico)}</td>
                    <td className="num">{fmtPct(m.taxa_ocupacao, 1)}</td>
                    <td className="num">
                      {fmtInt(m.multiplicidade_maxima)} ({fmtInt(m.casas_com_multiplicidade_maxima)} {casasTexto})
                    </td>
                    <td className="num" title={m.becos.length ? m.becos.join(', ') : undefined}>
                      {m.numero_becos > 0 ? (
                        <span className="badge badge-alerta">{fmtInt(m.numero_becos)}</span>
                      ) : (
                        fmtInt(m.numero_becos)
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="resultado-grade-2">
          {MAPAS_CAMADAS.map((id) => {
            const info = dados.camadas[id]
            if (!info) return null
            const [codigo, sub] = nomeMapa(id)
            return (
              <article key={id} className="resultado-card">
                <div className="resultado-card-topo">
                  <span className="resultado-card-titulo">
                    Camadas · {codigo} ({sub})
                  </span>
                  <span className="badge badge-neutro">
                    {fmtInt(info.total_arcos_entre_camadas)}{' '}
                    {info.total_arcos_entre_camadas === 1 ? 'arco entre camadas' : 'arcos entre camadas'}
                  </span>
                </div>
                <ul className="resultado-lista">
                  {Object.entries(info.camadas).map(([chaves, resumo]) => (
                    <li key={chaves}>
                      <span>
                        Camada <code>{chaves}</code>
                      </span>
                      <span className="num">
                        {fmtInt(resumo.ordem)} estados · {fmtInt(resumo.tamanho)} arcos ({fmtPct(resumo.densidade, 1)})
                      </span>
                    </li>
                  ))}
                </ul>
                {info.arcos_entre_camadas.length > 0 && (
                  <>
                    <p className="camadas-subtitulo">Transições por chave</p>
                    <ul className="resultado-lista">
                      {info.arcos_entre_camadas.map((arco) => (
                        <li key={`${arco.origem_camada}-${arco.destino_camada}-${arco.casa.linha}-${arco.casa.coluna}`}>
                          <span>
                            <code>{arco.origem_camada}</code> → <code>{arco.destino_camada}</code>
                          </span>
                          <span className="num">
                            chave <code>{arco.casa.simbolo}</code> em ({arco.casa.linha},{arco.casa.coluna}) ·{' '}
                            {fmtInt(arco.quantidade)} {arco.quantidade === 1 ? 'arco' : 'arcos'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            )
          })}
        </div>
      </div>

      <div className="resultado-bloco">
        <div className="resultado-cabecalho">
          <h3>Comparação de modelagens</h3>
          <p>
            Efeito de simplificar portas no grafo de posições em vez de modelar o grafo de estados
            (<code>comparacao_modelagem.csv</code>).
          </p>
        </div>

        <div className="tabela-wrap">
          <table className="resultado-tabela">
            <thead>
              <tr>
                <th>Mapa</th>
                {ABORDAGENS.map((abordagem) => (
                  <th key={abordagem.chave}>{abordagem.titulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mapasModelagem.map((mapaId) => {
                const [codigo, sub] = nomeMapa(mapaId)
                return (
                  <tr key={mapaId}>
                    <td>
                      <span className="mapa-celula" title={mapaId}>
                        <span className="mapa-codigo">{codigo}</span>
                        {sub && <span className="mapa-sub">{sub}</span>}
                      </span>
                    </td>
                    {ABORDAGENS.map(({ chave }) => {
                      const celula = porMapaAbordagem.get(`${mapaId}|${chave}`)
                      if (!celula || !celula.passos) {
                        return (
                          <td key={chave}>
                            <span className="badge badge-neutro">sem caminho</span>
                          </td>
                        )
                      }
                      const passos = Number(celula.passos)
                      return (
                        <td key={chave} title={celula.observacao || undefined}>
                          <span className={celula.caminho_valido ? 'badge badge-ok' : 'badge badge-erro'}>
                            {fmtInt(passos)} passos · {celula.caminho_valido ? 'válido' : 'inválido'}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="resultado-bloco">
        <div className="resultado-cabecalho">
          <h3>m05: Grafo de posições × Grafo de estados</h3>
          <p>
            Resultado do Bellman-Ford no mapa com bônus negativos (<code>bellman_ford_g_pos_m05.json</code>).
          </p>
        </div>

        <div className="resultado-grade-2">
          <article className="resultado-card">
            <div className="resultado-card-topo">
              <span className="resultado-card-titulo">Grafo de posições (G_pos)</span>
              <span className="badge badge-erro">
                {dados.m05.g_pos.status === 'CICLO_NEGATIVO' ? 'Ciclo negativo' : dados.m05.g_pos.status}
              </span>
            </div>
            <p className="resultado-card-sub">Bônus valendo −4 fixo em toda passagem.</p>
            {dados.m05.g_pos.ciclo && (
              <p className="resultado-destaque">{dados.m05.g_pos.ciclo.join(' → ')}</p>
            )}
            <p className="resultado-card-sub">
              Custo <strong className="num">{fmtInt(dados.m05.g_pos.custo)}</strong> por volta.
            </p>
          </article>

          <article className="resultado-card">
            <div className="resultado-card-topo">
              <span className="resultado-card-titulo">Grafo de estados (G_est)</span>
              <span className="badge badge-ok">
                {dados.m05.g_est.status === 'OK' ? 'Sem ciclo' : dados.m05.g_est.status}
              </span>
            </div>
            <p className="resultado-card-sub">Bônus registrado no estado e consumido uma única vez.</p>
            <p className="resultado-destaque">Menor custo: {fmtInt(dados.m05.g_est.custo)}</p>
            <p className="resultado-card-sub">Solução finita encontrada pelo Bellman-Ford.</p>
          </article>
        </div>
      </div>
    </div>
  )
}
