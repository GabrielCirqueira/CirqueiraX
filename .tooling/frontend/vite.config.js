import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import symfonyPlugin from 'vite-plugin-symfony'
import tsconfigPaths from 'vite-tsconfig-paths'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PASTAS_PDFJS = ['cmaps', 'standard_fonts', 'wasm', 'iccs']

function recursosOffline() {
  return {
    name: 'recursos-offline',
    apply: 'build',
    generateBundle(_opcoes, pacote) {
      const arquivos = Object.keys(pacote).filter(
        (nome) => !nome.startsWith('.vite/') && !nome.endsWith('.map')
      )
      const origemPdfjs = path.resolve(__dirname, '..', '..', 'node_modules', 'pdfjs-dist')
      for (const pasta of PASTAS_PDFJS) {
        const diretorio = path.join(origemPdfjs, pasta)
        if (!fs.existsSync(diretorio)) continue
        for (const nome of fs.readdirSync(diretorio)) {
          const caminho = path.join(diretorio, nome)
          if (!fs.statSync(caminho).isFile()) continue
          this.emitFile({
            type: 'asset',
            fileName: `pdfjs/${pasta}/${nome}`,
            source: fs.readFileSync(caminho),
          })
        }
      }
      this.emitFile({
        type: 'asset',
        fileName: 'sw-assets.json',
        source: JSON.stringify({ geradoEm: new Date().toISOString(), arquivos }),
      })
    },
  }
}

const frontendPort = Number.parseInt(process.env.FRONTEND_PORT ?? '', 10) || 5173

export default defineConfig((config) => ({
  plugins: [
    tailwindcss(),
    react(),
    symfonyPlugin(),
    recursosOffline(),
    tsconfigPaths({
      projects: [path.resolve(__dirname, '..', '..', 'tsconfig.json')],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        app: './web/main.tsx',
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts'
            }
            if (id.includes('@chakra-ui') || id.includes('@emotion')) {
              return 'vendor-ui'
            }
            if (id.includes('@tanstack/react-query') || id.includes('axios')) {
              return 'vendor-query'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
          }
        },
      },
    },
    sourcemap: config.mode === 'development',
  },
  server: {
    cors: true,
    host: true,
    hmr: {
      host: 'localhost',
      port: frontendPort,
    },
    port: frontendPort,
  },
}))
