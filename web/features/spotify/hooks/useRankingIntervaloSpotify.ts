import { useQuery } from '@tanstack/react-query'
import { type FiltroIntervaloRankingParams, obterRankingIntervaloSpotify } from '../api'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useRankingIntervaloSpotify(
  params: FiltroIntervaloRankingParams,
  habilitado = true
) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.rankingIntervalo(params as unknown as Record<string, unknown>),
    queryFn: () => obterRankingIntervaloSpotify(params),
    enabled: habilitado,
    staleTime: 60_000,
  })
}
