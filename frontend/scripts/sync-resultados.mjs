// [IA] Gemini – Copia os arquivos de resultados (JSON/CSV) de out/ para frontend/public/resultados/.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = join(__dirname, '..')
const REPO_ROOT = join(FRONTEND_ROOT, '..')
const DESTINO = join(FRONTEND_ROOT, 'public', 'resultados')

const ARQUIVOS = [
  'out/parte1/metricas_global.json',
  'out/parte1/camadas.json',
  'out/parte1/comparacao_modelagem.csv',
  'out/parte1/bellman_ford_g_pos_m05.json',
  'out/parte2/parte2_report.json',
  // [IA] Codex – publica o PDF do relatório junto aos resultados do site.
  'docs/RELATORIO_DO_PROJETO.pdf',
]

mkdirSync(DESTINO, { recursive: true })

let copiados = 0
for (const relativo of ARQUIVOS) {
  const origem = join(REPO_ROOT, relativo)
  if (!existsSync(origem)) {
    console.warn(`[sync-resultados] não encontrado: ${relativo}`)
    continue
  }
  copyFileSync(origem, join(DESTINO, basename(relativo)))
  copiados += 1
}

console.log(`[sync-resultados] ${copiados} arquivo(s) copiado(s) para public/resultados`)
