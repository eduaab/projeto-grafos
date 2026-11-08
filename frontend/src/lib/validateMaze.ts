// The blocking rules mirror frontend/scripts/sync-mapas.mjs
// (validateAndAnalyze) exactly — keep the two in sync if either changes.
// That script is the real gate (it decides what the Sala de Mapas ever
// shows); this just previews the same verdict live while editing, plus a
// few non-blocking warnings sync-mapas.mjs doesn't check at all.

export type MazeValidation = {
  valid: boolean
  issues: string[]
  warnings: string[]
  counts: {
    keys: string[]
    doors: string[]
    hasConveyors: boolean
    hasBonus: boolean
    hasSource: boolean
  }
}

export function validateGrid(grid: string[][]): MazeValidation {
  const issues: string[] = []
  const warnings: string[] = []
  const keysFound = new Set<string>()
  const doorsFound = new Set<string>()
  let startCount = 0
  let goalCount = 0
  let hasConveyors = false
  let hasBonus = false
  let hasSource = false

  for (const row of grid) {
    for (const ch of row) {
      if (ch === 'S') startCount++
      else if (ch === 'G') goalCount++
      else if (ch >= 'a' && ch <= 'd') keysFound.add(ch)
      else if (ch >= 'A' && ch <= 'D') doorsFound.add(ch)
      else if (ch === '>' || ch === '<' || ch === '^' || ch === 'v') hasConveyors = true
      else if (ch === '+') hasBonus = true
      else if (ch === '*') hasSource = true
    }
  }

  // Blocking — same two checks sync-mapas.mjs enforces (plus the shape of
  // the grid, which the editor guarantees by construction: every row is
  // already the same length, so there's nothing to check there).
  if (startCount === 0) issues.push('Falta um início (S).')
  if (startCount > 1) issues.push(`Tem ${startCount} inícios (S) — só pode ter um.`)
  if (goalCount === 0) issues.push('Falta pelo menos uma saída (G).')

  // Non-blocking — a key/door without its pair is still a syntactically
  // valid map (sync-mapas.mjs would accept it), just probably not what you
  // meant to draw.
  for (const key of keysFound) {
    const door = key.toUpperCase()
    if (!doorsFound.has(door)) warnings.push(`Chave "${key}" não tem a porta "${door}" correspondente.`)
  }
  for (const door of doorsFound) {
    const key = door.toLowerCase()
    if (!keysFound.has(key)) warnings.push(`Porta "${door}" não tem a chave "${key}" correspondente.`)
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    counts: {
      keys: Array.from(keysFound).sort(),
      doors: Array.from(doorsFound).sort(),
      hasConveyors,
      hasBonus,
      hasSource,
    },
  }
}
