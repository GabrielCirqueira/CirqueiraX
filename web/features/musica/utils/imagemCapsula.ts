import type { CapsulaMensal } from '../types'
import { gerarChaveArtista, gerarChaveFaixa } from './chavesImagemMusica'
import {
  type Prancheta,
  canvasParaBlob,
  carregarImagemCapsula,
  desenharRodape,
  pintarFundo,
} from './desenhoCapsula'
import { DESENHOS_MODELOS } from './modelosImagemCapsula'
import {
  type OpcoesImagemCapsula,
  buscarFormatoImagemCapsula,
  buscarTemaImagemCapsula,
} from './temasImagemCapsula'

export const QUANTIDADE_CAPAS_IMAGEM_CAPSULA = 10
export const QUANTIDADE_FOTOS_IMAGEM_CAPSULA = 3

export interface ImagensCapsula {
  musicas: (string | null)[]
  artistas: (string | null)[]
}

export interface ImagemCapsulaGerada {
  blob: Blob
  url: string
}

function lerComoDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader()
    leitor.onload = () => resolver(String(leitor.result))
    leitor.onerror = () => rejeitar(new Error('Falha ao ler a imagem'))
    leitor.readAsDataURL(blob)
  })
}

export async function gerarImagemCapsula(
  capsula: CapsulaMensal,
  imagens: ImagensCapsula,
  opcoes: OpcoesImagemCapsula
): Promise<ImagemCapsulaGerada> {
  await document.fonts.ready
  const formato = buscarFormatoImagemCapsula(opcoes.formato)
  const canvas = document.createElement('canvas')
  canvas.width = formato.largura
  canvas.height = formato.altura
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new Error('Canvas indisponível')

  const [capasMusicas, fotosArtistas] = await Promise.all([
    Promise.all(imagens.musicas.map(carregarImagemCapsula)),
    Promise.all(imagens.artistas.map(carregarImagemCapsula)),
  ])
  const prancheta: Prancheta = {
    contexto,
    largura: formato.largura,
    altura: formato.altura,
    tema: buscarTemaImagemCapsula(opcoes.tema),
  }
  pintarFundo(prancheta)
  DESENHOS_MODELOS[opcoes.modelo](prancheta, {
    capsula,
    fonte: opcoes.fonte,
    capasMusicas,
    fotosArtistas,
  })
  desenharRodape(prancheta, opcoes.fonte)

  const blob = await canvasParaBlob(canvas)
  return { blob, url: await lerComoDataUrl(blob) }
}

export async function compartilharImagem(blob: Blob, nomeArquivo: string): Promise<boolean> {
  const arquivo = new File([blob], nomeArquivo, { type: 'image/png' })
  if (!navigator.canShare?.({ files: [arquivo] })) {
    return false
  }
  await navigator.share({ files: [arquivo], title: 'Minha Cápsula Sonora' })
  return true
}

export function baixarImagem(url: string, nomeArquivo: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function chavesImagensFaltantesCapsula(capsula: CapsulaMensal | undefined): string[] {
  if (!capsula) return []
  const musicas = capsula.topMusicas
    .slice(0, QUANTIDADE_CAPAS_IMAGEM_CAPSULA)
    .filter((musica) => !musica.imagemUrl)
    .map((musica) => gerarChaveFaixa(musica.codigoFaixa, musica.artistaPrincipal, musica.nomeFaixa))
  const artistas = capsula.topArtistas
    .slice(0, QUANTIDADE_FOTOS_IMAGEM_CAPSULA)
    .filter((artista) => !artista.imagemUrl)
    .map((artista) => gerarChaveArtista(artista.codigoArtista, artista.nomeArtista))
  return [...musicas, ...artistas]
}

export function montarImagensCapsula(
  capsula: CapsulaMensal,
  mapa: Record<string, { imagemUrl?: string | null }> | undefined
): ImagensCapsula {
  return {
    musicas: capsula.topMusicas
      .slice(0, QUANTIDADE_CAPAS_IMAGEM_CAPSULA)
      .map(
        (musica) =>
          musica.imagemUrl ||
          mapa?.[gerarChaveFaixa(musica.codigoFaixa, musica.artistaPrincipal, musica.nomeFaixa)]
            ?.imagemUrl ||
          null
      ),
    artistas: capsula.topArtistas
      .slice(0, QUANTIDADE_FOTOS_IMAGEM_CAPSULA)
      .map(
        (artista) =>
          artista.imagemUrl ||
          mapa?.[gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)]?.imagemUrl ||
          null
      ),
  }
}
