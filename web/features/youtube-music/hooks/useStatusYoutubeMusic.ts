import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { obterStatusYoutubeMusic } from '../api'
import {
  lerTempoRealExtensao,
  tempoRealRecente,
  videoTempoRealDiferente,
} from '../utils/tempoRealExtensao'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'
import { useTocandoAgoraTempoReal } from './useTocandoAgoraTempoReal'

const INTERVALO_STATUS_MS = 60_000
const INTERVALO_TOCANDO_AGORA_MS = 10_000
const INTERVALO_ALCANCAR_EXTENSAO_MS = 2_000

export function useStatusYoutubeMusic() {
  const tempoReal = useTocandoAgoraTempoReal()
  const videoTempoReal = tempoRealRecente(tempoReal, Date.now())
    ? (tempoReal.estado?.videoId ?? null)
    : null

  return useQuery({
    queryKey: [...YOUTUBE_MUSIC_QUERY_KEYS.status, videoTempoReal],
    placeholderData: keepPreviousData,
    queryFn: obterStatusYoutubeMusic,
    staleTime: 5_000,
    refetchOnWindowFocus: 'always',
    refetchInterval: (consulta) => {
      const tocando = consulta.state.data?.extensao?.tocandoAgora
      if (videoTempoRealDiferente(lerTempoRealExtensao(), tocando?.videoId, Date.now()))
        return INTERVALO_ALCANCAR_EXTENSAO_MS
      return tocando ? INTERVALO_TOCANDO_AGORA_MS : INTERVALO_STATUS_MS
    },
  })
}
