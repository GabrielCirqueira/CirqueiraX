import { useCallback, useState } from 'react'

const ESCALA_MINIMA = 0.8
const ESCALA_MAXIMA = 2.5
const PASSO_ESCALA = 0.2
const ESCALA_PADRAO = 1.2

interface OpcoesLeitorLivro {
  paginaInicial: number
  totalPaginas: number
  onSalvarPosicao?: (pagina: number) => void
}

export function useLeitorLivro({
  paginaInicial,
  totalPaginas,
  onSalvarPosicao,
}: OpcoesLeitorLivro) {
  const [paginaAtual, setPaginaAtual] = useState(() => Math.max(1, paginaInicial))
  const [escala, setEscala] = useState(ESCALA_PADRAO)
  const [modoDuplo, setModoDuplo] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return false
  })
  const [telaCheia, setTelaCheia] = useState(false)

  const definirEscala = useCallback((novaEscala: number) => {
    const escalaSegura = Math.min(
      ESCALA_MAXIMA,
      Math.max(ESCALA_MINIMA, Number(novaEscala.toFixed(2)))
    )
    setEscala(escalaSegura)
  }, [])

  const irParaPagina = useCallback(
    (novaPagina: number) => {
      const paginaSegura = Math.min(Math.max(1, novaPagina), Math.max(1, totalPaginas))
      setPaginaAtual(paginaSegura)
      return paginaSegura
    },
    [totalPaginas]
  )

  const mudarPagina = useCallback(
    (novaPagina: number) => {
      const paginaSegura = irParaPagina(novaPagina)
      if (onSalvarPosicao) {
        onSalvarPosicao(paginaSegura)
      }
    },
    [irParaPagina, onSalvarPosicao]
  )

  const avancarPagina = useCallback(() => {
    const incremento = modoDuplo ? 2 : 1
    mudarPagina(paginaAtual + incremento)
  }, [paginaAtual, modoDuplo, mudarPagina])

  const voltarPagina = useCallback(() => {
    const decremento = modoDuplo ? 2 : 1
    mudarPagina(paginaAtual - decremento)
  }, [paginaAtual, modoDuplo, mudarPagina])

  const aumentarZoom = useCallback(() => {
    setEscala((atual) => Math.min(ESCALA_MAXIMA, Number((atual + PASSO_ESCALA).toFixed(1))))
  }, [])

  const diminuirZoom = useCallback(() => {
    setEscala((atual) => Math.max(ESCALA_MINIMA, Number((atual - PASSO_ESCALA).toFixed(1))))
  }, [])

  const resetarZoom = useCallback(() => {
    setEscala(ESCALA_PADRAO)
  }, [])

  const alternarModoDuplo = useCallback(() => {
    setModoDuplo((atual) => !atual)
  }, [])

  const alternarTelaCheia = useCallback((container: HTMLElement | null) => {
    if (!document.fullscreenElement) {
      const alvo = container ?? document.documentElement
      alvo
        .requestFullscreen?.()
        .then(() => setTelaCheia(true))
        .catch(() => {})
    } else {
      document
        .exitFullscreen?.()
        .then(() => setTelaCheia(false))
        .catch(() => {})
    }
  }, [])

  return {
    paginaAtual,
    escala,
    modoDuplo,
    telaCheia,
    irParaPagina,
    mudarPagina,
    avancarPagina,
    voltarPagina,
    aumentarZoom,
    diminuirZoom,
    resetarZoom,
    definirEscala,
    alternarModoDuplo,
    alternarTelaCheia,
  }
}
