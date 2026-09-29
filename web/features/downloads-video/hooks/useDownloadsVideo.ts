import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apagarLote,
  atualizarMetadata,
  categorizarLote,
  classificarCategoriaIndividual,
  criarPedidoDownload,
  detalharMediaItem,
  listarCategorias,
  listarMediaItens,
  rebaixarLote,
  retentarMediaItem,
  retentarTodos,
} from '../api'
import type {
  ApagarLoteInput,
  AtualizarMetadataInput,
  CategorizarLoteInput,
  FiltrosMediaItem,
  PedidoDownloadInput,
  RebaixarLoteInput,
} from '../types'

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => listarCategorias(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useMediaItens(filtros: FiltrosMediaItem = {}) {
  return useQuery({
    queryKey: ['media-itens', filtros],
    queryFn: () => listarMediaItens(filtros),
    refetchInterval: (query) => {
      const temItensProcessando = query.state.data?.data.some((item) =>
        ['baixando', 'recebido', 'em_fila', 'distribuindo', 'enviando_google_fotos'].includes(
          item.status
        )
      )
      return temItensProcessando ? 3000 : false
    },
  })
}

export function useMediaItemDetalhe(uuid: string | null) {
  return useQuery({
    queryKey: ['media-item', uuid],
    queryFn: () => (uuid ? detalharMediaItem(uuid) : null),
    enabled: Boolean(uuid),
  })
}

export function useCriarDownload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PedidoDownloadInput) => criarPedidoDownload(input),
    onSuccess: (res) => {
      addToast({ title: `Download de ${res.plataformaDescricao} iniciado!`, color: 'success' })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao iniciar download. Verifique a URL informada.', color: 'danger' })
    },
  })
}

export function useCategorizarLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CategorizarLoteInput) => categorizarLote(input),
    onSuccess: (itens) => {
      addToast({
        title: `${itens.length} ${itens.length === 1 ? 'item categorizado' : 'itens categorizados'} com sucesso!`,
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao categorizar itens em lote.', color: 'danger' })
    },
  })
}

export function useClassificarIndividual() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, categoriaId }: { uuid: string; categoriaId: string }) =>
      classificarCategoriaIndividual(uuid, categoriaId),
    onSuccess: () => {
      addToast({ title: 'Categoria vinculada com sucesso!', color: 'success' })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao categorizar o vídeo.', color: 'danger' })
    },
  })
}

export function useRebaixarLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RebaixarLoteInput) => rebaixarLote(input),
    onSuccess: (itens) => {
      addToast({ title: `${itens.length} download(s) reenfileirado(s)!`, color: 'success' })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao rebaixar itens selecionados.', color: 'danger' })
    },
  })
}

export function useApagarLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ApagarLoteInput) => apagarLote(input),
    onSuccess: (res) => {
      addToast({
        title: `${res.total} ${res.total === 1 ? 'arquivo apagado' : 'arquivos apagados'} com sucesso!`,
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao apagar arquivos.', color: 'danger' })
    },
  })
}

export function useAtualizarMetadata() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: AtualizarMetadataInput }) =>
      atualizarMetadata(uuid, input),
    onSuccess: () => {
      addToast({ title: 'Metadados atualizados!', color: 'success' })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao atualizar metadados.', color: 'danger' })
    },
  })
}

export function useRetentarMediaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => retentarMediaItem(uuid),
    onSuccess: () => {
      addToast({ title: 'Processamento reenfileirado!', color: 'success' })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao retentar item.', color: 'danger' })
    },
  })
}

export function useRetentarTodos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => retentarTodos(),
    onSuccess: (itens) => {
      addToast({ title: `${itens.length} item(ns) com erro reenfileirados!`, color: 'success' })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao reenfileirar itens com erro.', color: 'danger' })
    },
  })
}
