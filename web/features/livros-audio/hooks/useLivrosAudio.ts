import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  apagarLivroAudio,
  fazerUploadLivroAudio,
  listarLivrosAudio,
  obterLivroAudio,
  salvarPosicaoLivroAudio,
} from '../api'
import type { SalvarPosicaoLivro, UploadLivroAudioPayload } from '../types'

export const LIVROS_AUDIO_QUERY_KEY = ['livros-audio'] as const

function extrairMensagemErro(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as { error?: string } | undefined
    return corpo?.error || padrao
  }
  return padrao
}

export function useLivrosAudio() {
  return useQuery({
    queryKey: LIVROS_AUDIO_QUERY_KEY,
    queryFn: listarLivrosAudio,
    refetchInterval: (query) =>
      query.state.data?.some((livro) => livro.isEmProcessamento) ? 3000 : false,
    refetchIntervalInBackground: false,
  })
}

export function useLivroAudio(uuid: string) {
  return useQuery({
    queryKey: [...LIVROS_AUDIO_QUERY_KEY, uuid],
    queryFn: () => obterLivroAudio(uuid),
    enabled: Boolean(uuid),
    refetchInterval: (query) => (query.state.data?.isEmProcessamento ? 3000 : false),
  })
}

export function useUploadLivroAudio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UploadLivroAudioPayload) => fazerUploadLivroAudio(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIVROS_AUDIO_QUERY_KEY })
      addToast({
        title: 'Upload concluído',
        description: 'O livro em PDF foi recebido e entrou na fila de processamento.',
        type: 'success',
      })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível enviar o livro',
        description: extrairMensagemErro(erro, 'Verifique o formato PDF e tente novamente.'),
        type: 'error',
      })
    },
  })
}

export function useSalvarPosicaoLivroAudio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, posicao }: { uuid: string; posicao: SalvarPosicaoLivro }) =>
      salvarPosicaoLivroAudio(uuid, posicao),
    onSuccess: (livroAtualizado) => {
      queryClient.invalidateQueries({ queryKey: LIVROS_AUDIO_QUERY_KEY })
      queryClient.setQueryData([...LIVROS_AUDIO_QUERY_KEY, livroAtualizado.uuid], livroAtualizado)
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível salvar o marcador',
        description: extrairMensagemErro(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useApagarLivroAudio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => apagarLivroAudio(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIVROS_AUDIO_QUERY_KEY })
      addToast({
        title: 'Livro apagado',
        description: 'O livro e os dados de áudio foram excluídos.',
        type: 'success',
      })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível excluir',
        description: extrairMensagemErro(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}
