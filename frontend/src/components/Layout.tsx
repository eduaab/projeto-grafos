import { NavLink } from 'react-router-dom'
import { SealIcon } from './icons'
import { RouteTransition } from './RouteTransition'
import './Layout.css'

const NAV_ITEMS = [
  { to: '/', label: 'Base', end: true },
  { to: '/labirintos', label: 'Sala de Mapas' },
  { to: '/editor', label: 'Oficina de Campo' },
  { to: '/importar-exportar', label: 'Arquivo' },
]

export function Layout() {
  return (
    <>
      <header className="site-header">
        <NavLink to="/" className="brand">
          <SealIcon className="brand-seal" />
          <span className="brand-text">
            <strong>Projeto Grafos</strong>
            <span className="brand-subtitle">Dossiê de Operações — Labirintos</span>
          </span>
        </NavLink>

        <nav className="site-nav" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'site-nav-link' + (isActive ? ' is-active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* header/nav/footer never animate or remount; RouteTransition owns the
          curtain + the swap of whatever page is currently displayed */}
      <RouteTransition />

      <footer className="site-footer">
        <span>Teoria dos Grafos · 2026.2</span>
        <span className="footer-stamp">Uso acadêmico</span>
      </footer>
    </>
  )
}
