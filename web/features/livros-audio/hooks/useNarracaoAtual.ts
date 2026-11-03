import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { LivroAudioBloco } from '../types'
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
}

interface OpcoesNarracaoAtual {
  livroUuid: string
  bloco: LivroAudioBloco | null
  documento: PDFDocumentProxy | null
  segundos: number
}

export function useNarracaoAtual({
  livroUuid,
  bloco,
  documento,
  segundos,
}: OpcoesNarracaoAtual): NarracaoAtual | null {
  const { data: trechos = [] } = useTrechosBloco(livroUuid, bloco)

  const { data: localizacoes } = useQuery({
    queryKey: [
      'localizacao-trechos',
      livroUuid,
      bloco?.numeroBloco,
      bloco?.atualizadoEm,
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

  const indice = useMemo(() => encontrarIndiceTrecho(trechos, segundos), [trechos, segundos])
  const paginaEstimada = bloco ? calcularPaginaPorTempoBloco(bloco, segundos) : null

  return useMemo(() => {
    if (!bloco || paginaEstimada === null) return null

    if (indice < 0) {
      return { indice: -1, texto: null, pagina: paginaEstimada, localizacao: null }
    }

    return {
      indice,
      texto: trechos[indice]?.texto ?? null,
      pagina: encontrarPaginaLocalizada(localizacoes, indice) ?? paginaEstimada,
      localizacao: localizacoes?.[indice] ?? null,
    }
  }, [bloco, indice, trechos, localizacoes, paginaEstimada])
}
