// Copia os gráficos da Parte 2 (out/parte2/*.png) para frontend/public/parte2,
// para o site sempre mostrar a versão gerada pelo notebook.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = join(__dirname, '..')
const ORIGEM = join(FRONTEND_ROOT, '..', 'out', 'parte2')
const DESTINO = join(FRONTEND_ROOT, 'public', 'parte2')
const LISTA = join(FRONTEND_ROOT, 'src', 'data', 'graficos.json')

mkdirSync(DESTINO, { recursive: true })

const esperados = JSON.parse(readFileSync(LISTA, 'utf8')).map((grafico) => grafico.arquivo)
const disponiveis = existsSync(ORIGEM)
  ? readdirSync(ORIGEM).filter((nome) => nome.toLowerCase().endsWith('.png'))
  : []

for (const nome of disponiveis) {
  copyFileSync(join(ORIGEM, nome), join(DESTINO, nome))
}

const faltando = esperados.filter((nome) => !disponiveis.includes(nome))
for (const nome of faltando) {
  console.warn(`[sync-graficos] não encontrado em out/parte2: ${nome}`)
}

console.log(`[sync-graficos] ${disponiveis.length} gráfico(s) copiado(s) para public/parte2`)
