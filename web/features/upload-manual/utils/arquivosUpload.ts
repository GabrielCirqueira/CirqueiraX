import type { MediaItem } from '@/features/downloads-video/types'

export interface TipoMidiaInfo {
  isVideo: boolean
  label: string
  colorPalette: string
}

const REGEX_VIDEO_EXTENSAO = /\.(mp4|mkv|webm|mov)$/i
const REGEX_VIDEO_NOME = /^(mp4|mkv|webm|mov)$/i

export function identificarTipoMidia(item: MediaItem): TipoMidiaInfo {
  const temDuracao = Boolean(item.metadata?.duracao)
  const temCaminhoVideo = Boolean(item.caminhoLocal?.match(REGEX_VIDEO_EXTENSAO))
  const temExtensaoVideo = Boolean(String(item.metadata?.extensao ?? '').match(REGEX_VIDEO_NOME))

  const isVideo = temDuracao || temCaminhoVideo || temExtensaoVideo

  return {
    isVideo,
    label: isVideo ? 'Vídeo' : 'Imagem',
    colorPalette: isVideo ? 'purple' : 'blue',
  }
}

export function extrairNomeExibicao(item: MediaItem): string {
  if (item.metadata?.nome_original && typeof item.metadata.nome_original === 'string') {
    return item.metadata.nome_original
  }

  if (item.caminhoLocal && typeof item.caminhoLocal === 'string') {
    const partes = item.caminhoLocal.split('/')
    const ultimo = partes[partes.length - 1]
    if (ultimo) return ultimo
  }

  return item.uuid
}

export function formatarTamanhoBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const tamanhos = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const indiceSeguro = Math.min(i, tamanhos.length - 1)
  const valor = bytes / k ** indiceSeguro
  const unidade = tamanhos[indiceSeguro] ?? 'B'
  return `${valor.toFixed(1)} ${unidade}`
}

export function extrairHashCurto(hash: string, tamanho = 8): string {
  if (!hash) return ''
  return hash.substring(0, tamanho)
}
