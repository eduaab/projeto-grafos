// Pure lexical extraction: character -> tile type, for drawing only. This is
// NOT the project's state graph — no cost, no reachability, no algorithms.

export type CellType =
  | 'wall'
  | 'floor'
  | 'mud'
  | 'water'
  | 'start'
  | 'goal'
  | 'key'
  | 'door'
  | 'conveyor'
  | 'bonus'
  | 'source'

export type Direction = 'N' | 'E' | 'S' | 'W'

export type Cell = {
  type: CellType
  char: string
  direction?: Direction
}

export type ParsedMaze = {
  rows: number
  cols: number
  grid: Cell[][]
}

const CONVEYOR_DIRECTION: Record<string, Direction> = {
  '^': 'N',
  '>': 'E',
  v: 'S',
  '<': 'W',
}

function cellFromChar(char: string): Cell {
  if (char === '#') return { type: 'wall', char }
  if (char === '.') return { type: 'floor', char }
  if (char === ',') return { type: 'mud', char }
  if (char === '~') return { type: 'water', char }
  if (char === 'S') return { type: 'start', char }
  if (char === 'G') return { type: 'goal', char }
  if (char === '+') return { type: 'bonus', char }
  if (char === '*') return { type: 'source', char }
  if (char in CONVEYOR_DIRECTION) return { type: 'conveyor', char, direction: CONVEYOR_DIRECTION[char] }
  if (char >= 'a' && char <= 'd') return { type: 'key', char }
  if (char >= 'A' && char <= 'D') return { type: 'door', char }
  // Stray whitespace or anything unexpected renders as plain floor rather
  // than throwing — this is a renderer, not a validator (sync-mapas.mjs
  // already rejected invalid files before they reach the browser).
  return { type: 'floor', char }
}

export function parseMaze(text: string): ParsedMaze {
  const lines = text.split(/\r\n|\r|\n/).filter((line) => !line.startsWith(';') && line.length > 0)
  const cols = lines.length > 0 ? lines[0].length : 0
  const grid = lines.map((line) => Array.from(line).map(cellFromChar))

  return { rows: grid.length, cols, grid }
}
