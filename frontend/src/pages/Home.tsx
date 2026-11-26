import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GraficoGaleria } from '../components/GraficoGaleria'
import { LinhaDoTempo } from '../components/LinhaDoTempo'
import { ResultadosParte1 } from '../components/ResultadosParte1'
import { ResultadosParte2 } from '../components/ResultadosParte2'
import figurasParte1 from '../data/figuras_parte1.json'
import graficos from '../data/graficos.json'
import { MazeGrid } from '../components/MazeGrid'
import { parseMaze, type ParsedMaze } from '../lib/parseMaze'
import './Home.css'

const COVER_ID = 'm03_tres_chaves'
const COVER_LEGEND = [
  ['S', 'Início'], ['G', 'Saída'], ['a–c', 'Chaves'], ['A–C', 'Portas'],
  ['~', 'Água'], [',', 'Lama'],
]

// [IA] Claude – seções da home (linha do tempo, Parte 1, Parte 2 e documentação)
const REPOSITORIO = 'https://github.com/eduaab/projeto-grafos'
const ALGORITMOS = graficos.filter((grafico) => grafico.grupo === 'algoritmos')

const DOCUMENTOS = [
  { titulo: 'Repositório', descricao: 'Código, dados processados e resultados.', href: REPOSITORIO },
  { titulo: 'README', descricao: 'Instalação, testes e comandos de cada parte.', href: `${REPOSITORIO}#readme` },
  { titulo: 'Dataset ICEWS', descricao: 'Harvard Dataverse, doi:10.7910/DVN/28075.', href: 'https://doi.org/10.7910/DVN/28075' },
  {
    titulo: 'Validação dos algoritmos',
    descricao: 'Relatórios de testes de BFS, DFS, Dijkstra e Bellman-Ford.',
    href: `${REPOSITORIO}/tree/main/docs`,
  },
  { titulo: 'Relatório técnico (PDF)', descricao: 'Em produção.', href: '' },
]

export function Home() {
  const [cover, setCover] = useState<ParsedMaze | 'error' | null>(null)
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/mapas/${COVER_ID}.txt`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao carregar o mapa da home.')
        return response.text()
      })
      .then((text) => {
        if (!controller.signal.aborted) setCover(parseMaze(text))
      })
      .catch(() => {
        if (!controller.signal.aborted) setCover('error')
      })

    return () => controller.abort()
  }, [])

  return (
    <section className="home">
      <div className="home-cover">
        <div className="home-intro">
          <h1>Labirintos na prática</h1>
          <p>
            Explore mapas com chaves, portas e terrenos de custos diferentes. Desenhe seu próprio labirinto no editor
            ou compare, passo a passo, os caminhos encontrados por BFS, DFS, Dijkstra e Bellman-Ford.
          </p>
          <div className="home-actions">
            <Link to="/labirintos" className="btn btn-primary">Explorar mapas</Link>
            <Link to="/editor" className="btn">Criar labirinto</Link>
          </div>
        </div>
        <figure className="home-exhibit">
          {cover === 'error' ? (
            <p className="notice notice-error" role="status">Não foi possível carregar a prévia do mapa.</p>
          ) : cover ? (
            <MazeGrid maze={cover} />
          ) : (
            <p className="notice" role="status">Carregando mapa…</p>
          )}
          <figcaption>
            <Link className="home-map-title" to={`/labirintos/${COVER_ID}`}>M03 — Três chaves</Link>
            {cover && cover !== 'error' && (
              <ul className="home-key">
                {COVER_LEGEND.map(([symbol, label]) => (
                  <li key={symbol}><b>{symbol}</b> {label}</li>
                ))}
              </ul>
            )}
          </figcaption>
        </figure>
      </div>

      <nav className="home-indice" aria-label="Seções da página">
        <a href="#avd">AVD</a>
        <a href="#parte1">Parte 1</a>
        <a href="#parte2">Parte 2</a>
        <a href="#documentacao">Documentação</a>
      </nav>

      <section id="avd" className="home-secao">
        <header className="home-secao-topo">
          <p className="home-kicker">Análise e Visualização de Dados</p>
          <h2>Do dataset aos gráficos</h2>
          <p>O caminho dos dados do ICEWS, de 1995 a 2022, até as análises da Parte 2.</p>
        </header>
        <LinhaDoTempo />
      </section>

      <section id="parte1" className="home-secao">
        <header className="home-secao-topo">
          <p className="home-kicker">Teoria dos Grafos · Parte 1</p>
          <h2>Labirinto com chaves</h2>
          <p>Grafo de estados (posição, chaves e bônus) e os quatro algoritmos nos mapas do enunciado e do grupo.</p>
        </header>
        <div className="home-actions home-secao-acoes">
          <Link to="/labirintos" className="btn btn-primary">Mapas</Link>
          <Link to="/editor" className="btn">Editor</Link>
          <a href="/labirinto_interativo.html" className="btn">Simulador</a>
        </div>
        <GraficoGaleria itens={figurasParte1} pasta="/parte1" compacta />
        <ResultadosParte1 />
      </section>

      <section id="parte2" className="home-secao">
        <header className="home-secao-topo">
          <p className="home-kicker">Teoria dos Grafos · Parte 2</p>
          <h2>Grafo de países</h2>
          <p>Grafo dirigido com 250 países e 29.381 arestas, consultas entre pares e comparação dos algoritmos.</p>
        </header>
        <GraficoGaleria itens={ALGORITMOS} pasta="/parte2" compacta />
        <ResultadosParte2 />
      </section>

      <section id="documentacao" className="home-secao">
        <header className="home-secao-topo">
          <p className="home-kicker">Entrega</p>
          <h2>Documentação e links</h2>
        </header>
        <ul className="home-docs">
          {DOCUMENTOS.map((documento) => (
            <li key={documento.titulo}>
              {documento.href ? (
                <a className="home-doc" href={documento.href} target="_blank" rel="noreferrer">
                  <b>{documento.titulo}</b>
                  <span>{documento.descricao}</span>
                </a>
              ) : (
                <span className="home-doc home-doc-pendente">
                  <b>{documento.titulo}</b>
                  <span>{documento.descricao}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
