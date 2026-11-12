export const ROTA_MUSICA = '/musica'
export const ROTA_GERENCIAR_MUSICA = '/musica/gerenciar'
export const ROTA_REVISAO_MUSICA = '/musica/revisao'

const ESTADOS_SPOTIFY_COM_PENDENCIA = new Set(['reconectar', 'revogada'])
const ESTADOS_YOUTUBE_COM_PENDENCIA = new Set(['reconectar'])

export interface EntradaPendenciasMusica {
  statusSpotify?: string
  statusYoutubeMusic?: string
  itensEmRevisao?: number
}

export function contarPendenciasMusica({
  statusSpotify,
  statusYoutubeMusic,
  itensEmRevisao,
}: EntradaPendenciasMusica): number {
  const contaSpotify = statusSpotify && ESTADOS_SPOTIFY_COM_PENDENCIA.has(statusSpotify) ? 1 : 0
  const contaYoutube =
    statusYoutubeMusic && ESTADOS_YOUTUBE_COM_PENDENCIA.has(statusYoutubeMusic) ? 1 : 0
  return contaSpotify + contaYoutube + (itensEmRevisao ?? 0)
}

export function descreverPendenciasMusica(total: number): string {
  if (total <= 0) return 'Contas, importações e correções'
  return total === 1 ? '1 pendência' : `${total} pendências`
}
