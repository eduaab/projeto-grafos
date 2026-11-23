// Copies validated maze .txt files from data/mapas and data/mapas_grupo (repo
// root, outside frontend/) into frontend/public/mapas, and writes a manifest
// the frontend reads at build time. Runs on plain Node (no dependencies) via
// the predev/prebuild npm hooks, so the gallery never reads stale data.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = join(__dirname, '..')
const REPO_ROOT = join(FRONTEND_ROOT, '..')

const SOURCE_DIRS = [
  { dir: join(REPO_ROOT, 'data', 'mapas'), group: 'oficial' },
  { dir: join(REPO_ROOT, 'data', 'mapas_grupo'), group: 'grupo' },
  { dir: join(REPO_ROOT, 'data', 'mapas_criados'), group: 'criado' },
]

const PUBLIC_MAPAS_DIR = join(FRONTEND_ROOT, 'public', 'mapas')
const MANIFEST_PATH = join(FRONTEND_ROOT, 'src', 'data', 'mapas.manifest.json')

// '#.,~SGa-dA-D><^v+*' plus space — trailing/blank lines are filtered out
// before this check ever runs, so a lone blank line never fails validation.
const VALID_CHARS = new Set([
  '#', '.', ',', '~', 'S', 'G',
  'a', 'b', 'c', 'd', 'A', 'B', 'C', 'D',
  '>', '<', '^', 'v',
  '+', '*',
  ' ',
])

function splitLines(text) {
  return text.split(/\r\n|\r|\n/)
}

function validateAndAnalyze(text) {
  const rows = splitLines(text).filter((line) => !line.startsWith(';') && line.length > 0)

  if (rows.length === 0) {
    return { valid: false, reason: 'arquivo vazio ou sem linhas de grade' }
  }

  const cols = rows[0].length
  for (const row of rows) {
    if (row.length !== cols) {
      return {
        valid: false,
        reason: `linhas com largura inconsistente (esperado ${cols}, achou ${row.length})`,
      }
    }
  }

  let startCount = 0
  let goalCount = 0
  const keysFound = new Set()
  const doorsFound = new Set()
  let hasConveyors = false
  let hasBonus = false
  let hasSource = false

  for (const row of rows) {
    for (const ch of row) {
      if (!VALID_CHARS.has(ch)) {
        return { valid: false, reason: `caractere inválido "${ch}"` }
      }
      if (ch === 'S') startCount++
      else if (ch === 'G') goalCount++
      else if (ch >= 'a' && ch <= 'd') keysFound.add(ch)
      else if (ch >= 'A' && ch <= 'D') doorsFound.add(ch)
      else if (ch === '>' || ch === '<' || ch === '^' || ch === 'v') hasConveyors = true
      else if (ch === '+') hasBonus = true
      else if (ch === '*') hasSource = true
    }
  }

  if (startCount !== 1) {
    return { valid: false, reason: `esperado exatamente um "S", encontrado ${startCount}` }
  }
  if (goalCount < 1) {
    return { valid: false, reason: 'nenhum "G" encontrado' }
  }

  return {
    valid: true,
    rows: rows.length,
    cols,
    keys: keysFound.size,
    doors: doorsFound.size,
    hasConveyors,
    hasBonus,
    hasSource,
  }
}

function titleCaseWords(raw) {
  return raw
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function prettifyTitle(id) {
  const match = id.match(/^(m\d+)_(.+)$/i)
  if (match) {
    const [, prefix, rest] = match
    return `${prefix.toUpperCase()} · ${titleCaseWords(rest)}`
  }
  return titleCaseWords(id)
}

export function syncMapas() {
  mkdirSync(PUBLIC_MAPAS_DIR, { recursive: true })
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true })

  const manifest = []

  for (const { dir, group } of SOURCE_DIRS) {
    if (!existsSync(dir)) continue

    const filenames = readdirSync(dir).filter((name) => name.toLowerCase().endsWith('.txt'))
    for (const filename of filenames) {
      const text = readFileSync(join(dir, filename), 'utf8')
      const result = validateAndAnalyze(text)

      if (!result.valid) {
        console.warn(`[sync-mapas] pulando ${group}/${filename}: ${result.reason}`)
        continue
      }

      const id = filename.replace(/\.txt$/i, '')
      writeFileSync(join(PUBLIC_MAPAS_DIR, filename), text, 'utf8')

      manifest.push({
        id,
        filename,
        group,
        rows: result.rows,
        cols: result.cols,
        title: prettifyTitle(id),
        keys: result.keys,
        doors: result.doors,
        hasConveyors: result.hasConveyors,
        hasBonus: result.hasBonus,
        hasSource: result.hasSource,
      })
    }
  }

  manifest.sort((a, b) => a.id.localeCompare(b.id))
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  console.log(`[sync-mapas] ${manifest.length} mapa(s) sincronizado(s) -> ${MANIFEST_PATH}`)
  return manifest
}

// The simulator is a standalone page. Rebuild it during frontend startup
// so the Python-generated report and the site may each have their own layout.
function syncSimulator() {
  const resultsPath = join(REPO_ROOT, 'out', 'parte1', 'dados_interativos.json')
  const themePath = join(FRONTEND_ROOT, 'src', 'styles', 'theme.css')
  const pagePath = join(FRONTEND_ROOT, 'public', 'labirinto_interativo.html')

  const results = JSON.parse(readFileSync(resultsPath, 'utf8'))
  const payload = JSON.stringify(results).replaceAll('</', '<\\\\/')
  const theme = readFileSync(themePath, 'utf8').trim()
  const html = SIMULATOR_HTML
    .replace('__SIMULATOR_THEME__', () => theme)
    .replace('__SIMULATOR_DATA__', () => payload)

  if (!existsSync(pagePath) || readFileSync(pagePath, 'utf8').replace(/\\r\\n/g, '\\n') !== html) {
    writeFileSync(pagePath, html, 'utf8')
  }
}

const SIMULATOR_HTML = String.raw`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Simulador · Projeto Grafos</title>
  <style>
__SIMULATOR_THEME__

:root {
  --sim-space-1: 4px;
  --sim-space-2: 8px;
  --sim-space-3: 12px;
  --sim-space-4: 16px;
  --sim-radius: 8px;
  --sim-control-size: 40px;
  --sim-legend-tile-size: 22px;
  --sim-transition: 160ms var(--ease-out);
  --sim-field-top: #fffaf4;
  --sim-trap: #a34c39;
  --sim-current: oklch(from var(--accent) l calc(c * 1.65) h);
  --sim-trace-0: oklch(from var(--accent-hover) l calc(c * .55) h);
  --sim-trace-1: #8a6344;
  --sim-trace-2: #547779;
  --sim-trace-3: #986655;
  --sim-trace-4: #5e6584;
  --sim-shadow: color-mix(in srgb, var(--ink) 8%, transparent);
  --sim-row-hover: color-mix(in srgb, var(--ink) 5%, transparent);
  --sim-muted: color-mix(in srgb, var(--ink) 68%, var(--surface));
}
.simulator { --sim-gutter: clamp(20px, 2vw, 36px); padding: var(--sim-gutter); }
.sim-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(350px, 29vw, 540px);
  gap: clamp(24px, 2.5vw, 48px);
}
.sim-visual {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  min-height: max(540px, calc(100dvh - var(--site-header-height) - 2 * var(--sim-gutter)));
  border: 1px solid var(--surface-border);
  border-radius: var(--radius);
  background: var(--bg-raised);
}
.sim-tools { display: flex; align-items: center; flex-wrap: wrap; gap: var(--sim-space-2); }
.sim-tools { padding: 8px; border-bottom: 1px solid var(--surface-border); }
.sim-tools .btn { min-height: var(--sim-control-size); padding: var(--sim-space-1) var(--sim-space-2); font-size: .875rem; }
.sim-tools .btn[aria-label] { min-width: var(--sim-control-size); font-size: 1rem; }
#hand { margin-right: auto; }
#hand svg { width: 18px; height: 18px; }
#zoomText { min-width: 4ch; color: var(--ink-muted); font-size: .875rem; text-align: center; font-variant-numeric: tabular-nums; }
.sim-viewport { min-height: 0; contain: size; overflow: auto; scrollbar-width: none; }
.sim-viewport::-webkit-scrollbar { display: none; }
.sim-viewport[data-hand] { cursor: grab; user-select: none; touch-action: none; }
.sim-viewport[data-dragging] { cursor: grabbing; }
.sim-canvas { display: grid; place-items: center; width: max-content; min-width: 100%; min-height: 100%; padding: 8px; }
.board { display: grid; gap: var(--tile-gap); width: max-content; }
.tile {
  position: relative;
  width: var(--size);
  height: var(--size);
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: var(--tile-floor);
  color: var(--tile-ink);
  font-size: min(calc(var(--size) * .55), 28px);
  font-weight: 700;
  line-height: 1;
}
.wall { background: var(--tile-wall); }
.mud { background: var(--tile-mud); }
.water { background: var(--tile-water); }
.key { background: var(--tile-key); }
.door { background: var(--tile-door); }
.start { background: var(--tile-start); }
.goal { background: var(--tile-goal); }
.belt { background: var(--tile-conveyor); }
.bonus { background: var(--tile-bonus); }
.source { background: var(--tile-source); }

#board .trail { outline: 2px solid var(--trail); outline-offset: -2px; }
#board .current { box-shadow: inset 0 0 0 4px var(--sim-current, var(--accent)); outline: 0; }
.trap { background: var(--sim-trap); color: var(--on-accent); }
.dim { opacity: .3; }
.sim-viewport[data-hand] .tile { cursor: inherit; }
.simulator :is(.btn, .field, .sim-check input, .sim-piece-list li) {
  transition: background-color var(--sim-transition), border-color var(--sim-transition),
    color var(--sim-transition), box-shadow var(--sim-transition);
}
.simulator .btn:disabled { opacity: 1; }
.simulator .btn:focus-visible, .simulator select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.sim-playback { padding: var(--sim-space-3) var(--sim-space-2); border-top: 1px solid var(--surface-border); }
.sim-playback-inner {
  display: grid;
  grid-template-columns: minmax(136px, 1fr) auto;
  align-items: center;
  gap: var(--sim-space-4);
  width: min(100%, max(500px, var(--board-width, 100%)));
  margin-inline: auto;
}
.sim-playback h2 { font-size: .95rem; }
.sim-buttons, .sim-step-buttons { display: flex; gap: var(--sim-space-2); }
.sim-step-buttons { padding-left: var(--sim-space-2); border-left: 1px solid var(--surface-border); }
.sim-buttons .btn { min-height: var(--sim-control-size); padding: var(--sim-space-1) var(--sim-space-3); font-size: .875rem; }
#stepText { color: var(--accent); font-size: .875rem; font-weight: 650; }
#stepProgress { display: block; width: 100%; height: 8px; margin-top: var(--sim-space-1); accent-color: var(--accent); }
#stepProgress[hidden] { display: none; }

.sim-sidebar {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: var(--sim-space-3);
}
.sim-panel {
  flex: none;
  min-width: 0;
  padding: var(--sim-space-3);
  border: 1px solid var(--surface-border);
  border-radius: var(--sim-radius);
  background: var(--surface);
  box-shadow: 0 2px 8px var(--sim-shadow);
}
.sim-panel-title {
  display: flex;
  align-items: center;
  gap: var(--sim-space-2);
  font-size: 1.0625rem;
  font-weight: 650;
  line-height: 1.25;
}
.sim-panel-title::before { content: ""; width: 3px; height: 1em; border-radius: 2px; background: var(--accent); }
.sim-panel > .sim-panel-title, .sim-result-header { margin-bottom: var(--sim-space-2); }

.sim-selectors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sim-space-2); }
.sim-selectors label {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: var(--sim-space-1);
  color: var(--ink-muted);
  font-size: .875rem;
  line-height: 1.25;
}
.sim-selectors > label:not(.sim-check) { position: relative; }
.sim-selectors > label:not(.sim-check)::after {
  content: "";
  position: absolute;
  right: 12px;
  bottom: 17px;
  width: 7px;
  height: 7px;
  border-right: 2px solid var(--accent);
  border-bottom: 2px solid var(--accent);
  transform: rotate(45deg);
  pointer-events: none;
}
.sim-sidebar select.field {
  appearance: none;
  width: 100%;
  min-width: 0;
  min-height: var(--sim-control-size);
  padding: var(--sim-space-1) 28px var(--sim-space-1) var(--sim-space-3);
  border-color: var(--surface-border-strong);
  background: linear-gradient(var(--sim-field-top), var(--surface));
  color: var(--ink);
  font-weight: 650;
  text-overflow: ellipsis;
}
.sim-sidebar select.field:hover { border-color: var(--accent); background: var(--surface-hover); }
.sim-sidebar select.field:disabled { background: var(--surface-disabled); cursor: not-allowed; }
.sim-selectors .sim-check {
  display: flex;
  grid-column: 1 / -1;
  align-items: flex-start;
  gap: var(--sim-space-2);
  padding: var(--sim-space-1) var(--sim-space-2);
  border-radius: var(--sim-radius);
  background: var(--bg-raised);
  cursor: pointer;
}
.sim-check-label { display: block; color: var(--ink); font-weight: 600; }
.sim-check-help { display: block; margin-top: var(--sim-space-1); font-size: .8125rem; color: var(--ink-muted); }
.sim-sidebar .sim-check input {
  appearance: none;
  width: 18px;
  height: 18px;
  flex: none;
  display: grid;
  place-items: center;
  margin: 0;
  border: 2px solid var(--sim-muted);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
}
.sim-sidebar .sim-check input:checked { border-color: var(--accent); background: var(--accent); }
.sim-sidebar .sim-check input:checked::after {
  content: "";
  width: 5px;
  height: 9px;
  border: solid var(--on-accent);
  border-width: 0 2px 2px 0;
  transform: translateY(-1px) rotate(45deg);
}
.sim-sidebar .notice { padding: var(--sim-space-2); font-size: .875rem; }

.sim-panel.sim-legend { display: flex; flex: 0 1 auto; flex-direction: column; min-height: 188px; }
.sim-piece-list { min-height: 0; overflow: auto; list-style: none; margin: 0; padding: 0; }
.sim-piece-row {
  display: grid;
  grid-template-columns: var(--sim-legend-tile-size) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--sim-space-2);
  padding: 2px var(--sim-space-1);
  border-radius: 4px;
  color: var(--ink-muted);
  font-size: .875rem;
}
.sim-piece-list li:hover { background: var(--sim-row-hover); }
.sim-piece-list .tile { --size: var(--sim-legend-tile-size); border-radius: 4px; font-size: .8125rem; }
.sim-piece-list .wall { color: var(--tile-floor); }
.sim-piece-head { color: var(--ink-muted); font-weight: 650; font-size: .75rem; border-bottom: 1px solid var(--surface-border); border-radius: 0; }
.sim-piece-values { display: grid; grid-template-columns: 28px 84px; gap: var(--sim-space-2); text-align: right; font-variant-numeric: tabular-nums; font-size: .8125rem; }
.sim-piece-values > :first-child { font-weight: 650; color: var(--ink); }
.sim-piece-head .sim-piece-values > :first-child, .sim-piece-cost.is-empty { color: var(--sim-muted); }

.sim-trace { display: grid; flex: none; gap: var(--sim-space-1); margin-top: var(--sim-space-2); padding: var(--sim-space-2) var(--sim-space-1) 0; border-top: 1px solid var(--surface-border); }
.sim-trace-item { display: flex; align-items: center; gap: var(--sim-space-2); color: var(--ink); font-weight: 600; font-size: .875rem; }
.sim-trace-item[hidden] { display: none; }
.sim-trace-swatch { width: var(--sim-legend-tile-size); height: var(--sim-legend-tile-size); border: 2px solid transparent; border-radius: 4px; background: var(--tile-floor); }
.sim-trace-swatch.is-current { border-color: var(--sim-current, var(--accent)); }
.sim-trace-swatch.is-visited { border-color: var(--sim-trace-0); }
.sim-trace-swatch.trap { background: var(--sim-trap); }

.sim-result { flex-shrink: 0; }
.sim-result-header { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sim-space-1) var(--sim-space-2); }
.sim-status { display: inline-flex; align-items: center; gap: var(--sim-space-2); padding: var(--sim-space-1) var(--sim-space-2); border-radius: 999px; background: var(--accent-soft); color: var(--success); font-size: .875rem; font-weight: 650; line-height: 1.3; }
.sim-status::before { content: ""; width: 8px; height: 8px; flex: none; border-radius: 50%; background: var(--accent); }
.sim-status[data-tone="warning"] { background: var(--warning-bg); color: var(--warning); }
.sim-status[data-tone="warning"]::before { background: var(--warning); }
.sim-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sim-space-2); margin: var(--sim-space-2) 0; }
.sim-metrics > div, .sim-state-values > div { padding: var(--sim-space-2) var(--sim-space-1); border-radius: var(--sim-radius); background: var(--bg-raised); }
.sim-metrics dd { margin: var(--sim-space-1) 0 0; font-size: 1.5rem; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.sim-metrics dt, .sim-state dt { color: var(--ink-muted); font-size: .8125rem; line-height: 1.25; }
.sim-state h3 { font-size: .875rem; font-weight: 650; }
.sim-state-values { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sim-space-2); margin: var(--sim-space-2) 0 0; }
.sim-state-values > div { padding-inline: var(--sim-space-2); border: 1px solid var(--surface-border); }
.sim-state-values dd { margin: var(--sim-space-1) 0 0; font-size: .875rem; line-height: 1.25; font-weight: 650; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }

@media (max-width: 900px) {
  .simulator { --sim-gutter: 12px; }
  .sim-body { grid-template-columns: minmax(0, 1fr); gap: var(--sim-space-3); }
  .sim-visual { min-height: 0; grid-template-rows: auto clamp(240px, 50dvh, 420px) auto; }
}
@media (min-width: 901px) {
  .sim-panel.sim-legend { flex-grow: 1; contain: size; }
}
@media (min-width: 901px) and (max-height: 820px) {
  .sim-sidebar { gap: var(--sim-space-2); }
  .sim-panel { padding: var(--sim-space-2); }
  .sim-check-help {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .sim-metrics > div, .sim-state-values > div { padding: var(--sim-space-1); }
}
@media (max-width: 600px) {
  .site-header { justify-content: center; flex-wrap: wrap; gap: var(--sim-space-1) var(--sim-space-2); padding-inline: var(--sim-space-3); }
  .site-nav { width: 100%; justify-content: space-between; flex-wrap: wrap; gap: var(--sim-space-2); font-size: .875rem; }
  .sim-playback-inner { width: 100%; grid-template-columns: minmax(0, 1fr); gap: var(--sim-space-2); }
  .sim-buttons { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sim-step-buttons { display: grid; grid-column: 1 / -1; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 0; border: 0; }
}
@media (max-width: 400px) {
  .sim-selectors { grid-template-columns: minmax(0, 1fr); }
  .sim-state-values { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (prefers-reduced-motion: reduce) {
  .simulator :is(.btn, .field, .sim-check input, .sim-piece-list li) { transition: none; }
}

  </style>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/">Projeto Grafos</a>
    <nav class="site-nav" aria-label="Navegação principal">
      <a class="site-nav-link" href="/">Início</a>
      <a class="site-nav-link" href="/labirintos">Mapas</a>
      <a class="site-nav-link" href="/editor">Editor</a>
      <a class="site-nav-link" href="/labirinto_interativo.html" aria-current="page">Simulador</a>
    </nav>
  </header>
  <main class="simulator">
    <h1 class="visually-hidden">Simulador</h1>
    <div class="sim-body">
      <section class="sim-visual" aria-label="Percurso do labirinto">
        <div class="sim-tools" role="group" aria-label="Controles da área do labirinto">
          <button class="btn" id="hand" type="button" aria-label="Mão" aria-pressed="false" title="Arrastar para mover o mapa">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11 M11 6.5v-2a1.5 1.5 0 0 1 3 0V11 M14 6a1.5 1.5 0 0 1 3 0v6 M17 8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.2-1.7l-4.4-4.4a1.5 1.5 0 0 1 2.1-2.1L8 14"/>
            </svg>
          </button>
          <button class="btn" id="zoomOut" type="button" aria-label="Afastar">−</button>
          <output id="zoomText">100%</output>
          <button class="btn" id="zoomIn" type="button" aria-label="Aproximar">+</button>
          <button class="btn" id="fit" type="button">Ajustar à área</button>
        </div>
        <div class="sim-viewport" id="viewport" role="region" aria-label="Área do labirinto" tabindex="0">
          <div class="sim-canvas"><div id="board" class="board" role="img" aria-label="Grade do labirinto"></div></div>
        </div>
        <section class="sim-playback" aria-labelledby="playbackTitle">
          <div class="sim-playback-inner">
            <div>
              <h2 id="playbackTitle">Reprodução</h2>
              <p id="stepText"></p>
              <progress id="stepProgress" aria-label="Progresso do percurso" max="1" value="0"></progress>
            </div>
            <div class="sim-buttons">
              <button class="btn btn-primary" id="play" type="button">Iniciar</button>
              <button class="btn" id="restart" type="button">Reiniciar</button>
              <div class="sim-step-buttons" role="group" aria-label="Navegar pelos passos">
                <button class="btn" id="back" type="button">Anterior</button>
                <button class="btn" id="next" type="button">Próximo</button>
              </div>
            </div>
          </div>
        </section>
      </section>

      <aside class="sim-sidebar" aria-label="Controles e resultados">
        <section class="sim-panel" aria-labelledby="runTitle">
          <h2 class="sim-panel-title" id="runTitle">Configuração</h2>
          <p class="notice notice-error" id="loadError" role="alert" hidden></p>
          <div class="sim-selectors">
            <label>Mapa<select class="field" id="mapSelect"></select></label>
            <label>Algoritmo
              <select class="field" id="algSelect">
                <option>BFS</option><option>DFS</option>
                <option value="DIJKSTRA">Dijkstra</option>
                <option value="BELLMAN_FORD">Bellman-Ford</option>
              </select>
            </label>
            <label>Velocidade da animação<select class="field" id="speed"></select></label>
            <label>Camada de chaves
              <select class="field" id="layerSelect"><option value="all">Todas</option></select>
            </label>
            <label class="sim-check" title="Mostra posições sem saída em certos estados.">
              <input id="traps" type="checkbox" aria-labelledby="trapLabel" aria-describedby="trapHelp">
              <span>
                <span class="sim-check-label" id="trapLabel">Mostrar estados-armadilha</span>
                <span class="sim-check-help" id="trapHelp">Mostra posições sem saída em certos estados.</span>
              </span>
            </label>
          </div>
        </section>

        <section class="sim-panel sim-legend" aria-labelledby="legendTitle">
          <h2 class="sim-panel-title" id="legendTitle">Peças deste mapa</h2>
          <div class="sim-piece-row sim-piece-head" aria-hidden="true">
            <span></span><span>Peça</span><span class="sim-piece-values"><span>Qtd.</span><span>Custo</span></span>
          </div>
          <ul class="sim-piece-list" id="pieceLegend" tabindex="0" aria-label="Peças, quantidades e custos"></ul>
          <div class="sim-trace">
            <span class="sim-trace-item"><span class="sim-trace-swatch is-visited" aria-hidden="true"></span>Percorridas</span>
            <span class="sim-trace-item"><span class="sim-trace-swatch is-current" aria-hidden="true"></span>Atual</span>
            <span class="sim-trace-item" id="trapLegend" hidden><span class="sim-trace-swatch trap" aria-hidden="true"></span>Armadilha</span>
          </div>
        </section>

        <section class="sim-panel sim-result" aria-labelledby="resultTitle">
          <div class="sim-result-header">
            <h2 class="sim-panel-title" id="resultTitle">Resultado</h2>
            <p id="resultStatus" class="sim-status" role="status" aria-live="polite" aria-atomic="true"></p>
          </div>
          <p id="selectionFeedback" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></p>
          <dl class="sim-metrics">
            <div><dt>Total de passos</dt><dd id="totalSteps">—</dd></div>
            <div><dt>Custo final</dt><dd id="finalCost">—</dd></div>
            <div><dt>Custo acumulado</dt><dd id="runningCost">—</dd></div>
          </dl>
          <div class="sim-state">
            <h3>Estado atual</h3>
            <dl class="sim-state-values">
              <div><dt>Linha</dt><dd id="position">—</dd></div>
              <div><dt>Coluna</dt><dd id="columnPosition">—</dd></div>
              <div><dt>Chaves</dt><dd id="keys">—</dd></div>
              <div><dt>Bônus</dt><dd id="bonus">—</dd></div>
            </dl>
          </div>
        </section>

      </aside>
    </div>

  </main>
<script>
const DATA=__SIMULATOR_DATA__;
const DEFAULT_MAP=null;
</script>
<script>
const byId = (id) => document.getElementById(id);
const mapSelect = byId('mapSelect');
const algSelect = byId('algSelect');
const board = byId('board');
const viewport = byId('viewport');
const hand = byId('hand');
const zoomIn = byId('zoomIn');
const zoomOut = byId('zoomOut');
const fit = byId('fit');
const zoomText = byId('zoomText');
const playback = document.querySelector('.sim-playback-inner');
const speed = byId('speed');
const layerSelect = byId('layerSelect');
const traps = byId('traps');
const play = byId('play');
const back = byId('back');
const next = byId('next');
const CELL_SIZE = 42;
const CELL_GAP = 2;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 1.25;
const originalMaps = new Map(Object.entries(DATA));
const maps = new Map(originalMaps);
const tileTypes = {
  '#': 'wall', '.': 'floor', ' ': 'floor', ',': 'mud', '~': 'water', S: 'start', G: 'goal',
  a: 'key', b: 'key', c: 'key', d: 'key', A: 'door', B: 'door', C: 'door', D: 'door',
  '^': 'belt', '>': 'belt', v: 'belt', '<': 'belt', '+': 'bonus', '*': 'source',
};
const legendPieces = [
  ['#', 'Parede', '—'], ['.', 'Chão'], ['S', 'Início'], ['G', 'Saída'],
  ['a', 'Chave a'], ['b', 'Chave b'], ['c', 'Chave c'], ['d', 'Chave d'],
  ['A', 'Porta A'], ['B', 'Porta B'], ['C', 'Porta C'], ['D', 'Porta D'],
  [',', 'Lama', '3'], ['~', 'Água', '5'],
  ['>', 'Esteira →'], ['<', 'Esteira ←'], ['^', 'Esteira ↑'], ['v', 'Esteira ↓'],
  ['+', 'Bônus', '−4, depois 1'], ['*', 'Fonte', '−2 sempre'],
];
const officialNames = ['Terreno', 'Uma chave', 'Três chaves', 'Esteiras', 'Bônus', 'Fonte', 'Impossível', 'Grande'];
const trailColors = ['var(--sim-trace-0)', 'var(--sim-trace-1)', 'var(--sim-trace-2)', 'var(--sim-trace-3)', 'var(--sim-trace-4)'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const resultLabels = {
  OK: 'Solução encontrada',
  SEM_SOLUCAO: 'Sem solução',
  RECUSA: 'Dijkstra não pode executar com pesos negativos.',
  CICLO_NEGATIVO: 'Ciclo negativo detectado',
  SEM_RESULTADOS: 'Este mapa ainda não tem resultados calculados.',
};
let grid = [];
let step = 0;
let timer = null;
let manualZoom = null;
let panDrag = null;

function mapLabel(id) {
  const official = /^m(0[1-8])_/.exec(id);
  if (official) return 'M' + official[1] + ' — ' + officialNames[Number(official[1]) - 1];
  return id.replaceAll('_', ' ').replace(/^./u, (letter) => letter.toUpperCase());
}

function originalMap() {
  return maps.get(mapSelect.value);
}

function resultForMap() {
  return originalMap()?.algoritmos?.[algSelect.value] ?? { status: 'SEM_RESULTADOS', caminho: [] };
}

function stop() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  play.textContent = 'Iniciar';
}

function setGridSize(element, cols, size, gap) {
  element.style.setProperty('--size', size + 'px');
  element.style.gap = gap + 'px';
  element.style.gridTemplateColumns = 'repeat(' + cols + ', var(--size))';
}

function fitZoom() {
  const cols = grid[0]?.length ?? 0;
  if (!cols) return 1;
  // The canvas has 8px of padding on each side. Leave 1px for subpixel rounding.
  return Math.min(
    MAX_ZOOM,
    Math.max(1, viewport.clientWidth - 17) / (cols * (CELL_SIZE + CELL_GAP) - CELL_GAP),
    Math.max(1, viewport.clientHeight - 17) / (grid.length * (CELL_SIZE + CELL_GAP) - CELL_GAP),
  );
}

function sizeBoard() {
  const automatic = fitZoom();
  const zoom = manualZoom ?? automatic;
  const cols = grid[0]?.length ?? 0;
  setGridSize(board, cols || 1, CELL_SIZE * zoom, CELL_GAP * zoom);
  if (cols) playback.style.setProperty('--board-width', ((cols * (CELL_SIZE + CELL_GAP) - CELL_GAP) * zoom) + 'px');
  zoomText.textContent = Math.max(1, Math.round(zoom * 100)) + '%';
  zoomIn.disabled = !grid.length || zoom >= MAX_ZOOM;
  zoomOut.disabled = !grid.length || zoom <= Math.min(.2, automatic);
  fit.disabled = !grid.length;
}

function changeZoom(factor) {
  const automatic = fitZoom();
  const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth;
  const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight;
  manualZoom = Math.max(Math.min(.2, automatic), Math.min(MAX_ZOOM, (manualZoom ?? automatic) * factor));
  sizeBoard();
  viewport.scrollLeft = centerX * viewport.scrollWidth - viewport.clientWidth / 2;
  viewport.scrollTop = centerY * viewport.scrollHeight - viewport.clientHeight / 2;
}

function drawGrid(states) {
  const fragment = document.createDocumentFragment();
  grid.forEach((row, r) => Array.from(row).forEach((symbol, c) => {
    const tile = document.createElement('div');
    const address = r + ',' + c;
    tile.className = 'tile ' + tileTypes[symbol];
    tile.textContent = ['#', '.', ' '].includes(symbol) ? '' : symbol;
    if (states.traps.has(address)) tile.classList.add('trap');
    if (states.layer && !states.layer.has(address)) tile.classList.add('dim');
    const visit = states.visits.get(address);
    if (visit) {
      const count = visit.chaves === '-' ? 0 : visit.chaves.length;
      tile.classList.add('trail');
      tile.style.setProperty('--trail', trailColors[Math.min(count, trailColors.length - 1)]);
    }
    if (address === states.current) tile.classList.add('current');
    fragment.appendChild(tile);
  }));
  board.replaceChildren(fragment);
}

function stateAddress(state) {
  return state.linha + ',' + state.coluna;
}

function traceCost(trace, originalRows) {
  const visitedBonuses = new Set();
  let cost = 0;
  for (const state of trace.slice(1)) {
    const symbol = originalRows[state.linha]?.[state.coluna];
    const address = stateAddress(state);
    if (symbol === ',' || symbol === '~' || symbol === '*') {
      cost += { ',': 3, '~': 5, '*': -2 }[symbol];
    } else if (symbol === '+' && !visitedBonuses.has(address)) {
      cost -= 4;
      visitedBonuses.add(address);
    } else {
      cost++;
    }
  }
  return cost;
}

function fadeValue(element) {
  element.getAnimations().forEach((animation) => animation.cancel());
  if (reducedMotion.matches) return;
  element.animate([{ opacity: .7 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
}

reducedMotion.addEventListener('change', (event) => {
  if (!event.matches) return;
  for (const element of document.querySelectorAll('.sim-metrics dd, #resultStatus')) {
    element.getAnimations().forEach((animation) => animation.cancel());
  }
});

function showValue(id, value, animated = false) {
  const element = byId(id);
  const text = String(value ?? '—');
  if (element.textContent === text) return;
  element.textContent = text;
  if (animated) fadeValue(element);
}

function render() {
  sizeBoard();
  const result = resultForMap();
  const path = result.caminho;
  const trace = path.slice(0, step + 1);
  const current = trace.at(-1);
  const activeLayer = layerSelect.value;
  const map = originalMap();
  drawGrid({
    current: current && stateAddress(current),
    traps: new Set(traps.checked ? (map?.armadilhas ?? []).map(([r, c]) => r + ',' + c) : []),
    visits: new Map(trace.map((state) => [stateAddress(state), state])),
    layer: activeLayer === 'all' ? null : new Set(path.filter((state) => state.chaves === activeLayer).map(stateAddress)),
  });

  const status = byId('resultStatus');
  const cycleLength = result.ciclo?.length;
  showValue('resultStatus', resultLabels[result.status] + (cycleLength ? ' · ' + cycleLength + ' estados' : ''));
  status.dataset.tone = result.status === 'OK' ? 'success' : 'warning';
  showValue('totalSteps', result.passos, true);
  showValue('finalCost', result.custo, true);
  showValue('runningCost', current ? traceCost(trace, map.mapa) : null, true);
  showValue('position', current?.linha);
  showValue('columnPosition', current?.coluna);
  showValue('keys', current?.chaves === '-' ? 'nenhuma' : current?.chaves);
  showValue('bonus', current?.bonus.length);
  byId('stepText').textContent = path.length ? 'Passo ' + step + ' de ' + (path.length - 1) : 'Sem percurso para reproduzir';
  const progress = byId('stepProgress');
  progress.hidden = path.length === 0;
  progress.max = Math.max(1, path.length - 1);
  progress.value = path.length === 1 ? 1 : step;
  byId('trapLegend').hidden = !traps.checked;
  back.disabled = step === 0;
  next.disabled = step >= path.length - 1;
  play.disabled = path.length < 2;
  byId('restart').disabled = step === 0 && timer === null;
}

function updateLayers() {
  const layers = new Set(['-', ...resultForMap().caminho.map((state) => state.chaves)]);
  layerSelect.replaceChildren(new Option('Todas', 'all'));
  for (const layer of layers) {
    layerSelect.add(new Option(layer === '-' ? 'Sem chaves' : 'Chaves ' + layer, layer));
  }
}

function updatePieceLegend() {
  const counts = new Map();
  for (const symbol of grid.join('')) {
    const piece = symbol === ' ' ? '.' : symbol;
    counts.set(piece, (counts.get(piece) ?? 0) + 1);
  }
  const items = legendPieces.filter(([symbol]) => counts.has(symbol)).map(([symbol, name, cost = '1']) => {
    const item = document.createElement('li');
    item.className = 'sim-piece-row';
    const swatch = document.createElement('span');
    swatch.className = 'tile ' + tileTypes[symbol];
    swatch.setAttribute('aria-hidden', 'true');
    swatch.textContent = symbol;
    const label = document.createElement('span');
    label.textContent = name;
    const values = document.createElement('span');
    values.className = 'sim-piece-values';
    const quantity = document.createElement('span');
    const quantityLabel = document.createElement('span');
    quantityLabel.className = 'visually-hidden';
    quantityLabel.textContent = 'Quantidade: ';
    quantity.append(quantityLabel, String(counts.get(symbol)));
    const weight = document.createElement('span');
    weight.className = cost === '—' ? 'sim-piece-cost is-empty' : 'sim-piece-cost';
    const costLabel = document.createElement('span');
    costLabel.className = 'visually-hidden';
    costLabel.textContent = cost === '—' ? 'Sem custo de entrada' : 'Custo: ';
    const costValue = document.createElement('span');
    if (cost === '—') costValue.setAttribute('aria-hidden', 'true');
    costValue.textContent = cost;
    weight.append(costLabel, costValue);
    values.append(quantity, weight);
    item.append(swatch, label, values);
    return item;
  });
  byId('pieceLegend').replaceChildren(...items);
}

function loadMap() {
  stop();
  manualZoom = null;
  grid = originalMap()?.mapa ?? [];
  step = 0;
  updateLayers();
  updatePieceLegend();
  render();
}

function togglePlay() {
  if (timer !== null) {
    stop();
    render();
    return;
  }
  const lastStep = resultForMap().caminho.length - 1;
  if (lastStep < 1) return;
  if (step >= lastStep) {
    step = 0;
    render();
  }
  play.textContent = 'Pausar';
  byId('restart').disabled = false;
  timer = window.setInterval(() => {
    step++;
    if (step === lastStep) stop();
    render();
  }, Number(speed.value));
}

function parseGrid(text) {
  const rows = text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/).filter((row) => row.length && !row.startsWith(';'));
  if (!rows.length) throw new Error('Mapa vazio.');
  if (rows.some((row) => row.length !== rows[0].length)) throw new Error('As linhas têm tamanhos diferentes.');
  const symbols = rows.join('');
  if ([...symbols].some((char) => !Object.hasOwn(tileTypes, char))) throw new Error('Há um símbolo desconhecido no mapa.');
  if ((symbols.match(/S/g) || []).length !== 1) throw new Error('É necessário exatamente um início (S).');
  if (!symbols.includes('G')) throw new Error('É necessária pelo menos uma saída (G).');
  return rows;
}

mapSelect.addEventListener('change', loadMap);
algSelect.addEventListener('change', () => { stop(); step = 0; updateLayers(); render(); });
for (const select of [mapSelect, algSelect]) {
  select.addEventListener('change', () => {
    const selected = mapSelect.selectedOptions[0]?.textContent;
    const algorithm = algSelect.selectedOptions[0]?.textContent;
    showValue('selectionFeedback', selected + ' · ' + algorithm);
    fadeValue(byId('resultStatus'));
  });
}
layerSelect.addEventListener('change', render);
traps.addEventListener('change', render);
speed.addEventListener('change', () => { if (timer !== null) { stop(); togglePlay(); } });
play.addEventListener('click', togglePlay);
back.addEventListener('click', () => { stop(); step--; render(); });
next.addEventListener('click', () => { stop(); step++; render(); });
byId('restart').addEventListener('click', () => { stop(); step = 0; render(); });
zoomIn.addEventListener('click', () => changeZoom(ZOOM_STEP));
zoomOut.addEventListener('click', () => changeZoom(1 / ZOOM_STEP));
fit.addEventListener('click', () => { manualZoom = null; sizeBoard(); });
hand.addEventListener('click', () => {
  const active = viewport.toggleAttribute('data-hand');
  hand.setAttribute('aria-pressed', String(active));
});
viewport.addEventListener('pointerdown', (event) => {
  if (!viewport.hasAttribute('data-hand') || event.button !== 0 || panDrag) return;
  event.preventDefault();
  viewport.setPointerCapture(event.pointerId);
  panDrag = {
    id: event.pointerId, x: event.clientX, y: event.clientY,
    left: viewport.scrollLeft, top: viewport.scrollTop,
  };
  viewport.setAttribute('data-dragging', '');
});
viewport.addEventListener('pointermove', (event) => {
  if (!panDrag || panDrag.id !== event.pointerId) return;
  viewport.scrollLeft = panDrag.left + panDrag.x - event.clientX;
  viewport.scrollTop = panDrag.top + panDrag.y - event.clientY;
});
function stopPan(event) {
  if (!panDrag || panDrag.id !== event.pointerId) return;
  panDrag = null;
  viewport.removeAttribute('data-dragging');
}
viewport.addEventListener('pointerup', stopPan);
viewport.addEventListener('pointercancel', stopPan);
viewport.addEventListener('lostpointercapture', stopPan);
async function init() {
  for (let delay = 150; delay <= 1400; delay += 50) speed.add(new Option(delay + ' ms por passo', delay));
  speed.value = '400';

  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.slice(1));
  const requestedMap = query.get('mapa');
  const filename = query.get('arquivo');
  let selected = originalMaps.has(requestedMap) ? requestedMap : DEFAULT_MAP;
  let loadError = '';

  try {
    if (hash.has('grade')) {
      const rows = parseGrid(hash.get('grade'));
      selected = 'editor';
      maps.set(selected, { mapa: rows, label: hash.get('nome') || 'Mapa do editor' });
    } else if (!originalMaps.has(requestedMap) && filename && /^[^/\\]+\.txt$/i.test(filename)) {
      const response = await fetch('/mapas/' + encodeURIComponent(filename));
      if (!response.ok) throw new Error('Não foi possível abrir o mapa selecionado.');
      const rows = parseGrid(await response.text());
      selected = requestedMap || filename;
      maps.set(selected, { mapa: rows, label: mapLabel(selected) });
    }
  } catch (error) {
    loadError = error.message;
  }

  for (const [id, map] of maps) mapSelect.add(new Option(map.label ?? mapLabel(id), id));
  if (maps.has(selected)) mapSelect.value = selected;
  loadMap();
  if (loadError) {
    const alert = byId('loadError');
    alert.textContent = loadError;
    alert.hidden = false;
  }
  new ResizeObserver(sizeBoard).observe(viewport);
}

init();

</script>
</body>
</html>
`

// Vite also imports syncMapas after saving a map. The simulator's
// precomputed results only need to sync when this script runs directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  syncMapas()
  syncSimulator()
}
