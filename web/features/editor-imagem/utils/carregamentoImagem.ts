import type { MediaItem } from '@/features/downloads-video/types'
import type { ConfiguracaoTela, ImagemEditor, Retangulo } from '../types'
import { LADO_MAXIMO_TELA, LADO_MINIMO_TELA } from './constantesEditor'
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
    tela: null,
  }
}

const NOME_TELA_EM_BRANCO = 'criacao'

function limitarLado(valor: number): number {
  return Math.round(Math.min(Math.max(valor, LADO_MINIMO_TELA), LADO_MAXIMO_TELA))
}

export async function criarTelaEmBranco(
  configuracao: ConfiguracaoTela,
  nome: string | null = null
): Promise<ImagemEditor> {
  const largura = limitarLado(configuracao.largura)
  const altura = limitarLado(configuracao.altura)
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const contexto = canvas.getContext('2d')
  if (contexto && configuracao.corFundo) {
    contexto.fillStyle = configuracao.corFundo
    contexto.fillRect(0, 0, largura, altura)
  }
  const bitmap = await createImageBitmap(canvas)
  return {
    id: crypto.randomUUID(),
    bitmap,
    largura,
    altura,
    nome: nome ?? gerarNomePadraoImagem(NOME_TELA_EM_BRANCO),
    mediaItemOrigemUuid: null,
    tela: { largura, altura, corFundo: configuracao.corFundo },
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
