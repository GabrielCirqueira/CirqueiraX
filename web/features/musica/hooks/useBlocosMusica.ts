import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { obterBlocoMusica } from '../api'
import type {
  ComparativoServicosMusica,
  FiltroBlocoMusica,
  PaginaUltimasOuvidas,
  VisaoGeralMusica,
} from '../typesBlocos'
import { useFonteMusica } from './useFonteMusica'

const VALIDADE_BLOCO_MS = 60_000
const ITENS_POR_PAGINA_ULTIMAS = 60

type ParametrosBloco = Record<string, string | number | undefined>

export function useBlocoMusica<T>(caminho: string, habilitado: boolean, params?: ParametrosBloco) {
  const { fonte } = useFonteMusica()

  return useQuery({
    queryKey: ['musica', fonte, 'bloco', caminho, params],
    queryFn: () => obterBlocoMusica<T>(caminho, { fonte, ...params }),
    enabled: habilitado,
    staleTime: VALIDADE_BLOCO_MS,
    placeholderData: keepPreviousData,
  })
}

export function useVisaoGeralMusica(filtro: FiltroBlocoMusica, habilitado: boolean) {
  return useBlocoMusica<VisaoGeralMusica>('visao-geral', habilitado, { ...filtro })
}

export function useServicosMusica(habilitado: boolean) {
  return useBlocoMusica<ComparativoServicosMusica>('servicos', habilitado)
}

export function useUltimasOuvidasMusica(habilitado: boolean, limite = ITENS_POR_PAGINA_ULTIMAS) {
  const { fonte } = useFonteMusica()

  return useInfiniteQuery({
    queryKey: ['musica', fonte, 'bloco', 'ultimas-ouvidas', limite],
    queryFn: ({ pageParam }) =>
      obterBlocoMusica<PaginaUltimasOuvidas>('ultimas-ouvidas', {
        fonte,
        limite,
        antes: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (pagina) => pagina.proximoCursor,
    enabled: habilitado,
    staleTime: VALIDADE_BLOCO_MS,
  })
}
