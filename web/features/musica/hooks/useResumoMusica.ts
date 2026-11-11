import { useQuery } from '@tanstack/react-query'
import { obterResumoMusica } from '../api'
import { MUSICA_QUERY_KEYS } from './chavesQueryMusica'
import { useFonteMusica } from './useFonteMusica'

export function useResumoMusica(habilitado = true) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.resumo(fonte),
    queryFn: () => obterResumoMusica(fonte),
    enabled: habilitado,
    staleTime: 60_000,
  })
}
