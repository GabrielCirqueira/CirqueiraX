import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { conectarYoutubeMusic } from '../api'
import { extrairMensagemErroApi } from '../utils'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

export function useConectarYoutubeMusic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cabecalhos: string) => conectarYoutubeMusic(cabecalhos),
    onSuccess: (status) => {
      queryClient.setQueryData(YOUTUBE_MUSIC_QUERY_KEYS.status, status)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      addToast({
        title: 'YouTube Music conectado',
        description: 'A coleta do que você ouve começa nos próximos minutos.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Não foi possível conectar',
        description: extrairMensagemErroApi(
          erro,
          'Confira se copiou os cabeçalhos de uma requisição "browse" do YouTube Music.'
        ),
        type: 'error',
      })
    },
  })
}
