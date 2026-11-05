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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      addToast({
        title: 'Sincronização concluída',
        description:
          resultado.totalColetadas === 0
            ? 'O Spotify não devolveu nenhuma música nova desde a última coleta.'
            : `${resultado.totalColetadas} lidas do Spotify: ${resultado.totalNovas} novas e ${resultado.totalDuplicadas} já registradas.`,
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
