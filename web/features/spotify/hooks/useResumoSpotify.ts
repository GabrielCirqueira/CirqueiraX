import { useQuery } from '@tanstack/react-query'
import { obterResumoSpotify } from '../api'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useResumoSpotify(habilitado = true) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.resumo,
    queryFn: obterResumoSpotify,
    enabled: habilitado,
    staleTime: 60_000,
  })
}
