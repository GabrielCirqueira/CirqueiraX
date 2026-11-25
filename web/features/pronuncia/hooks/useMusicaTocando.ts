import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { obterLetraMusica, obterTocandoAgoraPronuncia, traduzirLetraMusica } from '../api'
import type { FaixaParaLetra, TocandoAgoraPronuncia } from '../types'
import { extrairMensagemErroApi } from '../utils'
import { PRONUNCIA_QUERY_KEYS } from './chavesQueryPronuncia'

const INTERVALO_PARADO_MS = 20_000
const INTERVALO_MINIMO_MS = 2_000
const FOLGA_FIM_FAIXA_MS = 1_500
const LETRA_FRESCA_MS = 30 * 60_000

function calcularProximaConsulta(dados: TocandoAgoraPronuncia | undefined): number {
  if (!dados?.temItem || !dados.emReproducao) return INTERVALO_PARADO_MS
  const restante = dados.duracaoMs - dados.progressoMs + FOLGA_FIM_FAIXA_MS
  return Math.max(INTERVALO_MINIMO_MS, Math.min(dados.proximaConsultaMs, restante))
}

/** Consulta no ritmo que o servidor indica (5 s, ou 12 s quando a última hora já teve muitas consultas), 20 s parado e logo após o fim da faixa; entre consultas o tempo é contado no navegador. */
export function useTocandoAgoraPronuncia(habilitado: boolean) {
  return useQuery({
    queryKey: PRONUNCIA_QUERY_KEYS.tocandoAgora,
    queryFn: obterTocandoAgoraPronuncia,
    enabled: habilitado,
    refetchInterval: (query) => calcularProximaConsulta(query.state.data),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  })
}

export function faixaDoTocando(tocando: TocandoAgoraPronuncia | undefined): FaixaParaLetra | null {
  if (!tocando?.temItem || tocando.tipo !== 'track' || !tocando.codigoFaixa || !tocando.nome) {
    return null
  }
  const artista = tocando.artistas[0]
  if (!artista) return null
  return {
    codigoFaixa: tocando.codigoFaixa,
    titulo: tocando.nome,
    artista,
    album: tocando.album,
    duracaoMs: tocando.duracaoMs,
  }
}

export function useLetraMusica(faixa: FaixaParaLetra | null) {
  return useQuery({
    queryKey: PRONUNCIA_QUERY_KEYS.letra(faixa?.codigoFaixa ?? ''),
    queryFn: () => obterLetraMusica(faixa as FaixaParaLetra),
    enabled: faixa !== null,
    staleTime: LETRA_FRESCA_MS,
    retry: 1,
  })
}

export function useTraduzirLetra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: traduzirLetraMusica,
    onSuccess: (letra) => {
      queryClient.setQueryData(PRONUNCIA_QUERY_KEYS.letra(letra.codigoFaixa), letra)
      queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.painel })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível traduzir a letra',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function posicaoAtualMs(
  tocando: TocandoAgoraPronuncia | undefined,
  ajusteMs: number
): number {
  if (!tocando?.temItem) return 0
  const decorrido = tocando.emReproducao ? Date.now() - tocando.consultadoEm : 0
  return Math.max(0, Math.min(tocando.duracaoMs, tocando.progressoMs + decorrido + ajusteMs))
}
