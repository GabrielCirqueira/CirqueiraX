import { addToast } from '@/shared/components/ui/toaster'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apagarAudio, listarAudios, rebaixarAudio, solicitarDownloadAudio } from '../api'
import type { ResultadoSolicitacaoAudios } from '../types'
import {
  AUDIOS_POR_PAGINA,
  INTERVALO_ATUALIZACAO_AUDIOS_MS,
  extrairMensagemErroApi,
  isPaginaComAudioEmProcessamento,
} from '../utils/audios'

export const AUDIOS_QUERY_KEY = ['audios'] as const

export function useAudios(pagina: number) {
  return useQuery({
    queryKey: [...AUDIOS_QUERY_KEY, pagina],
    queryFn: () => listarAudios(pagina, AUDIOS_POR_PAGINA),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      isPaginaComAudioEmProcessamento(query.state.data) ? INTERVALO_ATUALIZACAO_AUDIOS_MS : false,
    refetchIntervalInBackground: false,
  })
}

async function solicitarVarios(urls: string[]): Promise<ResultadoSolicitacaoAudios> {
  const resultados = await Promise.allSettled(urls.map(solicitarDownloadAudio))
  const falhas = resultados.flatMap((resultado) =>
    resultado.status === 'rejected'
      ? [extrairMensagemErroApi(resultado.reason, 'Não foi possível enfileirar o link.')]
      : []
  )
  return { enfileirados: resultados.length - falhas.length, falhas }
}

export function useSolicitarDownloadAudio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: solicitarVarios,
    onSuccess: ({ enfileirados, falhas }) => {
      queryClient.invalidateQueries({ queryKey: AUDIOS_QUERY_KEY })
      if (enfileirados > 0) {
        addToast({
          title: enfileirados === 1 ? 'Áudio na fila' : `${enfileirados} áudios na fila`,
          description: 'A conversão para MP3 começa em instantes.',
          type: 'success',
        })
      }
      if (falhas.length > 0) {
        addToast({ title: 'Link recusado', description: falhas[0], type: 'error' })
      }
    },
  })
}

export function useRebaixarAudio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rebaixarAudio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIOS_QUERY_KEY })
      addToast({
        title: 'Baixando de novo',
        description: 'O MP3 volta a ficar disponível por 7 dias.',
        type: 'success',
      })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível baixar de novo',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useApagarAudio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apagarAudio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIOS_QUERY_KEY })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível remover',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}
