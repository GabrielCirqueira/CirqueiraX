import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apagarTranscricao, atualizarTranscricao, reprocessarTranscricao } from '../api'
import type { AtualizarTranscricaoPayload, IdiomaTranscricao } from '../types'
import { extrairMensagemErroApi } from '../utils'
import { TRANSCRICOES_QUERY_KEYS } from './chavesQueryTranscricoes'

export function useAtualizarTranscricao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: AtualizarTranscricaoPayload }) =>
      atualizarTranscricao(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSCRICOES_QUERY_KEYS.todas })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível salvar',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useReprocessarTranscricao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, idioma }: { uuid: string; idioma: IdiomaTranscricao | null }) =>
      reprocessarTranscricao(uuid, idioma),
    onSuccess: (transcricao) => {
      queryClient.invalidateQueries({ queryKey: TRANSCRICOES_QUERY_KEYS.todas })
      addToast({
        title: 'Transcrevendo de novo',
        description: `${transcricao.titulo} voltou para a fila.`,
        type: 'info',
      })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível transcrever de novo',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useApagarTranscricao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apagarTranscricao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSCRICOES_QUERY_KEYS.todas })
      addToast({ title: 'Transcrição apagada', type: 'info' })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível apagar',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}
