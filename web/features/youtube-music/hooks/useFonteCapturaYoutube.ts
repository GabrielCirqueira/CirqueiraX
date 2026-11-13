import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { definirFonteCapturaYoutube } from '../api'
import type { FonteCapturaYoutube } from '../types'
import { extrairMensagemErroApi } from '../utils'
import { YOUTUBE_MUSIC_QUERY_KEYS } from './chavesQueryYoutubeMusic'

const TITULO_SUCESSO: Record<FonteCapturaYoutube, string> = {
  extensao: 'Agora só a extensão registra',
  coletor: 'Agora só a conexão por cookies registra',
}

export function useDefinirFonteCapturaYoutube() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: definirFonteCapturaYoutube,
    onSuccess: (fonte) => {
      queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.status })
      addToast({ title: TITULO_SUCESSO[fonte], type: 'success' })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Não foi possível trocar a fonte',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}
