import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelarClassificacaoImportacaoYoutube, confirmarImportacaoYoutube } from '../api'
import type { ImportacaoYoutube } from '../types'
import { extrairMensagemErroApi } from '../utils'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

function useAtualizarImportacao() {
  const queryClient = useQueryClient()
  return (importacao: ImportacaoYoutube) =>
    queryClient.setQueryData(YOUTUBE_MUSIC_QUERY_KEYS.importacao(importacao.uuid), importacao)
}

export function useConfirmarImportacaoYoutube() {
  const atualizar = useAtualizarImportacao()

  return useMutation({
    mutationFn: (uuid: string) => confirmarImportacaoYoutube(uuid),
    onSuccess: atualizar,
    onError: (erro: unknown) => {
      addToast({
        title: 'Não foi possível confirmar',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useCancelarClassificacaoYoutube() {
  const atualizar = useAtualizarImportacao()

  return useMutation({
    mutationFn: (uuid: string) => cancelarClassificacaoImportacaoYoutube(uuid),
    onSuccess: (importacao) => {
      atualizar(importacao)
      addToast({
        title: 'Classificação pela IA cancelada',
        description: 'Os vídeos ficam na fila de revisão para você decidir.',
        type: 'info',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Não foi possível cancelar',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}
