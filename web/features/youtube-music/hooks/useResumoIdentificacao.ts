import { useQuery } from '@tanstack/react-query'
import { obterResumoIdentificacao } from '../api'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

export function useResumoIdentificacao() {
  return useQuery({
    queryKey: YOUTUBE_MUSIC_QUERY_KEYS.resumoIdentificacao,
    queryFn: obterResumoIdentificacao,
    staleTime: 60_000,
  })
}
