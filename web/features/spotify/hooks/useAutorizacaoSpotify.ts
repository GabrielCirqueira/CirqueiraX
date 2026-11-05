import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { concluirAutorizacaoSpotify, obterUrlAutorizacaoSpotify } from '../api'
import type { ConcluirAutorizacaoSpotifyPayload } from '../types'
import { extrairMensagemErroApi } from '../utils'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useObterUrlAutorizacaoSpotify() {
  return useMutation({
    mutationFn: obterUrlAutorizacaoSpotify,
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao iniciar autenticação',
        description: extrairMensagemErroApi(erro, 'Não foi possível obter a URL do Spotify.'),
        type: 'error',
      })
    },
  })
}

export function useConcluirAutorizacaoSpotify() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ConcluirAutorizacaoSpotifyPayload) => concluirAutorizacaoSpotify(payload),
    onSuccess: (status) => {
      queryClient.setQueryData(SPOTIFY_QUERY_KEYS.status, status)
      queryClient.invalidateQueries({ queryKey: ['spotify'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      addToast({
        title: 'Spotify conectado!',
        description: status.nomeExibicao
          ? `Conta ${status.nomeExibicao} sincronizada com sucesso.`
          : 'Sua conta Spotify foi conectada.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Erro na conexão',
        description: extrairMensagemErroApi(erro, 'Falha ao concluir a autorização com o Spotify.'),
        type: 'error',
      })
    },
  })
}
