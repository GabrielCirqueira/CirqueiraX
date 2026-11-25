import { useCallback, useRef, useState } from 'react'
import type { AcaoZoom } from '../types'

const ZOOM_MINIMO = 0.05
const ZOOM_MAXIMO = 8
const ZOOM_MAXIMO_AJUSTADO = 2
const PASSOS_ZOOM = [0.05, 0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8]
const MARGEM_AREA = 48
const SENSIBILIDADE_RODA = 0.0015

interface TamanhoArea {
  largura: number
  altura: number
}

function limitarZoom(valor: number): number {
  return Math.min(Math.max(valor, ZOOM_MINIMO), ZOOM_MAXIMO)
}

function proximoPasso(atual: number, direcao: 1 | -1): number {
  if (direcao === 1) return PASSOS_ZOOM.find((passo) => passo > atual + 0.001) ?? ZOOM_MAXIMO
  return [...PASSOS_ZOOM].reverse().find((passo) => passo < atual - 0.001) ?? ZOOM_MINIMO
}

/**
 * Zoom da área de edição. "Ajustar" acompanha o tamanho da área com um ResizeObserver;
 * um número fixa a escala (1 = tamanho real).
 */
export function useZoomEditor(larguraTela: number, alturaTela: number) {
  const [modo, setModo] = useState<'ajustar' | number>('ajustar')
  const [area, setArea] = useState<TamanhoArea | null>(null)
  const observadorRef = useRef<ResizeObserver | null>(null)
  const removerRodaRef = useRef<(() => void) | null>(null)
  const aplicarRodaRef = useRef<(deltaY: number) => void>(() => undefined)

  const registrarArea = useCallback((elemento: HTMLElement | null) => {
    observadorRef.current?.disconnect()
    observadorRef.current = null
    removerRodaRef.current?.()
    removerRodaRef.current = null
    if (!elemento) return
    // Ctrl + roda dá zoom; precisa de listener não passivo para impedir o zoom do navegador.
    const aoRolar = (evento: WheelEvent) => {
      if (!evento.ctrlKey && !evento.metaKey) return
      evento.preventDefault()
      aplicarRodaRef.current(evento.deltaY)
    }
    elemento.addEventListener('wheel', aoRolar, { passive: false })
    removerRodaRef.current = () => elemento.removeEventListener('wheel', aoRolar)
    const observador = new ResizeObserver(([entrada]) => {
      if (!entrada) return
      setArea({ largura: entrada.contentRect.width, altura: entrada.contentRect.height })
    })
    observador.observe(elemento)
    observadorRef.current = observador
  }, [])

  const zoomAjustado =
    area && larguraTela > 0 && alturaTela > 0
      ? Math.min(
          (area.largura - MARGEM_AREA) / larguraTela,
          (area.altura - MARGEM_AREA) / alturaTela,
          ZOOM_MAXIMO_AJUSTADO
        )
      : null
  const zoom = modo === 'ajustar' ? zoomAjustado : modo

  function aplicar(acao: AcaoZoom) {
    const atual = zoom ?? 1
    if (acao === 'ajustar') setModo('ajustar')
    if (acao === 'real') setModo(1)
    if (acao === 'mais') setModo(limitarZoom(proximoPasso(atual, 1)))
    if (acao === 'menos') setModo(limitarZoom(proximoPasso(atual, -1)))
  }

  function aplicarRoda(deltaY: number) {
    const atual = zoom ?? 1
    setModo(limitarZoom(atual * Math.exp(-deltaY * SENSIBILIDADE_RODA)))
  }
  aplicarRodaRef.current = aplicarRoda

  return {
    zoom: zoom !== null ? Math.max(zoom, ZOOM_MINIMO) : null,
    ajustado: modo === 'ajustar',
    registrarArea,
    aplicar,
  }
}
