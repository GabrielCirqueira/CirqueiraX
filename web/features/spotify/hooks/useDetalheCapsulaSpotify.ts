import { useQuery } from '@tanstack/react-query'
import { obterCapsulaSpotify } from '../api'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useDetalheCapsulaSpotify(
  ano: number | null,
  mes: number | null,
  habilitado = true
) {
  const podeBuscar =
    habilitado && ano !== null && mes !== null && ano > 2000 && mes >= 1 && mes <= 12

  return useQuery({
    queryKey: podeBuscar
      ? SPOTIFY_QUERY_KEYS.capsulaDetalhe(ano, mes)
      : ['spotify', 'capsula', 0, 0],
    queryFn: () => {
      if (!podeBuscar || ano === null || mes === null) {
        throw new Error('Parâmetros de cápsula inválidos')
      }
      return obterCapsulaSpotify(ano, mes)
    },
    enabled: podeBuscar,
    staleTime: 60_000,
  })
}
