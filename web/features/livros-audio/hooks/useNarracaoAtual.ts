import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LivroAudioBloco, TrechoNarracao } from '../types'
import {
  type LocalizacaoTrecho,
  encontrarIndiceTrecho,
  encontrarPaginaLocalizada,
  localizarTrechos,
} from '../utils/localizacaoNarracao'
import { type PDFDocumentProxy, obterItensTextoPagina } from '../utils/pdf'
import { calcularPaginaPorTempoBloco } from '../utils/sincronizacao'
import { useTrechosBloco } from './useLivrosAudio'

export interface NarracaoAtual {
  indice: number
  texto: string | null
  pagina: number
  localizacao: LocalizacaoTrecho | null
  localizacaoPalavra: LocalizacaoTrecho | null
}

interface OpcoesNarracaoAtual {
  livroUuid: string
  bloco: LivroAudioBloco | null
  documento: PDFDocumentProxy | null
  voz: string | null
  segundos: number
  tocando: boolean
  obterTempoAtual: () => number | null
}

interface PosicaoNarracao {
  frase: number
  palavra: number
}

function calcularPosicao(trechos: TrechoNarracao[], segundos: number): PosicaoNarracao {
  const frase = encontrarIndiceTrecho(trechos, segundos)
  const palavras = trechos[frase]?.palavras ?? []
  const palavra = palavras.length > 0 ? encontrarIndiceTrecho(palavras, segundos) : -1
  return { frase, palavra }
}

export function useNarracaoAtual({
  livroUuid,
  bloco,
  documento,
  voz,
  segundos,
  tocando,
  obterTempoAtual,
}: OpcoesNarracaoAtual): NarracaoAtual | null {
  const { data: trechos = [] } = useTrechosBloco(livroUuid, bloco, voz)
  const [posicao, setPosicao] = useState<PosicaoNarracao>({ frase: -1, palavra: -1 })

  const { data: localizacoes } = useQuery({
    queryKey: [
      'localizacao-trechos',
      livroUuid,
      bloco?.numeroBloco,
      bloco?.atualizadoEm,
      voz,
      trechos.length,
    ],
    queryFn: async () => {
      if (!documento || !bloco) return []

      const ultimaPagina = Math.min(bloco.paginaFim, documento.numPages)
      const numeros: number[] = []
      for (let numero = bloco.paginaInicio; numero <= ultimaPagina; numero++) {
        numeros.push(numero)
      }

      const paginas = await Promise.all(
        numeros.map(async (numero) => ({
          numero,
          itens: await obterItensTextoPagina(documento, numero),
        }))
      )

      return localizarTrechos(paginas, trechos)
    },
    enabled: Boolean(documento && bloco && trechos.length > 0),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const atualizarPosicao = useCallback(
    (tempo: number) => {
      const nova = calcularPosicao(trechos, tempo)
      setPosicao((atual) =>
        atual.frase === nova.frase && atual.palavra === nova.palavra ? atual : nova
      )
    },
    [trechos]
  )

  useEffect(() => {
    atualizarPosicao(segundos)
  }, [atualizarPosicao, segundos])

  useEffect(() => {
    if (!tocando || trechos.length === 0) return

    let quadro = 0
    const acompanhar = () => {
      const tempo = obterTempoAtual()
      if (tempo !== null) atualizarPosicao(tempo)
      quadro = requestAnimationFrame(acompanhar)
    }
    quadro = requestAnimationFrame(acompanhar)

    return () => cancelAnimationFrame(quadro)
  }, [tocando, trechos.length, obterTempoAtual, atualizarPosicao])

  const paginaEstimada = bloco ? calcularPaginaPorTempoBloco(bloco, segundos) : null

  return useMemo(() => {
    if (!bloco || paginaEstimada === null) return null

    const indice = posicao.frase
    if (indice < 0 || indice >= trechos.length) {
      return {
        indice: -1,
        texto: null,
        pagina: paginaEstimada,
        localizacao: null,
        localizacaoPalavra: null,
      }
    }

    const localizacao = localizacoes?.[indice] ?? null

    return {
      indice,
      texto: trechos[indice]?.texto ?? null,
      pagina: encontrarPaginaLocalizada(localizacoes, indice) ?? paginaEstimada,
      localizacao,
      localizacaoPalavra: localizacao?.palavras?.[posicao.palavra] ?? null,
    }
  }, [bloco, posicao, trechos, localizacoes, paginaEstimada])
}
