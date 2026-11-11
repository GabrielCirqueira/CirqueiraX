import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consultarImportacaoYoutube, iniciarImportacaoYoutube } from '../api'
import { extrairMensagemErroApi, intervaloConsultaImportacao } from '../utils'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

export function useIniciarImportacaoYoutube() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (arquivo: File) => iniciarImportacaoYoutube(arquivo),
    onSuccess: (importacao) => {
      queryClient.setQueryData(YOUTUBE_MUSIC_QUERY_KEYS.importacao(importacao.uuid), importacao)
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
      if (resultado.status === 'concluida') {
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
