import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apagarLoteMidias,
  apagarMidia,
  categorizarLoteMidias,
  categorizarMidia,
  listarCategorias,
  listarMidiasCentral,
  obterContagensMidias,
} from '../api'
import type { FiltrosCentralMidias } from '../types'

export const CHAVE_CENTRAL_MIDIAS = ['central-midias']
export const CHAVE_CATEGORIAS = ['categorias']
export const CHAVE_CONTAGENS = ['central-midias', 'contagens']

export function useCentralMidias(filtros: FiltrosCentralMidias = {}) {
  return useQuery({
    queryKey: [...CHAVE_CENTRAL_MIDIAS, filtros],
    queryFn: () => listarMidiasCentral(filtros),
    staleTime: 1000 * 30,
  })
}

export function useContagensMidias() {
  return useQuery({
    queryKey: CHAVE_CONTAGENS,
    queryFn: obterContagensMidias,
    staleTime: 1000 * 15,
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: CHAVE_CATEGORIAS,
    queryFn: listarCategorias,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCategorizarMidia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, categoriaId }: { uuid: string; categoriaId: string }) =>
      categorizarMidia(uuid, categoriaId),
    onSuccess: () => {
      addToast({
        title: 'Categoria atualizada com sucesso!',
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: CHAVE_CENTRAL_MIDIAS })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({
        title: 'Falha ao atualizar categoria.',
        color: 'danger',
      })
    },
  })
}

export function useCategorizarLoteMidias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuids, categoriaId }: { uuids: string[]; categoriaId: string }) =>
      categorizarLoteMidias(uuids, categoriaId),
    onSuccess: (itens) => {
      addToast({
        title: `${itens.length} mídia(s) categorizada(s) com sucesso!`,
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: CHAVE_CENTRAL_MIDIAS })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({
        title: 'Falha ao categorizar mídias em lote.',
        color: 'danger',
      })
    },
  })
}

export function useApagarMidia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => apagarMidia(uuid),
    onSuccess: () => {
      addToast({
        title: 'Mídia removida com sucesso.',
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: CHAVE_CENTRAL_MIDIAS })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
      queryClient.invalidateQueries({ queryKey: CHAVE_CONTAGENS })
    },
    onError: () => {
      addToast({
        title: 'Falha ao remover mídia.',
        color: 'danger',
      })
    },
  })
}

export function useApagarLoteMidias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuids: string[]) => apagarLoteMidias(uuids),
    onSuccess: (_, uuids) => {
      addToast({
        title: `${uuids.length} mídia(s) removida(s) com sucesso.`,
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: CHAVE_CENTRAL_MIDIAS })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
      queryClient.invalidateQueries({ queryKey: CHAVE_CONTAGENS })
    },
    onError: () => {
      addToast({
        title: 'Falha ao remover mídias em lote.',
        color: 'danger',
      })
    },
  })
}
