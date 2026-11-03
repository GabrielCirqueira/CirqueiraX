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

const PROPORCAO_ASCENDENTE = 0.85
const PROPORCAO_ALTURA_LINHA = 1.1
const FOLGA_FINAL_CARACTERES = 0.6
const PADRAO_PONTUACAO = /[^\p{L}\p{N}\s]/u
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
      conteudo.items.flatMap((item) =>
        'str' in item
          ? [{ texto: item.str, transform: item.transform as number[], largura: item.width }]
          : []
      )
    )

  promessa.catch(() => cache.delete(numeroPagina))
  cache.set(numeroPagina, promessa)

  return promessa
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
      const terminaNesteItem = indice === segmento.itemFim
      const de = indice === segmento.itemInicio ? segmento.caractereInicio : 0
      let ate = terminaNesteItem ? segmento.caractereFim : totalCaracteres
      while (
        terminaNesteItem &&
        ate < totalCaracteres &&
        PADRAO_PONTUACAO.test(item.texto[ate] ?? '')
      ) {
        ate++
      }
      if (ate <= de) continue

      const posicao = pdfjsLib.Util.transform(viewport.transform, item.transform)
      const alturaFonte = Math.hypot(posicao[2] ?? 0, posicao[3] ?? 0)
      const larguraItem = item.largura * viewport.scale
      const esquerda = (posicao[4] ?? 0) + larguraItem * (de / totalCaracteres)
      const folga = terminaNesteItem && ate < totalCaracteres ? FOLGA_FINAL_CARACTERES : 0
      const largura = larguraItem * ((ate - de + folga) / totalCaracteres)
      const topo = (posicao[5] ?? 0) - alturaFonte * PROPORCAO_ASCENDENTE

      if (largura <= 0 || alturaFonte <= 0) continue

      retangulos.push({
        esquerda: (esquerda / viewport.width) * 100,
        topo: (topo / viewport.height) * 100,
        largura: (largura / viewport.width) * 100,
        altura: ((alturaFonte * PROPORCAO_ALTURA_LINHA) / viewport.height) * 100,
      })
    }
  }

  return retangulos
}

export type { PDFDocumentProxy, PDFPageProxy }
