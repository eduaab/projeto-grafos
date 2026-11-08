import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { useAnimate, stagger } from 'motion/react'
import './RouteTransition.css'

// cubic-bezier(0.77, 0, 0.175, 1) — same curve as --ease-in-out in theme.css.
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1]

const TILE_DURATION = 0.24 // seconds, per tile
const COLUMN_STAGGER = 0.016 // seconds, between columns
const COVERED_PAUSE = 60 // ms, held fully covered before revealing
const ROWS = 4 // pure texture — rows never get their own delay

function getColumnCount() {
  if (typeof window === 'undefined') return 12
  return Math.min(16, Math.max(10, Math.round(window.innerWidth / 100)))
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type Phase = 'idle' | 'covering' | 'revealing'

/**
 * Full-viewport pixel curtain that plays on every route change: it covers
 * the screen, swaps the page underneath while hidden, then reveals the new
 * one. The new page never animates its own entrance — the curtain opening
 * IS the entrance, so there is only one layer of motion per navigation.
 */
export function RouteTransition() {
  const location = useLocation()
  const outlet = useOutlet()
  const [scope, animate] = useAnimate()
  const [cols] = useState(getColumnCount)
  const [reduced] = useState(prefersReducedMotion)
  const [phase, setPhase] = useState<Phase>('idle')
  const [displayed, setDisplayed] = useState<{ path: string; element: ReactElement | null }>(() => ({
    path: location.pathname,
    element: outlet,
  }))

  // Always-fresh refs so the navigation effect (deps: [pathname] only) never
  // reads a stale outlet, and so a mid-flight sequence can be told to stop.
  const outletRef = useRef(outlet)
  outletRef.current = outlet
  const runIdRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)
  // The pathname this effect last actually reacted to. Comparing against it
  // (rather than a one-shot "is this the first run" flag) is what keeps this
  // correct under StrictMode's dev-only mount→cleanup→mount replay: that
  // replay re-invokes this effect with the SAME pathname, so the comparison
  // below naturally no-ops it instead of misreading it as a real navigation.
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    const prevPath = prevPathRef.current
    prevPathRef.current = location.pathname
    if (prevPath === location.pathname) return

    // A new navigation always supersedes whatever sequence is in flight.
    runIdRef.current += 1
    const runId = runIdRef.current
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (reduced) {
      setDisplayed({ path: location.pathname, element: outletRef.current })
      setPhase('idle')
      return
    }

    let active = true
    setPhase('covering')

    // 'edges' (not 'center'): checked motion's source — {from:'center'} delays
    // by distance FROM the middle, so center columns move first and edges
    // last (a ripple outward). 'edges' delays by distance to the NEAREST
    // edge instead, so the two edge columns move first and the center last —
    // that's the actual "stage curtain closing toward the middle" image.
    const columnDelay = stagger(COLUMN_STAGGER, { from: 'edges' })
    const runColumns = (scaleY: number) =>
      Promise.all(
        Array.from({ length: cols }, (_, c) =>
          animate(
            `.curtain-col-${c} .curtain-tile`,
            { scaleY },
            { duration: TILE_DURATION, ease: EASE_IN_OUT, delay: columnDelay(c, cols) },
          ),
        ),
      )

    const run = async () => {
      await runColumns(1)
      if (!active || runIdRef.current !== runId) return

      setDisplayed({ path: location.pathname, element: outletRef.current })

      await new Promise<void>((resolve) => {
        timeoutRef.current = window.setTimeout(resolve, COVERED_PAUSE)
      })
      if (!active || runIdRef.current !== runId) return

      setPhase('revealing')
      await runColumns(0)
      if (!active || runIdRef.current !== runId) return
      setPhase('idle')
    }

    // If this run gets superseded mid-flight, the next effect's animate()
    // calls retarget the same tiles, which cancels these animations —
    // motion's grouped `.finished` promise then rejects even though the
    // `active` guards above already make that case a no-op. Swallow it here
    // so an interrupted navigation never surfaces as an unhandled rejection.
    run().catch(() => {})

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <>
      <main
        className={'site-main' + (reduced ? ' site-main--fade' : '')}
        key={reduced ? displayed.path : undefined}
      >
        {displayed.element}
      </main>

      {!reduced && (
        <div className="route-curtain" data-phase={phase} ref={scope} aria-hidden="true">
          {Array.from({ length: cols }, (_, c) => (
            <div className={`curtain-col curtain-col-${c}`} key={c}>
              {Array.from({ length: ROWS }, (_, r) => (
                <div className="curtain-tile" key={r} />
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
