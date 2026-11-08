// Copies validated maze .txt files from data/mapas and data/mapas_grupo (repo
// root, outside frontend/) into frontend/public/mapas, and writes a manifest
// the frontend reads at build time. Runs on plain Node (no dependencies) via
// the predev/prebuild npm hooks, so the gallery never reads stale data.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

function main() {
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
}

main()
