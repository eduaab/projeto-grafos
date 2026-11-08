import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { syncMapas } from './scripts/sync-mapas.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MAPAS_CRIADOS_DIR = join(__dirname, '..', 'data', 'mapas_criados')

/**
 * Dev-only middleware so the Oficina de Campo's "Salvar" button can write
 * straight into data/mapas_criados/ with zero clicks, instead of making the
 * browser ask for folder permission every time (the File System Access API
 * fallback in src/lib/saveToFolder.ts, used when this isn't available —
 * e.g. `vite preview`, a static deploy, or a non-Chromium browser).
 *
 * Only wired up via configureServer, so it only exists under `npm run dev`
 * and never ships in the production build.
 */
function saveMapaCriadoPlugin(): Plugin {
  return {
    name: 'save-mapa-criado',
    configureServer(server) {
      server.middlewares.use('/__save-mapa', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const { filename, text } = JSON.parse(body) as { filename?: string; text?: string }
            if (typeof filename !== 'string' || typeof text !== 'string') {
              throw new Error('filename e text são obrigatórios')
            }
            // Strip anything that isn't a plain basename — no slashes, no
            // "..", so this can only ever write inside mapas_criados/.
            const safeName = filename.replace(/[\\/]/g, '').replace(/\.\./g, '').trim()
            if (!safeName) throw new Error('nome de arquivo inválido')
            const finalName = safeName.endsWith('.txt') ? safeName : `${safeName}.txt`

            mkdirSync(MAPAS_CRIADOS_DIR, { recursive: true })
            writeFileSync(join(MAPAS_CRIADOS_DIR, finalName), text, 'utf8')

            // Rerun the same sync the predev hook does, so the new map's
            // manifest entry + public/mapas/ copy exist immediately — Vite
            // watches src/data/mapas.manifest.json and hot-updates the
            // Sala de Mapas with it, no dev-server restart needed.
            syncMapas()

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, path: `data/mapas_criados/${finalName}` }))
          } catch (error) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'erro desconhecido' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveMapaCriadoPlugin()],
})
