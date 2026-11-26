import type { TocandoAgoraExtensao } from '@/features/youtube-music/types'
import type { TocandoAgoraPronuncia } from '../types'

const PREFIXO_CODIGO_YOUTUBE = 'yt:'
const URL_YOUTUBE_MUSIC = 'https://music.youtube.com/watch?v='
const SUFIXOS_CANAL = [/\s+-\s+topic$/i, /\s*vevo$/i, /\s+official$/i]
const SEPARADOR_ARTISTA_TITULO = ' - '

function limparCanal(canal: string): string {
  return SUFIXOS_CANAL.reduce((texto, padrao) => texto.replace(padrao, ''), canal).trim()
}

/** Vídeos costumam vir como "Artista - Música": quando o começo é o artista, fica só a música. */
function limparTitulo(titulo: string, artista: string): string {
  const posicao = titulo.indexOf(SEPARADOR_ARTISTA_TITULO)
  if (posicao <= 0 || !artista) return titulo.trim()
  const antes = titulo.slice(0, posicao).trim().toLowerCase()
  if (!antes.includes(artista.toLowerCase()) && !artista.toLowerCase().includes(antes)) {
    return titulo.trim()
  }
  return titulo.slice(posicao + SEPARADOR_ARTISTA_TITULO.length).trim() || titulo.trim()
}

/** Converte o "tocando agora" da extensão do YouTube Music para o formato que a aba de letras usa com o Spotify. */
export function tocandoDoYoutube(youtube: TocandoAgoraExtensao): TocandoAgoraPronuncia {
  const artistas = youtube.identificada
    ? youtube.artistas
    : [limparCanal(youtube.artistas[0] ?? youtube.canal)].filter(Boolean)
  const nome = youtube.identificada
    ? youtube.titulo
    : limparTitulo(youtube.titulo, artistas[0] ?? '')
  const consultadoEm = youtube.posicaoEm ? Date.parse(youtube.posicaoEm) : Date.now()

  return {
    fonte: 'youtube',
    conectado: true,
    proximaConsultaMs: 0,
    temItem: true,
    emReproducao: !youtube.pausada,
    tipo: 'track',
    codigoFaixa: `${PREFIXO_CODIGO_YOUTUBE}${youtube.videoId}`,
    nome,
    artistas,
    album: youtube.album,
    capaUrl: youtube.urlCapa,
    duracaoMs: youtube.duracaoMs ?? 0,
    progressoMs: youtube.posicaoMs ?? youtube.msOuvidos,
    urlSpotify: null,
    urlExterna: `${URL_YOUTUBE_MUSIC}${youtube.videoId}`,
    bloqueadoAte: null,
    consultadoEm: Number.isNaN(consultadoEm) ? Date.now() : consultadoEm,
  }
}
