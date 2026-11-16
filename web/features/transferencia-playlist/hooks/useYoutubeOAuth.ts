import { addToast } from '@/shared/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  concluirYoutubeOAuth,
  desconectarYoutubeOAuth,
  obterStatusYoutubeOAuth,
  obterUrlYoutubeOAuth,
} from '../api'
import { extrairMensagemErroApi } from '../utils'
import { CHAVES_QUERY_TRANSFERENCIA_PLAYLIST } from './chavesQueryTransferenciaPlaylist'

export function useStatusYoutubeOAuth() {
  return useQuery({
    queryKey: CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.youtubeOAuthStatus,
    queryFn: obterStatusYoutubeOAuth,
    staleTime: 30_000,
  })
}

export function useObterUrlYoutubeOAuth() {
  return useMutation({
    mutationFn: obterUrlYoutubeOAuth,
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao iniciar autenticação',
        description: extrairMensagemErroApi(
          erro,
          'Não foi possível obter a URL de autorização do Google.'
        ),
        type: 'error',
      })
    },
  })
}

export function useConcluirYoutubeOAuth() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => concluirYoutubeOAuth(code),
    onSuccess: (status) => {
      queryClient.setQueryData(CHAVES_QUERY_TRANSFERENCIA_PLAYLIST.youtubeOAuthStatus, status)
      queryClient.invalidateQueries({ queryKey: ['youtube-oauth'] })
      queryClient.invalidateQueries({ queryKey: ['transferencia-playlist'] })
      addToast({
        title: 'Conta Google conectada',
        description: status.email
          ? `Conta ${status.email} autorizada para playlists.`
          : 'Autorização YouTube concluída.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Erro na conexão',
        description: extrairMensagemErroApi(erro, 'Falha ao concluir a autorização com o Google.'),
        type: 'error',
      })
    },
  })
}

export function useDesconectarYoutubeOAuth() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: desconectarYoutubeOAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-oauth'] })
      queryClient.invalidateQueries({ queryKey: ['transferencia-playlist'] })
      addToast({
        title: 'Conta Google desconectada',
        description: 'A autorização OAuth do YouTube foi removida.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao desconectar',
        description: extrairMensagemErroApi(erro, 'Não foi possível desconectar a conta Google.'),
        type: 'error',
      })
    },
  })
}
