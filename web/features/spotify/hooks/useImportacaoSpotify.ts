import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consultarImportacaoSpotify, iniciarImportacaoSpotify } from '../api'
import { extrairMensagemErroApi } from '../utils'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useIniciarImportacaoSpotify() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (arquivo: File) => iniciarImportacaoSpotify(arquivo),
    onSuccess: (importacao) => {
      queryClient.setQueryData(SPOTIFY_QUERY_KEYS.importacao(importacao.uuid), importacao)
      addToast({
        title: 'Arquivo enviado para importação',
        description: 'O processamento do histórico foi iniciado em segundo plano.',
        type: 'info',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha no upload do arquivo',
        description: extrairMensagemErroApi(
          erro,
          'Verifique se o arquivo é um JSON ou ZIP válido do histórico do Spotify.'
        ),
        type: 'error',
      })
    },
  })
}

export function useConsultarImportacaoSpotify(uuid: string | null, aoConcluir?: () => void) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: uuid ? SPOTIFY_QUERY_KEYS.importacao(uuid) : ['spotify', 'importacao', ''],
    queryFn: async () => {
      if (!uuid) {
        throw new Error('UUID de importação não informado')
      }
      const resultado = await consultarImportacaoSpotify(uuid)
      if (resultado.status === 'concluida') {
        queryClient.invalidateQueries({
          queryKey: ['spotify'],
          predicate: (consulta) => consulta.queryKey[1] !== 'importacao',
        })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        aoConcluir?.()
      }
      return resultado
    },
    enabled: Boolean(uuid),
    refetchInterval: (query) => {
      const dados = query.state.data
      if (!dados) {
        return 2_500
      }
      if (dados.status === 'enviada' || dados.status === 'processando') {
        return 2_500
      }
      return false
    },
  })
}
