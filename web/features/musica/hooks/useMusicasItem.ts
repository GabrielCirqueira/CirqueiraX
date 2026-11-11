import { useQuery } from '@tanstack/react-query'
import { type FiltroMusicasItem, obterMusicasItem } from '../api'
import { MUSICA_QUERY_KEYS } from './chavesQueryMusica'
import { useFonteMusica } from './useFonteMusica'

export function useMusicasItem(filtro: FiltroMusicasItem, habilitado = false) {
  const { fonte } = useFonteMusica()
  const filtroSanitizado = { ...filtro, artista: filtro.artista.trim() }

  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.musicasItem(fonte, filtroSanitizado),
    queryFn: () => obterMusicasItem(filtroSanitizado, fonte),
    enabled: habilitado && filtroSanitizado.artista.length > 0,
    staleTime: 60_000,
  })
}
