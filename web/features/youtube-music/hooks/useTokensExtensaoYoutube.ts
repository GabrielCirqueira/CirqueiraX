import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  gerarTokenExtensaoYoutube,
  listarTokensExtensaoYoutube,
  revogarTokenExtensaoYoutube,
} from '../api'
import { extrairMensagemErroApi } from '../utils'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

export function useTokensExtensaoYoutube(habilitado: boolean) {
  return useQuery({
    queryKey: YOUTUBE_MUSIC_QUERY_KEYS.tokensExtensao,
    queryFn: listarTokensExtensaoYoutube,
    enabled: habilitado,
    staleTime: 30_000,
  })
}

export function useGerarTokenExtensaoYoutube() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: gerarTokenExtensaoYoutube,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.tokensExtensao })
      queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.status })
      addToast({
        title: 'Token gerado',
        description: 'Copie agora e cole na extensão. Ele não aparece de novo.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Não foi possível gerar o token',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useRevogarTokenExtensaoYoutube() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revogarTokenExtensaoYoutube,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.tokensExtensao })
      queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.status })
      addToast({
        title: 'Aparelho removido',
        description: 'A extensão desse aparelho não envia mais nada.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Não foi possível remover',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useCopiarTokenExtensao() {
  return useMutation({
    mutationFn: (token: string) => navigator.clipboard.writeText(token),
    onSuccess: () => addToast({ title: 'Token copiado', type: 'success' }),
    onError: () =>
      addToast({
        title: 'Não foi possível copiar',
        description: 'Selecione o token e copie manualmente.',
        type: 'error',
      }),
  })
}
