import { useQuery } from '@tanstack/react-query'
import { obterStatusYoutubeMusic } from '../api'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

const INTERVALO_STATUS_MS = 60_000
const INTERVALO_TOCANDO_AGORA_MS = 20_000

export function useStatusYoutubeMusic() {
  return useQuery({
    queryKey: YOUTUBE_MUSIC_QUERY_KEYS.status,
    queryFn: obterStatusYoutubeMusic,
    staleTime: 30_000,
    refetchInterval: (consulta) =>
      consulta.state.data?.extensao?.tocandoAgora
        ? INTERVALO_TOCANDO_AGORA_MS
        : INTERVALO_STATUS_MS,
  })
}
