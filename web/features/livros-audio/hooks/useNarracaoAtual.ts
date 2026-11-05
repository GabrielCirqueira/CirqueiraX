import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AlvoReproducao, LivroAudioBloco, TrechoNarracao } from '../types'
import {
  type LocalizacaoTrecho,
  encontrarIndiceTrecho,
  encontrarPaginaLocalizada,
  normalizarTextoNarracao,
} from '../utils/localizacaoNarracao'
import type { PDFDocumentProxy } from '../utils/pdf'
import { calcularPaginaPorTempoBloco } from '../utils/sincronizacao'
import { calcularLocalizacaoBloco, chaveLocalizacaoBloco } from './localizacaoBloco'
import { useTrechosBloco } from './useLivrosAudio'

export interface NarracaoAtual {
  numeroBloco: number
  trechos: TrechoNarracao[]
  carregandoTrechos: boolean
  indicePalavra: number
  indice: number
  texto: string | null
  pagina: number
  localizacao: LocalizacaoTrecho | null
  localizacaoPalavra: LocalizacaoTrecho | null
  inicioDaPagina: (pagina: number) => number | null
  resolverAlvo: (alvo: AlvoReproducao) => number | null | undefined
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
  const { data: trechosCarregados, isLoading: carregandoTrechos } = useTrechosBloco(
    livroUuid,
    bloco,
    voz
  )
  const trechos = useMemo(() => trechosCarregados ?? [], [trechosCarregados])
  const [posicao, setPosicao] = useState<PosicaoNarracao>({ frase: -1, palavra: -1 })

  const { data: localizacoes } = useQuery({
    queryKey: chaveLocalizacaoBloco(livroUuid, bloco, voz, trechos.length),
    queryFn: async () => {
      if (!documento || !bloco) return []
      return calcularLocalizacaoBloco(documento, bloco, trechos)
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

  const inicioDaPagina = useCallback(
    (pagina: number): number | null => {
      if (!localizacoes) return null
      const indice = localizacoes.findIndex((localizacao) => localizacao?.pagina === pagina)
      return indice >= 0 ? (trechos[indice]?.inicio ?? null) : null
    },
    [localizacoes, trechos]
  )

  const resolverAlvo = useCallback(
    (alvo: AlvoReproducao): number | null | undefined => {
      if (!bloco || alvo.numeroBloco !== bloco.numeroBloco) return undefined
      const temTrechos = Boolean(voz) || bloco.possuiTrechos
      if (!temTrechos) return null
      if (!trechosCarregados) return undefined
      if (trechos.length === 0) return null

      if (alvo.indiceTrecho !== null && alvo.indiceTrecho !== undefined) {
        let indice = Math.min(Math.max(0, alvo.indiceTrecho), trechos.length - 1)
        if (alvo.texto && trechos[indice]?.texto !== alvo.texto) {
          let melhor = -1
          trechos.forEach((trecho, posicao) => {
            if (
              trecho.texto === alvo.texto &&
              (melhor < 0 || Math.abs(posicao - indice) < Math.abs(melhor - indice))
            ) {
              melhor = posicao
            }
          })
          if (melhor >= 0) indice = melhor
        }
        const trecho = trechos[indice]
        if (!trecho) return null
        const palavra =
          alvo.indicePalavra !== null && alvo.indicePalavra !== undefined
            ? trecho.palavras[alvo.indicePalavra]
            : undefined
        return palavra?.inicio ?? trecho.inicio
      }

      if (alvo.segundos !== null && alvo.segundos !== undefined) return alvo.segundos

      if (!localizacoes) return undefined

      if (alvo.busca) {
        const consulta = normalizarTextoNarracao(alvo.busca)
        const indice = trechos.findIndex(
          (trecho, posicao) =>
            (localizacoes[posicao]?.pagina === alvo.pagina ||
              localizacoes[posicao]?.segmentos.some(
                (segmento) => segmento.pagina === alvo.pagina
              )) &&
            normalizarTextoNarracao(trecho.texto).includes(consulta)
        )
        if (indice >= 0) return trechos[indice]?.inicio ?? null
      }

      return inicioDaPagina(alvo.pagina)
    },
    [bloco, voz, trechosCarregados, trechos, localizacoes, inicioDaPagina]
  )

  return useMemo(() => {
    if (!bloco || paginaEstimada === null) return null

    const base = {
      numeroBloco: bloco.numeroBloco,
      trechos,
      carregandoTrechos,
    }
    const indice = posicao.frase
    if (indice < 0 || indice >= trechos.length) {
      return {
        ...base,
        indicePalavra: -1,
        indice: -1,
        texto: null,
        pagina: paginaEstimada,
        localizacao: null,
        localizacaoPalavra: null,
        inicioDaPagina,
        resolverAlvo,
      }
    }

    const localizacao = localizacoes?.[indice] ?? null

    return {
      ...base,
      indicePalavra: posicao.palavra,
      indice,
      texto: trechos[indice]?.texto ?? null,
      pagina: encontrarPaginaLocalizada(localizacoes, indice) ?? paginaEstimada,
      localizacao,
      localizacaoPalavra: localizacao?.palavras?.[posicao.palavra] ?? null,
      inicioDaPagina,
      resolverAlvo,
    }
  }, [
    bloco,
    posicao,
    trechos,
    carregandoTrechos,
    localizacoes,
    paginaEstimada,
    inicioDaPagina,
    resolverAlvo,
  ])
}
