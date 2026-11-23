import type { ParsedMaze } from './parseMaze'

/** Draws a letterboxed, centered mosaic of the maze into any canvas at any size. */
export function drawMazeToCanvas(canvas: HTMLCanvasElement, maze: ParsedMaze, width: number, height: number) {
  if (width === 0 || height === 0 || maze.rows === 0 || maze.cols === 0) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const scale = Math.min(width / maze.cols, height / maze.rows)
  const drawWidth = maze.cols * scale
  const drawHeight = maze.rows * scale
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2

  const theme = getComputedStyle(document.documentElement)
  const gap = Math.min(2, scale * .1)

  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      ctx.fillStyle = theme.getPropertyValue('--tile-' + maze.grid[r][c].type).trim()
      ctx.fillRect(offsetX + c * scale, offsetY + r * scale, scale - gap, scale - gap)
    }
  }
}

/** Renders a maze to a static PNG data URL once, for use as a plain <img src>. */
export function mazeThumbnailDataUrl(maze: ParsedMaze, width = 480, height = 480): string {
  const canvas = document.createElement('canvas')
  drawMazeToCanvas(canvas, maze, width, height)
  return canvas.toDataURL('image/png')
}
