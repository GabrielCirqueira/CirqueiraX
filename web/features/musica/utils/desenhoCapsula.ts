import type { CapsulaMensal, FonteMusica } from '../types'
import { urlCapaExibicao } from './capaMusica'
import { atribuicaoFonteMusica } from './fonteMusica'
import type { TemaImagemCapsula } from './temasImagemCapsula'

export const FONTE_TEXTO = 'Inter, "Segoe UI", Arial, sans-serif'
export const FONTE_MONO = '"JetBrains Mono", "Courier New", monospace'
export const MARGEM_IMAGEM = 80
export const ALTURA_RODAPE = 150
const COR_ICONE_SPOTIFY = '#1ED760'
const COR_ICONE_YOUTUBE = '#FF0033'
const COR_SIMBOLO_ICONE = '#FFFFFF'
const COR_ARCOS_SPOTIFY = '#121212'
const ASSINATURA = 'CirqueiraX'

export interface Prancheta {
  contexto: CanvasRenderingContext2D
  largura: number
  altura: number
  tema: TemaImagemCapsula
}

export interface DadosDesenhoCapsula {
  capsula: CapsulaMensal
  fonte: FonteMusica
  capasMusicas: (HTMLImageElement | null)[]
  fotosArtistas: (HTMLImageElement | null)[]
}

export interface EstiloTexto {
  tamanho: number
  peso?: number
  cor: string
  larguraMaxima?: number
  alinhamento?: CanvasTextAlign
  fonte?: string
}

export function carregarImagemCapsula(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  return new Promise((resolver) => {
    const imagem = new Image()
    imagem.crossOrigin = 'anonymous'
    imagem.onload = () => resolver(imagem)
    imagem.onerror = () => resolver(null)
    imagem.src = urlCapaExibicao(url) ?? url
  })
}

export function pintarFundo(prancheta: Prancheta) {
  const { contexto, largura, altura, tema } = prancheta
  const gradiente = contexto.createLinearGradient(0, 0, largura * 0.4, altura)
  tema.fundo.forEach((cor, indice) => {
    gradiente.addColorStop(indice / Math.max(1, tema.fundo.length - 1), cor)
  })
  contexto.fillStyle = gradiente
  contexto.fillRect(0, 0, largura, altura)
  if (!tema.brilho) return
  const raio = Math.max(largura, altura) * 0.55
  const brilho = contexto.createRadialGradient(largura * 0.85, 120, 40, largura * 0.85, 120, raio)
  brilho.addColorStop(0, tema.brilho)
  brilho.addColorStop(1, 'rgba(0, 0, 0, 0)')
  contexto.fillStyle = brilho
  contexto.fillRect(0, 0, largura, altura)
}

function limitarTexto(contexto: CanvasRenderingContext2D, texto: string, larguraMaxima: number) {
  if (contexto.measureText(texto).width <= larguraMaxima) return texto
  let resultado = texto
  while (resultado.length > 1 && contexto.measureText(`${resultado}…`).width > larguraMaxima) {
    resultado = resultado.slice(0, -1)
  }
  return `${resultado.trimEnd()}…`
}

export function escrever(
  prancheta: Prancheta,
  texto: string,
  x: number,
  y: number,
  estilo: EstiloTexto
): number {
  const { contexto } = prancheta
  contexto.font = `${estilo.peso ?? 500} ${estilo.tamanho}px ${estilo.fonte ?? FONTE_TEXTO}`
  contexto.fillStyle = estilo.cor
  contexto.textAlign = estilo.alinhamento ?? 'left'
  contexto.textBaseline = 'alphabetic'
  const final = estilo.larguraMaxima ? limitarTexto(contexto, texto, estilo.larguraMaxima) : texto
  contexto.fillText(final, x, y)
  contexto.textAlign = 'left'
  return contexto.measureText(final).width
}

export function retanguloArredondado(
  prancheta: Prancheta,
  x: number,
  y: number,
  largura: number,
  altura: number,
  raio: number,
  cor: string
) {
  const { contexto } = prancheta
  contexto.fillStyle = cor
  contexto.beginPath()
  contexto.roundRect(x, y, largura, altura, raio)
  contexto.fill()
}

export function desenharCapa(
  prancheta: Prancheta,
  imagem: HTMLImageElement | null,
  x: number,
  y: number,
  tamanho: number,
  raio = 12
) {
  const { contexto, tema } = prancheta
  contexto.save()
  contexto.beginPath()
  contexto.roundRect(x, y, tamanho, tamanho, raio)
  contexto.clip()
  contexto.fillStyle = tema.cartao
  contexto.fillRect(x, y, tamanho, tamanho)
  if (imagem) {
    const escala = Math.min(tamanho / imagem.naturalWidth, tamanho / imagem.naturalHeight)
    const largura = imagem.naturalWidth * escala
    const altura = imagem.naturalHeight * escala
    contexto.drawImage(
      imagem,
      x + (tamanho - largura) / 2,
      y + (tamanho - altura) / 2,
      largura,
      altura
    )
  }
  contexto.restore()
}

export function linhaTracejada(prancheta: Prancheta, x: number, y: number, largura: number) {
  const { contexto, tema } = prancheta
  contexto.save()
  contexto.strokeStyle = tema.apagado
  contexto.lineWidth = 3
  contexto.setLineDash([12, 10])
  contexto.beginPath()
  contexto.moveTo(x, y)
  contexto.lineTo(x + largura, y)
  contexto.stroke()
  contexto.restore()
}

function desenharIconeSpotify(prancheta: Prancheta, x: number, y: number, raio: number) {
  const { contexto } = prancheta
  contexto.fillStyle = COR_ICONE_SPOTIFY
  contexto.beginPath()
  contexto.arc(x, y, raio, 0, Math.PI * 2)
  contexto.fill()
  contexto.strokeStyle = COR_ARCOS_SPOTIFY
  contexto.lineCap = 'round'
  const arcos = [
    { deslocamento: -0.28, largura: 0.56, espessura: 0.13, curva: 0.16 },
    { deslocamento: 0.02, largura: 0.48, espessura: 0.11, curva: 0.13 },
    { deslocamento: 0.28, largura: 0.4, espessura: 0.09, curva: 0.1 },
  ]
  for (const arco of arcos) {
    contexto.lineWidth = raio * arco.espessura
    contexto.beginPath()
    contexto.moveTo(x - raio * arco.largura, y + raio * arco.deslocamento)
    contexto.quadraticCurveTo(
      x,
      y + raio * (arco.deslocamento - arco.curva * 2),
      x + raio * arco.largura,
      y + raio * (arco.deslocamento + arco.curva * 0.4)
    )
    contexto.stroke()
  }
}

function desenharIconeYoutubeMusic(prancheta: Prancheta, x: number, y: number, raio: number) {
  const { contexto } = prancheta
  contexto.fillStyle = COR_ICONE_YOUTUBE
  contexto.beginPath()
  contexto.arc(x, y, raio, 0, Math.PI * 2)
  contexto.fill()
  contexto.strokeStyle = COR_SIMBOLO_ICONE
  contexto.lineWidth = raio * 0.09
  contexto.beginPath()
  contexto.arc(x, y, raio * 0.58, 0, Math.PI * 2)
  contexto.stroke()
  contexto.fillStyle = COR_SIMBOLO_ICONE
  contexto.beginPath()
  contexto.moveTo(x - raio * 0.2, y - raio * 0.3)
  contexto.lineTo(x + raio * 0.32, y)
  contexto.lineTo(x - raio * 0.2, y + raio * 0.3)
  contexto.closePath()
  contexto.fill()
}

export function desenharRodape(prancheta: Prancheta, fonte: FonteMusica) {
  const { largura, altura, tema } = prancheta
  const base = altura - 70
  const raio = 26
  let x = MARGEM_IMAGEM + raio
  if (fonte !== 'youtube_music') {
    desenharIconeSpotify(prancheta, x, base - 10, raio)
    x += raio * 2 + 14
  }
  if (fonte !== 'spotify') {
    desenharIconeYoutubeMusic(prancheta, x, base - 10, raio)
    x += raio * 2 + 14
  }
  escrever(prancheta, atribuicaoFonteMusica(fonte), x - raio + 6, base, {
    tamanho: 28,
    peso: 600,
    cor: tema.texto,
    larguraMaxima: largura - x - MARGEM_IMAGEM - 180,
  })
  escrever(prancheta, ASSINATURA, largura - MARGEM_IMAGEM, base, {
    tamanho: 26,
    cor: tema.apagado,
    alinhamento: 'right',
  })
}

export function desenharCabecalho(prancheta: Prancheta, rotulo: string, y: number): number {
  const { largura, tema } = prancheta
  escrever(prancheta, 'CÁPSULA SONORA', MARGEM_IMAGEM, y, {
    tamanho: 30,
    peso: 700,
    cor: tema.destaque,
  })
  escrever(prancheta, rotulo, MARGEM_IMAGEM, y + 96, {
    tamanho: 80,
    peso: 800,
    cor: tema.texto,
    larguraMaxima: largura - MARGEM_IMAGEM * 2,
  })
  return y + 96
}

export function quantidadeQueCabe(espaco: number, alturaItem: number, maximo: number): number {
  return Math.max(0, Math.min(maximo, Math.floor(espaco / alturaItem)))
}

export function canvasParaBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolver, rejeitar) => {
    canvas.toBlob(
      (blob) => (blob ? resolver(blob) : rejeitar(new Error('Falha ao gerar a imagem'))),
      'image/png'
    )
  })
}
