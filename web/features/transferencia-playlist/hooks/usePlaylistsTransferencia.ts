import { addToast } from '@/shared/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmarPreviaTransferencia,
  detectarParesPlaylists,
  executarTransferencia,
  iniciarTransferencia,
  listarPlaylistsServico,
  listarVinculosPlaylists,
  obterDetalheTransferencia,
  sincronizarVinculoPlaylist,
} from '../api'
import type { ConfirmarPreviaPayload, IniciarTransferenciaPayload, ServicoPlaylist } from '../types'
import { deveRefetchDetalhe, extrairMensagemErroApi } from '../utils'
import { CHAVES_QUERY_TRANSFERENCIA_PLAYLIST } from './chavesQueryTransferenciaPlaylist'

export function useListarPlaylistsServico(servico: ServicoPlaylist | null, enabled = true) {
  return useQuery({
    queryKey: CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.playlistsServico(servico ?? 'spotify'),
    queryFn: () => {
      if (!servico) throw new Error('Serviço não informado')
      return listarPlaylistsServico(servico)
    },
    enabled: Boolean(servico) && enabled,
    staleTime: 30_000,
  })
}

export function useDetectarPares(enabled = true) {
  return useQuery({
    queryKey: CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.pares,
    queryFn: detectarParesPlaylists,
    enabled,
    staleTime: 30_000,
  })
}

export function useIniciarTransferencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: IniciarTransferenciaPayload) => iniciarTransferencia(payload),
    onSuccess: (resumo) => {
      queryClient.setQueryData(CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.detalhe(resumo.uuid), {
        ...resumo,
        playlists: [],
        itens: [],
      })
      addToast({
        title: 'Transferência iniciada',
        description: 'Casando faixas entre as playlists selecionadas.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao iniciar',
        description: extrairMensagemErroApi(erro, 'Não foi possível iniciar a transferência.'),
        type: 'error',
      })
    },
  })
}

export function useDetalheTransferencia(uuid: string | null) {
  return useQuery({
    queryKey: CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.detalhe(uuid ?? ''),
    queryFn: () => {
      if (!uuid) throw new Error('Transferência não informada')
      return obterDetalheTransferencia(uuid)
    },
    enabled: Boolean(uuid),
    refetchInterval: (query) => deveRefetchDetalhe(query.state.data?.status),
  })
}

export function useConfirmarPrevia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: ConfirmarPreviaPayload }) =>
      confirmarPreviaTransferencia(uuid, payload),
    onSuccess: (detalhe) => {
      queryClient.setQueryData(CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.detalhe(detalhe.uuid), detalhe)
      addToast({
        title: 'Prévia confirmada',
        description: 'Iniciando a transferência das faixas aceitas.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao confirmar prévia',
        description: extrairMensagemErroApi(erro, 'Não foi possível confirmar a prévia.'),
        type: 'error',
      })
    },
  })
}

export function useExecutarTransferencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => executarTransferencia(uuid),
    onSuccess: (resumo) => {
      queryClient.invalidateQueries({
        queryKey: CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.detalhe(resumo.uuid),
      })
      queryClient.invalidateQueries({ queryKey: CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.vinculos })
      addToast({
        title: 'Transferência em andamento',
        description: 'As faixas estão sendo enviadas para o destino.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao executar',
        description: extrairMensagemErroApi(erro, 'Não foi possível executar a transferência.'),
        type: 'error',
      })
    },
  })
}

export function useListarVinculos() {
  return useQuery({
    queryKey: CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.vinculos,
    queryFn: listarVinculosPlaylists,
    staleTime: 30_000,
  })
}

export function useSincronizarVinculo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, force = false }: { uuid: string; force?: boolean }) =>
      sincronizarVinculoPlaylist(uuid, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.vinculos })
      addToast({
        title: 'Sincronização enfileirada',
        description: 'O vínculo será sincronizado em segundo plano.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao sincronizar',
        description: extrairMensagemErroApi(erro, 'Não foi possível sincronizar o vínculo.'),
        type: 'error',
      })
    },
  })
}
