import { addToast, toaster } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apagarLote,
  atualizarMetadata,
  categorizarLote,
  classificarCategoriaIndividual,
  criarPedidoDownload,
  detalharMediaItem,
  distribuirHorariosLote,
  listarCategorias,
  listarMediaItens,
  rebaixarIndividual,
  rebaixarLote,
  removerCategoriaLote,
  retentarMediaItem,
  retentarTodos,
  forcarSincronizacaoGoogleFotos,
} from '../api'
import type {
  ApagarLoteInput,
  AtualizarMetadataInput,
  CategorizarLoteInput,
  DistribuirHorariosLoteInput,
  FiltrosMediaItem,
  PedidoDownloadInput,
  RebaixarLoteInput,
  RemoverCategoriaLoteInput,
} from '../types'
import { montarAvisoRemocaoCategoria } from '../utils/remocaoCategoria'

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
        ['baixando', 'recebido', 'distribuindo', 'enviando_google_fotos'].includes(item.status)
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

function extrairMensagemErroApi(erro: unknown, padrao: string): string {
  if (
    typeof erro === 'object' &&
    erro !== null &&
    'response' in erro &&
    typeof (erro as { response?: { data?: { error?: unknown; message?: unknown } } }).response?.data === 'object'
  ) {
    const data = (erro as { response?: { data?: { error?: unknown; message?: unknown } } }).response?.data
    if (typeof data?.error === 'string' && data.error.trim().length > 0) {
      return data.error
    }
    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      return data.message
    }
  }
  if (erro instanceof Error && erro.message.trim().length > 0) {
    return erro.message
  }
  return padrao
}

export function useRebaixarLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RebaixarLoteInput) => rebaixarLote(input),
    onMutate: (input) => {
      const individual = input.uuids.length === 1
      const toastId = toaster.create({
        title: individual
          ? 'Baixando o vídeo novamente...'
          : `Enfileirando ${input.uuids.length} vídeos para download...`,
        description: individual
          ? 'Isso pode levar alguns minutos. O card mostra o status enquanto o download acontece.'
          : undefined,
        type: 'loading',
        duration: Number.POSITIVE_INFINITY,
      })
      // O backend grava o status "baixando" antes de iniciar o download; o refetch faz o card mostrá-lo
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['media-itens'] }), 800)
      return { toastId }
    },
    onSuccess: (itens) => {
      addToast({
        title:
          itens.length === 1
            ? 'Vídeo baixado novamente e restaurado com sucesso!'
            : `${itens.length} vídeos enfileirados para download. O status é atualizado nos cards.`,
        color: 'success',
      })
    },
    onError: (erro) => {
      addToast({
        title: extrairMensagemErroApi(erro, 'Falha ao rebaixar itens selecionados.'),
        color: 'danger',
        duration: 8000,
      })
    },
    onSettled: (_dados, _erro, _input, contexto) => {
      if (contexto?.toastId) {
        toaster.dismiss(contexto.toastId)
      }
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
  })
}

export function useRebaixarIndividual() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => rebaixarIndividual(uuid),
    onSuccess: () => {
      addToast({
        title: 'Vídeo baixado novamente e restaurado no servidor com sucesso!',
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: (erro) => {
      addToast({
        title: extrairMensagemErroApi(erro, 'Falha ao baixar o vídeo novamente.'),
        color: 'danger',
      })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
  })
}

export function useRemoverCategoriaLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RemoverCategoriaLoteInput) => removerCategoriaLote(input),
    onSuccess: (itens, input) => {
      addToast(montarAvisoRemocaoCategoria(itens.length, input.uuids.length))
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao remover a categoria dos vídeos.', color: 'danger' })
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

export function useDistribuirHorariosLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DistribuirHorariosLoteInput) => distribuirHorariosLote(input),
    onSuccess: (_, variables) => {
      addToast({
        title: `${variables.itens.length} horários distribuídos com sucesso!`,
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao distribuir horários em lote.', color: 'danger' })
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

export function useForcarGoogleFotos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, categoriaId }: { uuid: string; categoriaId?: string }) =>
      forcarSincronizacaoGoogleFotos(uuid, categoriaId),
    onSuccess: (item) => {
      addToast({
        title: item.isDuplicado
          ? 'Sincronização iniciada com o Google Fotos mesmo sendo duplicado!'
          : 'Sincronização com Google Fotos iniciada!',
        color: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao forçar envio para o Google Fotos.', color: 'danger' })
    },
  })
}

