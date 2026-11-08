import { Link } from 'react-router-dom'
import { ArrowIcon, KeyIcon, MapIcon, ScrollIcon } from '../components/icons'
import './Home.css'

// Contagem de mapas fixa por enquanto — a Sala de Mapas vai ler os .txt de verdade.
const CATALOGED_MAPS = 8

const SECTIONS = [
  {
    to: '/labirintos',
    icon: MapIcon,
    title: 'Sala de Mapas',
    description:
      'Veja os labirintos catalogados renderizados a partir dos arquivos .txt, com chaves, portas, esteiras e armadilhas em destaque.',
  },
  {
    to: '/editor',
    icon: KeyIcon,
    title: 'Oficina de Campo',
    description:
      'Desenhe o seu próprio labirinto numa grade interativa — posicione paredes, chaves, portas e armadilhas peça por peça.',
  },
  {
    to: '/importar-exportar',
    icon: ScrollIcon,
    title: 'Arquivo & Transmissão',
    description: 'Importe um .txt existente para revisão ou exporte o labirinto que você desenhou para usar no projeto.',
  },
]

export function Home() {
  return (
    <section className="home">
      <div className="home-hero">
        <span className="eyebrow">Operação · Labirinto</span>
        <h1>Dossiê de Operações do Labirinto</h1>
        <p className="home-hero-lede">
          Painel visual do projeto de Teoria dos Grafos: cada labirinto é um mapa de texto que esconde chaves, portas e
          armadilhas. Aqui você explora os mapas catalogados, desenha os seus próprios e prepara os arquivos
          para a parte séria do projeto — a construção do grafo de estados.
        </p>

        <dl className="home-stats">
          <div className="home-stat">
            <dt>Mapas catalogados</dt>
            <dd>{CATALOGED_MAPS}</dd>
          </div>
          <div className="home-stat">
            <dt>Formato</dt>
            <dd>.txt</dd>
          </div>
          <div className="home-stat">
            <dt>Modelo</dt>
            <dd>Grafo de estados</dd>
          </div>
        </dl>
      </div>

      <div className="home-sections">
        {SECTIONS.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to} className="home-card">
            <Icon className="home-card-icon" />
            <h2>{title}</h2>
            <p>{description}</p>
            <span className="home-card-cta">
              Acessar <ArrowIcon className="home-card-arrow" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
