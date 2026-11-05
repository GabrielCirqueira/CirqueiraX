import { useQuery } from '@tanstack/react-query'
import { obterTopMusicasArtista } from '../api'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useTopMusicasArtista(
  artista: string,
  ano?: number | null,
  mes?: number | null,
  habilitado = false
) {
  const artistaSanitizado = artista.trim()

  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.topMusicasArtista(artistaSanitizado, ano, mes),
    queryFn: () => obterTopMusicasArtista(artistaSanitizado, ano, mes),
    enabled: habilitado && artistaSanitizado.length > 0,
    staleTime: 60_000,
  })
}
