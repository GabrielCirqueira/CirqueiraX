import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
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

const PASTA_EXTENSAO_YOUTUBE = path.resolve(__dirname, '..', '..', 'extensao', 'youtube-music')
const DATA_DOS_ZERO = 0x21
const ASSINATURA_LOCAL = 0x04034b50
const ASSINATURA_CENTRAL = 0x02014b50
const ASSINATURA_FIM = 0x06054b50
const VERSAO_ZIP = 20
const METODO_DEFLATE = 8

function listarArquivos(pasta, base = pasta) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(pasta, entrada.name)
    if (entrada.isDirectory()) return listarArquivos(caminho, base)
    return [{ nome: path.relative(base, caminho).split(path.sep).join('/'), caminho }]
  })
}

function montarZip(arquivos) {
  const locais = []
  const centrais = []
  let deslocamento = 0
  for (const { nome, caminho } of arquivos) {
    const dados = fs.readFileSync(caminho)
    const comprimido = zlib.deflateRawSync(dados)
    const nomeBytes = Buffer.from(nome, 'utf8')
    const crc = zlib.crc32(dados)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(ASSINATURA_LOCAL, 0)
    local.writeUInt16LE(VERSAO_ZIP, 4)
    local.writeUInt16LE(METODO_DEFLATE, 8)
    local.writeUInt16LE(DATA_DOS_ZERO, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(comprimido.length, 18)
    local.writeUInt32LE(dados.length, 22)
    local.writeUInt16LE(nomeBytes.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(ASSINATURA_CENTRAL, 0)
    central.writeUInt16LE(VERSAO_ZIP, 4)
    central.writeUInt16LE(VERSAO_ZIP, 6)
    central.writeUInt16LE(METODO_DEFLATE, 10)
    central.writeUInt16LE(DATA_DOS_ZERO, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(comprimido.length, 20)
    central.writeUInt32LE(dados.length, 24)
    central.writeUInt16LE(nomeBytes.length, 28)
    central.writeUInt32LE(deslocamento, 42)
    locais.push(local, nomeBytes, comprimido)
    centrais.push(central, nomeBytes)
    deslocamento += local.length + nomeBytes.length + comprimido.length
  }
  const diretorio = Buffer.concat(centrais)
  const fim = Buffer.alloc(22)
  fim.writeUInt32LE(ASSINATURA_FIM, 0)
  fim.writeUInt16LE(arquivos.length, 8)
  fim.writeUInt16LE(arquivos.length, 10)
  fim.writeUInt32LE(diretorio.length, 12)
  fim.writeUInt32LE(deslocamento, 16)
  return Buffer.concat([...locais, diretorio, fim])
}

function pacoteExtensaoYoutube() {
  return {
    name: 'pacote-extensao-youtube',
    apply: 'build',
    generateBundle() {
      const manifesto = JSON.parse(fs.readFileSync(path.join(PASTA_EXTENSAO_YOUTUBE, 'manifest.json'), 'utf8'))
      this.emitFile({
        type: 'asset',
        fileName: `extensao/cirqueirax-youtube-music-${manifesto.version}.zip`,
        source: montarZip(listarArquivos(PASTA_EXTENSAO_YOUTUBE)),
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
    pacoteExtensaoYoutube(),
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
