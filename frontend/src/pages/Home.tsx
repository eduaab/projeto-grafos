import { Link } from 'react-router-dom'
import { ArrowIcon, KeyIcon, MapIcon, ScrollIcon } from '../components/icons'
import './Home.css'

// Contagem de mapas fixa por enquanto — a Sala de Mapas vai ler os .txt de verdade.
const CATALOGED_MAPS = 8

const SECONDARY = [
  {
    to: '/editor',
    icon: KeyIcon,
    title: 'Oficina de Campo',
    description: 'Desenhe o seu próprio labirinto numa grade interativa, peça por peça.',
  },
  {
    to: '/importar-exportar',
    icon: ScrollIcon,
    title: 'Arquivo & Transmissão',
    description: 'Importe um .txt existente ou exporte o labirinto que você desenhou.',
  },
]

export function Home() {
  return (
    <section className="home">
      <div className="home-hero">
        <h1>Dossiê de Operações do Labirinto</h1>
        <p className="home-hero-lede">
          Painel visual do projeto de Teoria dos Grafos: cada labirinto é um mapa de texto que esconde chaves,
          portas e armadilhas. Explore os mapas catalogados, desenhe os seus próprios e prepare os arquivos para
          a construção do grafo de estados.
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

      <div className="home-operations">
        <Link to="/labirintos" className="home-feature">
          <MapIcon className="home-feature-icon" />
          <div className="home-feature-body">
            <h2>Sala de Mapas</h2>
            <p>
              Veja os labirintos catalogados renderizados a partir dos arquivos <code>.txt</code>, com chaves,
              portas, esteiras e armadilhas em destaque.
            </p>
            <span className="home-feature-cta">
              Explorar os labirintos <ArrowIcon className="home-feature-arrow" />
            </span>
          </div>
        </Link>

        <div className="home-secondary">
          <h2 className="home-secondary-heading">Mais operações</h2>
          {SECONDARY.map(({ to, icon: Icon, title, description }) => (
            <Link key={to} to={to} className="home-row">
              <Icon className="home-row-icon" />
              <span className="home-row-text">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <ArrowIcon className="home-row-arrow" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
