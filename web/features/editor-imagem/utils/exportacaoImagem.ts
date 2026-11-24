import type { Anotacao, ImagemEditor } from '../types'
import {
  COR_FUNDO_TELA_PADRAO,
  EXTENSAO_IMAGEM_EXPORTADA,
  QUALIDADE_JPG,
  TIPO_IMAGEM_EXPORTADA,
  TIPO_IMAGEM_JPG,
} from './constantesEditor'
import { aguardarFontes, renderizarCena } from './desenhoCanvas'
import { obterRecorteAtivo } from './geometria'

export type FormatoExportacao = 'png' | 'jpg'

const TIPO_POR_FORMATO: Record<FormatoExportacao, string> = {
  png: TIPO_IMAGEM_EXPORTADA,
  jpg: TIPO_IMAGEM_JPG,
}

const PREFIXO_NOME_EDICAO = 'edicao'
const SUFIXO_NOME_EDITADO = 'editado'
const EXTENSAO_NO_NOME = /\.[a-z0-9]+$/i
const CARACTERES_INVALIDOS_NOME = /[^\p{L}\p{N}._-]+/gu

export async function gerarImagemEditada(
  imagem: ImagemEditor,
  anotacoes: Anotacao[],
  formato: FormatoExportacao = 'png'
): Promise<Blob> {
  await aguardarFontes(anotacoes)
  const canvas = document.createElement('canvas')
  const fundo = formato === 'jpg' ? COR_FUNDO_TELA_PADRAO : null
  renderizarCena(canvas, imagem, anotacoes, obterRecorteAtivo(imagem, anotacoes), fundo)

  return new Promise((resolver, rejeitar) => {
    canvas.toBlob(
      (conteudo) => {
        if (!conteudo) {
          rejeitar(new Error('Não foi possível gerar a imagem editada.'))
          return
        }
        resolver(conteudo)
      },
      TIPO_POR_FORMATO[formato],
      QUALIDADE_JPG
    )
  })
}

function carimboDeData(data: Date): string {
  const pad = (valor: number) => String(valor).padStart(2, '0')
  return `${data.getFullYear()}${pad(data.getMonth() + 1)}${pad(data.getDate())}_${pad(
    data.getHours()
  )}${pad(data.getMinutes())}${pad(data.getSeconds())}`
}

export function gerarNomePadraoImagem(prefixo: string = PREFIXO_NOME_EDICAO): string {
  return `${prefixo}_${carimboDeData(new Date())}`
}

export function sanitizarNomeArquivo(
  nome: string,
  extensao: string = EXTENSAO_IMAGEM_EXPORTADA
): string {
  const nomeLimpo = nome
    .trim()
    .replace(EXTENSAO_NO_NOME, '')
    .replace(CARACTERES_INVALIDOS_NOME, '_')
    .replace(/^_+|_+$/g, '')
  return `${nomeLimpo || gerarNomePadraoImagem()}.${extensao}`
}

export function sugerirNomeArquivo(
  imagem: ImagemEditor,
  extensao: string = EXTENSAO_IMAGEM_EXPORTADA
): string {
  if (!imagem.mediaItemOrigemUuid) return sanitizarNomeArquivo(imagem.nome, extensao)
  const nomeBase = imagem.nome.replace(EXTENSAO_NO_NOME, '')
  const comSufixo = nomeBase.endsWith(`_${SUFIXO_NOME_EDITADO}`)
    ? nomeBase
    : `${nomeBase}_${SUFIXO_NOME_EDITADO}`
  return sanitizarNomeArquivo(comSufixo, extensao)
}
