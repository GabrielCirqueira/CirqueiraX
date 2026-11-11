import { useQuery } from '@tanstack/react-query'
import { obterStatusYoutubeMusic } from '../api'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

const INTERVALO_STATUS_MS = 60_000

export function useStatusYoutubeMusic() {
  return useQuery({
    queryKey: YOUTUBE_MUSIC_QUERY_KEYS.status,
    queryFn: obterStatusYoutubeMusic,
    staleTime: 30_000,
    refetchInterval: INTERVALO_STATUS_MS,
  })
}
