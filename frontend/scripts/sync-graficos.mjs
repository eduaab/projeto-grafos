// [IA] Claude – script de cópia dos gráficos para o site
// Copia os gráficos de out/parte1 e out/parte2 para frontend/public,
// para o site sempre mostrar a versão gerada pelos scripts e notebooks.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = join(__dirname, '..')

const PASTAS = [
  { nome: 'parte1', lista: 'figuras_parte1.json' },
  { nome: 'parte2', lista: 'graficos.json' },
]

for (const { nome, lista } of PASTAS) {
  const origem = join(FRONTEND_ROOT, '..', 'out', nome)
  const destino = join(FRONTEND_ROOT, 'public', nome)
  mkdirSync(destino, { recursive: true })

  const esperados = JSON.parse(readFileSync(join(FRONTEND_ROOT, 'src', 'data', lista), 'utf8'))
    .map((grafico) => grafico.arquivo)
  const disponiveis = existsSync(origem)
    ? readdirSync(origem).filter((arquivo) => arquivo.toLowerCase().endsWith('.png'))
    : []

  for (const arquivo of disponiveis) {
    copyFileSync(join(origem, arquivo), join(destino, arquivo))
  }

  for (const arquivo of esperados.filter((item) => !disponiveis.includes(item))) {
    console.warn(`[sync-graficos] não encontrado em out/${nome}: ${arquivo}`)
  }

  console.log(`[sync-graficos] ${disponiveis.length} gráfico(s) copiado(s) para public/${nome}`)
}
