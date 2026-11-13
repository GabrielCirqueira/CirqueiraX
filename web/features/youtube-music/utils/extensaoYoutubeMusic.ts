import manifestoExtensao from '../../../../extensao/youtube-music/manifest.json'
import type { ResumoExtensaoYoutube, TocandoAgoraExtensao } from '../types'

const MINUTO_MS = 60_000
const SEGUNDO_MS = 1000
const LIMITE_SINAL_RECENTE_MS = 5 * MINUTO_MS

export const VERSAO_EXTENSAO_YOUTUBE = manifestoExtensao.version

export const URL_DOWNLOAD_EXTENSAO_YOUTUBE = `/build/extensao/cirqueirax-youtube-music-${VERSAO_EXTENSAO_YOUTUBE}.zip`

export const EXPLICACAO_EXTENSAO =
  'Opcional. No computador, a extensão lê o player do YouTube Music (aba ou app instalado do Chrome) e manda horário, tempo ouvido e pulos exatos. O que você ouve no celular ou na TV continua vindo pela conexão acima, estimado.'

export const PASSOS_INSTALAR_EXTENSAO = [
  'Baixe o arquivo da extensão e descompacte numa pasta que não vai apagar.',
  'No Chrome, abra chrome://extensions e ligue o "Modo do desenvolvedor" (canto superior direito).',
  'Clique em "Carregar sem compactação" e escolha a pasta descompactada.',
  'Dê um nome ao aparelho abaixo, gere o token e copie.',
  'Clique no ícone da extensão (quebra-cabeça → CirqueiraX), cole o token e clique em "Salvar e testar".',
  'Toque uma música. No popup, "Aba do YouTube Music" deve mostrar "Lendo: nome da música". Se mostrar "Nenhuma aba sendo lida", recarregue a aba do YouTube Music (F5).',
  'Para atualizar a extensão: baixe o arquivo de novo, substitua os arquivos da pasta e clique no botão de recarregar dela em chrome://extensions.',
]

export const AVISO_TOKEN_UNICO =
  'Este token aparece só agora. Ele só serve para a extensão enviar o que toca; não dá acesso aos seus dados.'

export function descreverSinalExtensao(
  resumo: ResumoExtensaoYoutube | undefined,
  agora: number
): string {
  if (!resumo || resumo.aparelhosAtivos === 0) return 'Nenhum aparelho com a extensão.'
  if (!resumo.ultimoEventoEm) return 'Token gerado, aguardando a primeira música.'
  const diferenca = agora - new Date(resumo.ultimoEventoEm).getTime()
  if (diferenca < LIMITE_SINAL_RECENTE_MS) return 'Extensão ativa agora.'
  return `Último sinal da extensão: ${new Date(resumo.ultimoEventoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`
}

const LIMITE_SEM_EVENTO_TOCANDO_MS = 45 * SEGUNDO_MS
const URL_VIDEO_YOUTUBE_MUSIC = 'https://music.youtube.com/watch?v='

export interface ProgressoTocandoYoutube {
  progressoMs: number
  duracaoMs: number | null
  percentual: number
  emReproducao: boolean
}

export function calcularProgressoTocandoYoutube(
  tocando: TocandoAgoraExtensao,
  agora: number
): ProgressoTocandoYoutube {
  const atualizadoEm = tocando.atualizadoEm ? new Date(tocando.atualizadoEm).getTime() : agora
  const decorrido = Math.max(0, agora - atualizadoEm)
  const emReproducao = !tocando.pausada && decorrido <= LIMITE_SEM_EVENTO_TOCANDO_MS
  const somado = tocando.msOuvidos + (emReproducao ? decorrido : 0)
  const progressoMs = tocando.duracaoMs ? Math.min(tocando.duracaoMs, somado) : somado
  const percentual = tocando.duracaoMs ? (progressoMs / tocando.duracaoMs) * 100 : 0
  return { progressoMs, duracaoMs: tocando.duracaoMs, percentual, emReproducao }
}

export function urlVideoYoutubeMusic(videoId: string): string | null {
  return videoId ? `${URL_VIDEO_YOUTUBE_MUSIC}${videoId}` : null
}
