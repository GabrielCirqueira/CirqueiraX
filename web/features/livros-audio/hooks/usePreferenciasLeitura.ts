import { useCallback, useState } from 'react'
import type { TemaPagina } from '../types'

const CHAVE_TEMA_PAGINA = 'livros-audio:tema-pagina'
const CHAVE_MODO_TEXTO = 'livros-audio:modo-texto'
const CHAVE_TAMANHO_FONTE = 'livros-audio:tamanho-fonte'
const ORDEM_TEMAS: TemaPagina[] = ['claro', 'sepia', 'escuro']
const FONTE_MINIMA = 15
const FONTE_MAXIMA = 34
const FONTE_PADRAO = 20

function lerItem(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravarItem(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor)
  } catch {}
}

function ehTelaPequena(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

function lerTema(): TemaPagina {
  const salvo = lerItem(CHAVE_TEMA_PAGINA)
  return ORDEM_TEMAS.includes(salvo as TemaPagina) ? (salvo as TemaPagina) : 'claro'
}

function lerModoTexto(): boolean {
  const salvo = lerItem(CHAVE_MODO_TEXTO)
  if (salvo === '1') return true
  if (salvo === '0') return false
  return ehTelaPequena()
}

function lerTamanhoFonte(): number {
  const salvo = Number(lerItem(CHAVE_TAMANHO_FONTE))
  if (!Number.isFinite(salvo) || salvo <= 0) return FONTE_PADRAO
  return Math.min(FONTE_MAXIMA, Math.max(FONTE_MINIMA, salvo))
}

export function usePreferenciasLeitura() {
  const [tema, setTema] = useState<TemaPagina>(lerTema)
  const [modoTexto, setModoTexto] = useState<boolean>(lerModoTexto)
  const [tamanhoFonte, setTamanhoFonte] = useState<number>(lerTamanhoFonte)

  const alternarTema = useCallback(() => {
    setTema((atual) => {
      const novo = ORDEM_TEMAS[(ORDEM_TEMAS.indexOf(atual) + 1) % ORDEM_TEMAS.length] ?? 'claro'
      gravarItem(CHAVE_TEMA_PAGINA, novo)
      return novo
    })
  }, [])

  const alternarModoTexto = useCallback(() => {
    setModoTexto((atual) => {
      gravarItem(CHAVE_MODO_TEXTO, atual ? '0' : '1')
      return !atual
    })
  }, [])

  const mudarFonte = useCallback((passo: number) => {
    setTamanhoFonte((atual) => {
      const novo = Math.min(FONTE_MAXIMA, Math.max(FONTE_MINIMA, atual + passo))
      gravarItem(CHAVE_TAMANHO_FONTE, String(novo))
      return novo
    })
  }, [])

  return {
    tema,
    alternarTema,
    modoTexto,
    alternarModoTexto,
    tamanhoFonte,
    aumentarFonte: useCallback(() => mudarFonte(2), [mudarFonte]),
    diminuirFonte: useCallback(() => mudarFonte(-2), [mudarFonte]),
  }
}
