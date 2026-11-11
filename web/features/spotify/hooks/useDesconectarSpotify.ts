import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { desconectarSpotify } from '../api'
import { extrairMensagemErroApi } from '../utils'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

export function useDesconectarSpotify() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: desconectarSpotify,
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ['spotify'] })
      queryClient.invalidateQueries({ queryKey: ['musica'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      addToast({
        title: 'Spotify desconectado',
        description: `${resultado.reproducoesRemovidas} reproduções recentes foram removidas.`,
        type: 'info',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao desconectar',
        description: extrairMensagemErroApi(
          erro,
          'Não foi possível desconectar a conta do Spotify.'
        ),
        type: 'error',
      })
    },
  })
}
