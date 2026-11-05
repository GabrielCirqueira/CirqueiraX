import { useQuery } from '@tanstack/react-query'
import { obterStatusSpotify } from '../api'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useStatusSpotify() {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.status,
    queryFn: obterStatusSpotify,
    staleTime: 30_000,
  })
}
