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

function formatarMinutosSegundos(milissegundos: number): string {
  const totalSegundos = Math.max(0, Math.floor(milissegundos / SEGUNDO_MS))
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
}

export function descreverProgressoTocando(tocando: TocandoAgoraExtensao): string {
  const ouvido = formatarMinutosSegundos(tocando.msOuvidos)
  return tocando.duracaoMs
    ? `${ouvido} de ${formatarMinutosSegundos(tocando.duracaoMs)} ouvidos`
    : `${ouvido} ouvidos`
}
