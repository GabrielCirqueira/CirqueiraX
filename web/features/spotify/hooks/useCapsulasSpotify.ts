import { useQuery } from '@tanstack/react-query'
import { listarCapsulasSpotify } from '../api'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useCapsulasSpotify(habilitado = true) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.capsulasMeses,
    queryFn: listarCapsulasSpotify,
    enabled: habilitado,
    staleTime: 60_000,
  })
}
