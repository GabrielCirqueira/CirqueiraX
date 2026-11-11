import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sincronizarSpotifyAgora } from '../api'
import { extrairMensagemErroApi } from '../utils'

export function useSincronizarSpotify() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sincronizarSpotifyAgora,
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ['spotify'] })
      queryClient.invalidateQueries({ queryKey: ['musica'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      addToast({
        title: 'Sincronização concluída',
        description:
          resultado.totalNovas === 0
            ? 'Nenhuma música nova. O Spotify só informa a música depois que ela termina.'
            : `${resultado.totalNovas} ${resultado.totalNovas === 1 ? 'música nova registrada' : 'músicas novas registradas'}.`,
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Falha ao sincronizar',
        description: extrairMensagemErroApi(erro, 'Não foi possível sincronizar com o Spotify.'),
        type: 'error',
      })
    },
  })
}
