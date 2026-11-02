import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export interface TarefaRenderizacaoPagina {
  promise: Promise<void>
  cancelar: () => void
}

export async function carregarDocumentoPdf(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    url,
    withCredentials: false,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  })

  return loadingTask.promise
}

export function renderizarPaginaEmCanvas(
  pagina: pdfjsLib.PDFPageProxy,
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

export type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
