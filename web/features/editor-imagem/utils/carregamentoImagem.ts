import type { MediaItem } from '@/features/downloads-video/types'
import type { ImagemEditor, Retangulo } from '../types'
import { gerarNomePadraoImagem } from './exportacaoImagem'

export async function criarImagemEditor(
  conteudo: Blob,
  nome: string | null,
  mediaItemOrigemUuid: string | null
): Promise<ImagemEditor> {
  const bitmap = await createImageBitmap(conteudo)
  return {
    id: crypto.randomUUID(),
    bitmap,
    largura: bitmap.width,
    altura: bitmap.height,
    nome: nome?.trim() || gerarNomePadraoImagem(),
    mediaItemOrigemUuid,
  }
}

const NOME_GENERICO_AREA_TRANSFERENCIA = /^image\.(png|jpe?g|webp|gif)$/i

export function nomeDoArquivoColado(arquivo: File): string | null {
  if (!arquivo.name || NOME_GENERICO_AREA_TRANSFERENCIA.test(arquivo.name)) return null
  return arquivo.name
}

export function nomeDaMidia(mediaItem: MediaItem): string | null {
  const nomeOriginal = mediaItem.metadata.nome_original
  if (typeof nomeOriginal === 'string' && nomeOriginal.trim()) return nomeOriginal
  if (mediaItem.metadata.titulo?.trim()) return mediaItem.metadata.titulo
  return mediaItem.caminhoLocal?.split('/').at(-1) ?? null
}

export function descreverImagem(imagem: ImagemEditor, recorte: Retangulo | null): string {
  const largura = Math.round(recorte?.largura ?? imagem.largura)
  const altura = Math.round(recorte?.altura ?? imagem.altura)
  return `${imagem.nome} · ${largura} × ${altura}px`
}
