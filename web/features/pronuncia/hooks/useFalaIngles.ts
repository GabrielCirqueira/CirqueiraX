import { useRef, useState } from 'react'

const IDIOMA_INGLES = 'en-US'
const PREFIXO_INGLES = 'en'

function escolherVoz(): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices()
  return (
    vozes.find((voz) => voz.lang === IDIOMA_INGLES && voz.localService) ??
    vozes.find((voz) => voz.lang === IDIOMA_INGLES) ??
    vozes.find((voz) => voz.lang.startsWith(PREFIXO_INGLES)) ??
    null
  )
}

export interface OpcoesFala {
  id: string
  velocidade: number
}

/** Lê o inglês em voz alta com a voz do próprio navegador (grátis) e avisa qual palavra está sendo falada. */
export function useFalaIngles() {
  const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [falandoId, setFalandoId] = useState<string | null>(null)
  const [indiceCaractere, setIndiceCaractere] = useState<number | null>(null)
  const atualRef = useRef<SpeechSynthesisUtterance | null>(null)

  function encerrar(fala: SpeechSynthesisUtterance) {
    if (atualRef.current !== fala) return
    atualRef.current = null
    setFalandoId(null)
    setIndiceCaractere(null)
  }

  function parar() {
    if (!suportado) return
    atualRef.current = null
    window.speechSynthesis.cancel()
    setFalandoId(null)
    setIndiceCaractere(null)
  }

  function falar(texto: string, { id, velocidade }: OpcoesFala) {
    if (!suportado || texto.trim() === '') return
    if (falandoId === id) {
      parar()
      return
    }

    window.speechSynthesis.cancel()
    const fala = new SpeechSynthesisUtterance(texto)
    fala.lang = IDIOMA_INGLES
    fala.rate = velocidade
    const voz = escolherVoz()
    if (voz) fala.voice = voz
    fala.onboundary = (evento) => {
      if (atualRef.current === fala && evento.name === 'word') setIndiceCaractere(evento.charIndex)
    }
    fala.onend = () => encerrar(fala)
    fala.onerror = () => encerrar(fala)

    atualRef.current = fala
    setFalandoId(id)
    setIndiceCaractere(0)
    window.speechSynthesis.speak(fala)
  }

  return { suportado, falandoId, indiceCaractere, falar, parar }
}

export type FalaIngles = ReturnType<typeof useFalaIngles>
