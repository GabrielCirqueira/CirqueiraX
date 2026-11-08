import { useQuery } from '@tanstack/react-query'
import { type FiltroMusicasItemSpotify, obterMusicasItemSpotify } from '../api'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useMusicasItemSpotify(filtro: FiltroMusicasItemSpotify, habilitado = false) {
  const filtroSanitizado = { ...filtro, artista: filtro.artista.trim() }

  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.musicasItem(filtroSanitizado),
    queryFn: () => obterMusicasItemSpotify(filtroSanitizado),
    enabled: habilitado && filtroSanitizado.artista.length > 0,
    staleTime: 60_000,
  })
}
