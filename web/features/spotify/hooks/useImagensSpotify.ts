import { useQuery } from '@tanstack/react-query'
import { consultarImagensSpotify } from '../api'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useImagensSpotify(chavesFaltantes: string[]) {
  const chavesUnicas = Array.from(
    new Set(chavesFaltantes.filter((c) => c && c.trim().length > 0))
  ).sort()

  const habilitado = chavesUnicas.length > 0

  return useQuery({
    queryKey: [...SPOTIFY_QUERY_KEYS.imagens, ...chavesUnicas],
    queryFn: () => consultarImagensSpotify(chavesUnicas),
    enabled: habilitado,
    staleTime: 10_000,
    refetchInterval: (query) => {
      const mapa = query.state.data
      if (!mapa) {
        return 4_000
      }
      const existemPendentes = Object.values(mapa).some((item) => item.status === 'pendente')
      return existemPendentes ? 4_000 : false
    },
  })
}
