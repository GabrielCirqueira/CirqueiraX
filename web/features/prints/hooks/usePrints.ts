import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apagarLotePrints,
  apagarPrint,
  categorizarLotePrints,
  categorizarPrint,
  listarCategorias,
  listarPrints,
} from '../api'
import type { FiltrosPrints } from '../types'

export const PRINTS_QUERY_KEYS = {
  todos: ['prints'] as const,
  lista: (filtros: FiltrosPrints) => ['prints', 'lista', filtros] as const,
  categorias: ['categorias'] as const,
}

export function useCategorias() {
  return useQuery({
    queryKey: PRINTS_QUERY_KEYS.categorias,
    queryFn: () => listarCategorias(),
    staleTime: 1000 * 60 * 5,
  })
}

export function usePrints(filtros: FiltrosPrints = {}) {
  return useQuery({
    queryKey: PRINTS_QUERY_KEYS.lista(filtros),
    queryFn: () => listarPrints(filtros),
    refetchInterval: 5000,
  })
}

export function useCategorizarPrint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, categoriaId }: { uuid: string; categoriaId: string }) =>
      categorizarPrint(uuid, categoriaId),
    onSuccess: () => {
      addToast({ title: 'Print categorizado com sucesso!', color: 'success' })
      queryClient.invalidateQueries({ queryKey: PRINTS_QUERY_KEYS.todos })
    },
    onError: () => {
      addToast({ title: 'Falha ao categorizar print.', color: 'danger' })
    },
  })
}

export function useCategorizarLotePrints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuids, categoriaId }: { uuids: string[]; categoriaId: string }) =>
      categorizarLotePrints(uuids, categoriaId),
    onSuccess: (_, { uuids }) => {
      addToast({
        title: `${uuids.length} prints categorizados com sucesso!`,
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: PRINTS_QUERY_KEYS.todos })
    },
    onError: () => {
      addToast({ title: 'Falha ao categorizar prints em lote.', color: 'danger' })
    },
  })
}

export function useApagarPrint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => apagarPrint(uuid),
    onSuccess: () => {
      addToast({ title: 'Print removido com sucesso!', color: 'success' })
      queryClient.invalidateQueries({ queryKey: PRINTS_QUERY_KEYS.todos })
    },
    onError: () => {
      addToast({ title: 'Falha ao remover print.', color: 'danger' })
    },
  })
}

export function useApagarLotePrints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuids: string[]) => apagarLotePrints(uuids),
    onSuccess: (_, uuids) => {
      addToast({
        title: `${uuids.length} prints removidos com sucesso!`,
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: PRINTS_QUERY_KEYS.todos })
    },
    onError: () => {
      addToast({ title: 'Falha ao remover prints em lote.', color: 'danger' })
    },
  })
}
