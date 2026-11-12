import { addToast } from '@/shared/components/ui/toaster'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  consultarImportacaoYoutube,
  iniciarImportacaoYoutube,
  listarImportacoesYoutube,
  marcarRelatorioVistoImportacaoYoutube,
} from '../api'
import type { ListaImportacoesYoutubeDados } from '../types'
import {
  extrairMensagemErroApi,
  intervaloConsultaImportacao,
  intervaloConsultaImportacoes,
} from '../utils'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

export function useIniciarImportacaoYoutube() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (arquivo: File) => iniciarImportacaoYoutube(arquivo),
    onSuccess: (importacao) => {
      queryClient.setQueryData(YOUTUBE_MUSIC_QUERY_KEYS.importacao(importacao.uuid), importacao)
      queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.importacoes })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha no envio do arquivo',
        description: extrairMensagemErroApi(
          erro,
          'Envie o .zip do Google Takeout ou o arquivo de histórico em JSON.'
        ),
        type: 'error',
      })
    },
  })
}

export function useImportacaoYoutube(uuid: string | null) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: YOUTUBE_MUSIC_QUERY_KEYS.importacao(uuid ?? ''),
    queryFn: async () => {
      if (!uuid) throw new Error('Importação não informada')
      const resultado = await consultarImportacaoYoutube(uuid)
      if (resultado.status === 'concluida' && !resultado.relatorioVistoEm) {
        await marcarRelatorioVistoImportacaoYoutube(uuid)
      }
      if (resultado.status === 'concluida') {
        queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.importacoes })
        queryClient.invalidateQueries({ queryKey: ['musica'] })
        queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.status })
        queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.resumoIdentificacao })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
      return resultado
    },
    enabled: Boolean(uuid),
    refetchInterval: (query) => intervaloConsultaImportacao(query.state.data),
  })
}

export function useImportacoesYoutube() {
  const autenticado = useAuthStore((s) => s.autenticado)

  return useQuery({
    queryKey: YOUTUBE_MUSIC_QUERY_KEYS.importacoes,
    queryFn: listarImportacoesYoutube,
    enabled: autenticado,
    refetchInterval: (query) => intervaloConsultaImportacoes(query.state.data),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useMarcarRelatorioVistoImportacaoYoutube() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => marcarRelatorioVistoImportacaoYoutube(uuid),
    onMutate: async (uuid) => {
      await queryClient.cancelQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.importacoes })
      const anterior = queryClient.getQueryData<ListaImportacoesYoutubeDados>(
        YOUTUBE_MUSIC_QUERY_KEYS.importacoes
      )
      queryClient.setQueryData<ListaImportacoesYoutubeDados>(
        YOUTUBE_MUSIC_QUERY_KEYS.importacoes,
        (lista) =>
          lista
            ? {
                ...lista,
                relatoriosNaoVistos: lista.relatoriosNaoVistos.filter((item) => item.uuid !== uuid),
              }
            : lista
      )
      return { anterior }
    },
    onError: (_erro, _uuid, contexto) => {
      queryClient.setQueryData(YOUTUBE_MUSIC_QUERY_KEYS.importacoes, contexto?.anterior)
      addToast({ title: 'Não foi possível fechar o relatório da importação.', type: 'error' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.importacoes })
    },
  })
}
