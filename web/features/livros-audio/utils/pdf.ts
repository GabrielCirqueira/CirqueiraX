import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export interface TarefaRenderizacaoPagina {
  promise: Promise<void>
  cancelar: () => void
}

export async function carregarDocumentoPdf(url: string): Promise<PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    url,
    withCredentials: false,
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  })

  return loadingTask.promise
}

export function renderizarPaginaEmCanvas(
  pagina: PDFPageProxy,
  canvas: HTMLCanvasElement,
  escala = 1.5
): TarefaRenderizacaoPagina {
  const viewport = pagina.getViewport({ scale: escala })
  const razaoPixels = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const contexto = canvas.getContext('2d')

  if (!contexto) {
    return {
      promise: Promise.reject(new Error('Contexto 2D não disponível.')),
      cancelar: () => {},
    }
  }

  canvas.width = Math.floor(viewport.width * razaoPixels)
  canvas.height = Math.floor(viewport.height * razaoPixels)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = `${Math.floor(viewport.height)}px`

  const transform = razaoPixels !== 1 ? [razaoPixels, 0, 0, razaoPixels, 0, 0] : undefined

  const renderTask = pagina.render({
    canvasContext: contexto,
    viewport,
    transform,
    canvas,
  })

  return {
    promise: renderTask.promise,
    cancelar: () => {
      try {
        renderTask.cancel()
      } catch {}
    },
  }
}

export interface ItemTextoPdf {
  texto: string
  transform: number[]
  largura: number
  fonte: string
  ascendente: number
  descendente: number
}

export interface SegmentoDestaque {
  pagina: number
  itemInicio: number
  caractereInicio: number
  itemFim: number
  caractereFim: number
}

export interface RetanguloDestaque {
  esquerda: number
  topo: number
  largura: number
  altura: number
}

const ASCENDENTE_PADRAO = 0.85
const DESCENDENTE_PADRAO = -0.22
const FOLGA_VERTICAL = 0.08
const FOLGA_HORIZONTAL = 0.12
const TAMANHO_FONTE_MEDICAO = 100
const PADRAO_PONTUACAO = /[^\p{L}\p{N}\s]/u
let contextoMedicao: CanvasRenderingContext2D | null | undefined
const cacheItensTexto = new WeakMap<PDFDocumentProxy, Map<number, Promise<ItemTextoPdf[]>>>()

export function obterItensTextoPagina(
  documento: PDFDocumentProxy,
  numeroPagina: number
): Promise<ItemTextoPdf[]> {
  let itensPorPagina = cacheItensTexto.get(documento)
  if (!itensPorPagina) {
    itensPorPagina = new Map()
    cacheItensTexto.set(documento, itensPorPagina)
  }

  const existente = itensPorPagina.get(numeroPagina)
  if (existente) {
    return existente
  }

  const cache = itensPorPagina
  const promessa = documento
    .getPage(numeroPagina)
    .then((pagina) => pagina.getTextContent())
    .then((conteudo) =>
      conteudo.items.flatMap((item) => {
        if (!('str' in item)) return []
        const estilo = conteudo.styles[item.fontName]
        return [
          {
            texto: item.str,
            transform: item.transform as number[],
            largura: item.width,
            fonte: `"${item.fontName}", ${estilo?.fontFamily ?? 'sans-serif'}`,
            ascendente: estilo?.ascent || ASCENDENTE_PADRAO,
            descendente: estilo?.descent || DESCENDENTE_PADRAO,
          },
        ]
      })
    )

  promessa.catch(() => cache.delete(numeroPagina))
  cache.set(numeroPagina, promessa)

  return promessa
}

function obterContextoMedicao(): CanvasRenderingContext2D | null {
  if (contextoMedicao === undefined) {
    contextoMedicao =
      typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
  }
  return contextoMedicao
}

function criarMedidorItem(item: ItemTextoPdf): (posicao: number) => number {
  const total = item.texto.length
  const contexto = obterContextoMedicao()
  const proporcional = (posicao: number) => posicao / total

  if (!contexto) return proporcional

  contexto.font = `${TAMANHO_FONTE_MEDICAO}px ${item.fonte}`
  const larguraTotal = contexto.measureText(item.texto).width
  if (larguraTotal <= 0) return proporcional

  return (posicao: number) => {
    if (posicao <= 0) return 0
    if (posicao >= total) return 1
    return contexto.measureText(item.texto.slice(0, posicao)).width / larguraTotal
  }
}

function ehPontuacao(caractere: string | undefined): boolean {
  return caractere !== undefined && PADRAO_PONTUACAO.test(caractere)
}

export function calcularRetangulosDestaque(
  pagina: PDFPageProxy,
  itens: ItemTextoPdf[],
  segmentos: SegmentoDestaque[]
): RetanguloDestaque[] {
  const viewport = pagina.getViewport({ scale: 1 })
  const retangulos: RetanguloDestaque[] = []

  for (const segmento of segmentos) {
    for (let indice = segmento.itemInicio; indice <= segmento.itemFim; indice++) {
      const item = itens[indice]
      if (!item || item.texto.length === 0) continue

      const totalCaracteres = item.texto.length
      const comecaNesteItem = indice === segmento.itemInicio
      const terminaNesteItem = indice === segmento.itemFim
      let de = comecaNesteItem ? segmento.caractereInicio : 0
      let ate = terminaNesteItem ? segmento.caractereFim : totalCaracteres

      while (comecaNesteItem && de > 0 && ehPontuacao(item.texto[de - 1])) de--
      while (terminaNesteItem && ate < totalCaracteres && ehPontuacao(item.texto[ate])) ate++
      while (de < ate && item.texto[de] === ' ') de++
      while (ate > de && item.texto[ate - 1] === ' ') ate--
      if (ate <= de) continue

      const posicao = pdfjsLib.Util.transform(viewport.transform, item.transform)
      const alturaFonte = Math.hypot(posicao[2] ?? 0, posicao[3] ?? 0)
      const larguraItem = item.largura * viewport.scale
      if (larguraItem <= 0 || alturaFonte <= 0) continue

      const medir = criarMedidorItem(item)
      const folgaHorizontal = alturaFonte * FOLGA_HORIZONTAL
      const folgaVertical = alturaFonte * FOLGA_VERTICAL
      const esquerda = (posicao[4] ?? 0) + larguraItem * medir(de) - folgaHorizontal
      const direita = (posicao[4] ?? 0) + larguraItem * medir(ate) + folgaHorizontal
      const topo = (posicao[5] ?? 0) - alturaFonte * item.ascendente - folgaVertical
      const altura = alturaFonte * (item.ascendente - item.descendente) + folgaVertical * 2

      retangulos.push({
        esquerda: (esquerda / viewport.width) * 100,
        topo: (topo / viewport.height) * 100,
        largura: ((direita - esquerda) / viewport.width) * 100,
        altura: (altura / viewport.height) * 100,
      })
    }
  }

  return retangulos
}

export type { PDFDocumentProxy, PDFPageProxy }
