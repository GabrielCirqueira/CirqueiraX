import type { Anotacao, ImagemEditor } from '../types'
import { EXTENSAO_IMAGEM_EXPORTADA, TIPO_IMAGEM_EXPORTADA } from './constantesEditor'
import { renderizarCena } from './desenhoCanvas'
import { obterRecorteAtivo } from './geometria'

const PREFIXO_NOME_EDICAO = 'edicao'
const SUFIXO_NOME_EDITADO = 'editado'
const EXTENSAO_NO_NOME = /\.[a-z0-9]+$/i
const CARACTERES_INVALIDOS_NOME = /[^\p{L}\p{N}._-]+/gu

export function gerarImagemEditada(imagem: ImagemEditor, anotacoes: Anotacao[]): Promise<Blob> {
  const canvas = document.createElement('canvas')
  renderizarCena(canvas, imagem, anotacoes, obterRecorteAtivo(imagem, anotacoes))

  return new Promise((resolver, rejeitar) => {
    canvas.toBlob((conteudo) => {
      if (!conteudo) {
        rejeitar(new Error('Não foi possível gerar a imagem editada.'))
        return
      }
      resolver(conteudo)
    }, TIPO_IMAGEM_EXPORTADA)
  })
}

function carimboDeData(data: Date): string {
  const pad = (valor: number) => String(valor).padStart(2, '0')
  return `${data.getFullYear()}${pad(data.getMonth() + 1)}${pad(data.getDate())}_${pad(
    data.getHours()
  )}${pad(data.getMinutes())}${pad(data.getSeconds())}`
}

export function gerarNomePadraoImagem(): string {
  return `${PREFIXO_NOME_EDICAO}_${carimboDeData(new Date())}`
}

export function sanitizarNomeArquivo(nome: string): string {
  const nomeLimpo = nome
    .trim()
    .replace(EXTENSAO_NO_NOME, '')
    .replace(CARACTERES_INVALIDOS_NOME, '_')
    .replace(/^_+|_+$/g, '')
  return `${nomeLimpo || gerarNomePadraoImagem()}.${EXTENSAO_IMAGEM_EXPORTADA}`
}

export function sugerirNomeArquivo(imagem: ImagemEditor): string {
  if (!imagem.mediaItemOrigemUuid) return sanitizarNomeArquivo(imagem.nome)
  const nomeBase = imagem.nome.replace(EXTENSAO_NO_NOME, '')
  const comSufixo = nomeBase.endsWith(`_${SUFIXO_NOME_EDITADO}`)
    ? nomeBase
    : `${nomeBase}_${SUFIXO_NOME_EDITADO}`
  return sanitizarNomeArquivo(comSufixo)
}
