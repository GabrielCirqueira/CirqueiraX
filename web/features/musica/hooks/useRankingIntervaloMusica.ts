import { useQuery } from '@tanstack/react-query'
import { type FiltroIntervaloRankingParams, obterRankingIntervaloMusica } from '../api'
import { MUSICA_QUERY_KEYS } from './chavesQueryMusica'
import { useFonteMusica } from './useFonteMusica'

export function useRankingIntervaloMusica(params: FiltroIntervaloRankingParams, habilitado = true) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.rankingIntervalo(fonte, params),
    queryFn: () => obterRankingIntervaloMusica(params, fonte),
    enabled: habilitado,
    staleTime: 60_000,
  })
}
