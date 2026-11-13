import type { FonteReproducao, VarianteMusica } from '../types'

const ORIGEM_SITE = 'cirqueirax-site'
const ORIGEM_EXTENSAO = 'cirqueirax-extensao'
const TEMPO_LIMITE_PING_MS = 800
const TEMPO_LIMITE_TOCAR_MS = 3000
const PADRAO_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const PADRAO_FAIXA_SPOTIFY = /^[A-Za-z0-9]{22}$/
const URL_BUSCA_SPOTIFY = 'https://open.spotify.com/search/'
const URL_BUSCA_YOUTUBE_MUSIC = 'https://music.youtube.com/search?q='
const URL_FAIXA_SPOTIFY = 'https://open.spotify.com/track/'
const URL_VIDEO_YOUTUBE_MUSIC = 'https://music.youtube.com/watch?v='

export const MENSAGEM_EXTENSAO_AUSENTE =
  'A extensão 1.4.0 não respondeu neste navegador. Abrindo o link no lugar.'

export interface RespostaExtensao {
  ok: boolean
  mensagem?: string
  versao?: string
  novaAba?: boolean
}

export interface AlvoTocar {
  fonte: FonteReproducao
  codigo: string | null
  titulo: string
  artista: string
}

export function escolherVersaoParaTocar(
  variantes: VarianteMusica[],
  fonte: FonteReproducao
): VarianteMusica | null {
  return (
    variantes
      .filter((variante) => variante.fonte === fonte && variante.codigo)
      .sort((a, b) => b.streams - a.streams || b.minutos - a.minutos)[0] ?? null
  )
}

export function isCodigoTocavel(alvo: AlvoTocar): boolean {
  if (!alvo.codigo) return false
  return alvo.fonte === 'youtube_music'
    ? PADRAO_VIDEO_ID.test(alvo.codigo)
    : PADRAO_FAIXA_SPOTIFY.test(alvo.codigo)
}

export function montarUrlAbrir(alvo: AlvoTocar): string {
  const busca = encodeURIComponent(`${alvo.titulo} ${alvo.artista}`.trim())
  if (alvo.fonte === 'youtube_music') {
    return isCodigoTocavel(alvo)
      ? `${URL_VIDEO_YOUTUBE_MUSIC}${alvo.codigo}`
      : `${URL_BUSCA_YOUTUBE_MUSIC}${busca}`
  }
  return isCodigoTocavel(alvo)
    ? `${URL_FAIXA_SPOTIFY}${alvo.codigo}`
    : `${URL_BUSCA_SPOTIFY}${busca}`
}

export function abrirEmNovaAba(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function conversarComExtensao(
  dados: Record<string, unknown>,
  tempoLimiteMs: number
): Promise<RespostaExtensao | null> {
  const pedidoId = crypto.randomUUID()
  return new Promise((resolver) => {
    const aoReceber = (evento: MessageEvent) => {
      if (evento.source !== window || evento.origin !== window.location.origin) return
      if (evento.data?.origem !== ORIGEM_EXTENSAO || evento.data?.pedidoId !== pedidoId) return
      finalizar(evento.data as RespostaExtensao)
    }
    const temporizador = window.setTimeout(() => finalizar(null), tempoLimiteMs)
    const finalizar = (resposta: RespostaExtensao | null) => {
      window.clearTimeout(temporizador)
      window.removeEventListener('message', aoReceber)
      resolver(resposta)
    }
    window.addEventListener('message', aoReceber)
    window.postMessage({ origem: ORIGEM_SITE, pedidoId, ...dados }, window.location.origin)
  })
}

export async function verificarExtensaoNoNavegador(): Promise<RespostaExtensao | null> {
  return conversarComExtensao({ tipo: 'ping' }, TEMPO_LIMITE_PING_MS)
}

export function tocarPelaExtensao(videoId: string): Promise<RespostaExtensao | null> {
  return conversarComExtensao({ tipo: 'tocar', videoId }, TEMPO_LIMITE_TOCAR_MS)
}

export function descreverAparelhoSpotify(aparelho: string): string {
  return aparelho ? `Tocando no Spotify, em ${aparelho}` : 'Tocando no Spotify'
}

const ROTULO_CURTO_FONTE: Record<FonteReproducao, string> = {
  spotify: 'Spotify',
  youtube_music: 'YT Music',
}

export function rotuloBotaoTocar(alvo: AlvoTocar, extensaoPresente: boolean): string {
  const nome = ROTULO_CURTO_FONTE[alvo.fonte]
  if (!isCodigoTocavel(alvo)) return `Procurar no ${nome}`
  if (alvo.fonte === 'youtube_music' && !extensaoPresente) return `Abrir no ${nome}`
  return `Tocar no ${nome}`
}

export function montarAlvosTocar(
  variantes: VarianteMusica[],
  titulo: string,
  artista: string,
  codigoSpotifyReserva: string | null | undefined
): AlvoTocar[] {
  const spotify = escolherVersaoParaTocar(variantes, 'spotify')
  const youtube = escolherVersaoParaTocar(variantes, 'youtube_music')
  return [
    { fonte: 'spotify', codigo: spotify?.codigo ?? codigoSpotifyReserva ?? null, titulo, artista },
    { fonte: 'youtube_music', codigo: youtube?.codigo ?? null, titulo, artista },
  ]
}

export function alvoDaVariante(variante: VarianteMusica, artista: string): AlvoTocar {
  return {
    fonte: variante.fonte,
    codigo: variante.codigo,
    titulo: variante.titulo,
    artista: variante.fonte === 'youtube_music' ? '' : artista,
  }
}
