import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type PeriodoMusicasItem, obterVersoesMusica, tocarNoSpotify } from '../api'
import {
  type AlvoTocar,
  MENSAGEM_EXTENSAO_AUSENTE,
  abrirEmNovaAba,
  descreverAparelhoSpotify,
  extrairMensagemErroApi,
  isCodigoTocavel,
  montarUrlAbrir,
  tocarPelaExtensao,
  verificarExtensaoNoNavegador,
} from '../utils'
import { MUSICA_QUERY_KEYS } from './chavesQueryMusica'

const TEMPO_EXTENSAO_FRESCA_MS = 60_000

const FONTE_TODAS = 'todas'

export function useVersoesParaTocar(
  musicaUuid: string | null | undefined,
  periodo: PeriodoMusicasItem | null,
  habilitado: boolean
) {
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.versoes(FONTE_TODAS, musicaUuid ?? '', periodo ?? {}),
    queryFn: () => obterVersoesMusica(musicaUuid ?? '', periodo, FONTE_TODAS),
    enabled: habilitado && Boolean(musicaUuid),
    staleTime: TEMPO_EXTENSAO_FRESCA_MS,
  })
}

export function useExtensaoNoNavegador(habilitado: boolean) {
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.extensaoNoNavegador,
    queryFn: async () => (await verificarExtensaoNoNavegador())?.ok === true,
    enabled: habilitado,
    staleTime: TEMPO_EXTENSAO_FRESCA_MS,
    retry: false,
  })
}

async function tocarAlvo(alvo: AlvoTocar, extensaoPresente: boolean): Promise<void> {
  const url = montarUrlAbrir(alvo)
  if (!isCodigoTocavel(alvo)) {
    abrirEmNovaAba(url)
    return
  }

  if (alvo.fonte === 'spotify') {
    const resposta = await tocarNoSpotify(alvo.codigo ?? '').catch((erro: unknown) => {
      addToast({
        title: 'Não deu para tocar direto no Spotify',
        description: `${extrairMensagemErroApi(erro, 'Tente de novo em instantes.')} Abrindo o link no lugar.`,
        type: 'warning',
      })
      abrirEmNovaAba(url)
      return null
    })
    if (resposta) addToast({ title: descreverAparelhoSpotify(resposta.aparelho), type: 'success' })
    return
  }

  if (!extensaoPresente) {
    abrirEmNovaAba(url)
    return
  }

  const resposta = await tocarPelaExtensao(alvo.codigo ?? '')
  if (resposta?.ok) {
    addToast({
      title: resposta.novaAba ? 'Abrindo no YouTube Music' : 'Tocando no YouTube Music',
      type: 'success',
    })
    return
  }
  addToast({
    title: 'A extensão não conseguiu tocar',
    description: resposta?.mensagem ?? MENSAGEM_EXTENSAO_AUSENTE,
    type: 'warning',
  })
  abrirEmNovaAba(url)
}

export function useTocarMusica(extensaoPresente: boolean) {
  return useMutation({
    mutationFn: (alvo: AlvoTocar) => tocarAlvo(alvo, extensaoPresente),
  })
}
