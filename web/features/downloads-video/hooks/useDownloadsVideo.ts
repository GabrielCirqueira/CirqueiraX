import { toast } from '@heroui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apagarLote,
  atualizarMetadata,
  categorizarLote,
  classificarCategoriaIndividual,
  criarPedidoDownload,
  detalharMediaItem,
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
      toast.success(`Download de ${res.plataformaDescricao} iniciado!`)
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao iniciar download. Verifique a URL informada.')
    },
  })
}

export function useCategorizarLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CategorizarLoteInput) => categorizarLote(input),
    onSuccess: (itens) => {
      toast.success(
        `${itens.length} ${itens.length === 1 ? 'item categorizado' : 'itens categorizados'} com sucesso!`
      )
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao categorizar itens em lote.')
    },
  })
}

export function useClassificarIndividual() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, categoriaId }: { uuid: string; categoriaId: string }) =>
      classificarCategoriaIndividual(uuid, categoriaId),
    onSuccess: () => {
      toast.success('Categoria vinculada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao categorizar o vídeo.')
    },
  })
}

export function useRebaixarLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RebaixarLoteInput) => rebaixarLote(input),
    onSuccess: (itens) => {
      toast.success(`${itens.length} download(s) reenfileirado(s)!`)
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao rebaixar itens selecionados.')
    },
  })
}

export function useApagarLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ApagarLoteInput) => apagarLote(input),
    onSuccess: (res) => {
      toast.success(
        `${res.total} ${res.total === 1 ? 'arquivo apagado' : 'arquivos apagados'} com sucesso!`
      )
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao apagar arquivos.')
    },
  })
}

export function useAtualizarMetadata() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: AtualizarMetadataInput }) =>
      atualizarMetadata(uuid, input),
    onSuccess: () => {
      toast.success('Metadados atualizados!')
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao atualizar metadados.')
    },
  })
}

export function useRetentarMediaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => retentarMediaItem(uuid),
    onSuccess: () => {
      toast.success('Processamento reenfileirado!')
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao retentar item.')
    },
  })
}

export function useRetentarTodos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => retentarTodos(),
    onSuccess: (itens) => {
      toast.success(`${itens.length} item(ns) com erro reenfileirados!`)
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao reenfileirar itens com erro.')
    },
  })
}
