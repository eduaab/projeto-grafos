import type { CellType } from './parseMaze'

// Canvas's 2D context can't resolve CSS custom properties, so MazeThumbnail
// (the only remaining consumer — MazeGrid/MazeLegend style tiles directly in
// CSS via `.maze-cell--<type>`) needs these as plain hex. Keep in sync with
// the --tile-*/theme.css tokens and MazeGrid.css if either ever changes.
export const TILE_HEX: Record<CellType, string> = {
  wall: '#130f0a',
  floor: '#e9dcc3',
  mud: '#82633b',
  water: '#3f6b73',
  key: '#c9a44a',
  door: '#7a3b2e',
  conveyor: '#5c6b3f',
  bonus: '#3c744e',
  source: '#b96e30',
  start: '#4b733c',
  goal: '#c77a2e',
}
