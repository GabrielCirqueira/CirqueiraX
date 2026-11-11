import { useQuery } from '@tanstack/react-query'
import { listarCapsulasMusica } from '../api'
import { MUSICA_QUERY_KEYS } from './chavesQueryMusica'
import { useFonteMusica } from './useFonteMusica'

export function useCapsulasMusica(habilitado = true) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.capsulasMeses(fonte),
    queryFn: () => listarCapsulasMusica(fonte),
    enabled: habilitado,
    staleTime: 60_000,
  })
}
