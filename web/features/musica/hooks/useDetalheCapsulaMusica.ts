import { useQuery } from '@tanstack/react-query'
import { obterCapsulaMusica } from '../api'
import { MUSICA_QUERY_KEYS } from './chavesQueryMusica'
import { useFonteMusica } from './useFonteMusica'

export function useDetalheCapsulaMusica(ano: number | null, mes: number | null, habilitado = true) {
  const { fonte } = useFonteMusica()
  const podeBuscar =
    habilitado && ano !== null && mes !== null && ano > 2000 && mes >= 1 && mes <= 12

  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.capsulaDetalhe(fonte, ano ?? 0, mes ?? 0),
    queryFn: () => {
      if (!podeBuscar || ano === null || mes === null) {
        throw new Error('Parâmetros de cápsula inválidos')
      }
      return obterCapsulaMusica(ano, mes, fonte)
    },
    enabled: podeBuscar,
    staleTime: 60_000,
  })
}
