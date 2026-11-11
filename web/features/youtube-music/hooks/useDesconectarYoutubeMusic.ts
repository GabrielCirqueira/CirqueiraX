import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { desconectarYoutubeMusic } from '../api'
import { extrairMensagemErroApi } from '../utils'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

export function useDesconectarYoutubeMusic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: desconectarYoutubeMusic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.status })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      addToast({
        title: 'YouTube Music desconectado',
        description:
          'A credencial foi apagada. As reproduções já coletadas continuam nos relatórios.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao desconectar',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}
