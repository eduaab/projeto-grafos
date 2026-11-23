import { useLayoutEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import './Layout.css'

const NAV_ITEMS = [
  { to: '/', label: 'Início', end: true },
  { to: '/labirintos', label: 'Mapas' },
  { to: '/editor', label: 'Editor' },
]

export function Layout() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <>
      <header className="site-header">
        <NavLink to="/" className="brand">Projeto Grafos</NavLink>
        <nav className="site-nav" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="site-nav-link">
              {item.label}
            </NavLink>
          ))}
          <a className="site-nav-link" href="/labirinto_interativo.html">Simulador</a>
        </nav>
      </header>
      <main className="site-main"><Outlet /></main>
    </>
  )
}
