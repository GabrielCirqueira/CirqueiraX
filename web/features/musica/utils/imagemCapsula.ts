import type { CapsulaMensal } from '../types'
import { formatarMinutos } from './formatadoresMusica'

const LARGURA = 1080
const ALTURA = 1920
const MARGEM = 80
const FONTE = 'Inter, "Segoe UI", Arial, sans-serif'
const CORES = {
  fundo: '#121212',
  cartao: '#1F1F1F',
  verde: '#1ED760',
  azul: '#539DF5',
  amarelo: '#FEE44F',
  branco: '#FFFFFF',
  cinza: '#B3B3B3',
  apagado: '#6A6A6A',
}

export interface ImagensCapsula {
  musicas: (string | null)[]
  artistaPrincipal: string | null
}

function carregarImagem(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  return new Promise((resolver) => {
    const imagem = new Image()
    imagem.crossOrigin = 'anonymous'
    imagem.onload = () => resolver(imagem)
    imagem.onerror = () => resolver(null)
    imagem.src = url
  })
}

function desenharImagemInteira(
  contexto: CanvasRenderingContext2D,
  imagem: HTMLImageElement | null,
  x: number,
  y: number,
  tamanho: number
) {
  contexto.fillStyle = CORES.cartao
  contexto.fillRect(x, y, tamanho, tamanho)
  if (!imagem) return
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

function escreverLimitado(
  contexto: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  larguraMaxima: number
) {
  let resultado = texto
  while (resultado.length > 1 && contexto.measureText(resultado).width > larguraMaxima) {
    resultado = resultado.slice(0, -1)
  }
  contexto.fillText(resultado === texto ? texto : `${resultado.trimEnd()}…`, x, y)
}

function desenharIconeSpotify(
  contexto: CanvasRenderingContext2D,
  x: number,
  y: number,
  raio: number
) {
  contexto.fillStyle = CORES.verde
  contexto.beginPath()
  contexto.arc(x, y, raio, 0, Math.PI * 2)
  contexto.fill()
  contexto.strokeStyle = CORES.fundo
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

export async function gerarImagemCapsula(
  capsula: CapsulaMensal,
  imagens: ImagensCapsula
): Promise<Blob> {
  await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = LARGURA
  canvas.height = ALTURA
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new Error('Canvas indisponível')

  const topMusicas = capsula.topMusicas.slice(0, 5)
  const [capas, fotoArtista] = await Promise.all([
    Promise.all(topMusicas.map((_, indice) => carregarImagem(imagens.musicas[indice] ?? null))),
    carregarImagem(imagens.artistaPrincipal),
  ])

  contexto.fillStyle = CORES.fundo
  contexto.fillRect(0, 0, LARGURA, ALTURA)
  const brilho = contexto.createRadialGradient(LARGURA * 0.85, 120, 40, LARGURA * 0.85, 120, 900)
  brilho.addColorStop(0, 'rgba(30, 215, 96, 0.35)')
  brilho.addColorStop(1, 'rgba(30, 215, 96, 0)')
  contexto.fillStyle = brilho
  contexto.fillRect(0, 0, LARGURA, ALTURA)

  contexto.textBaseline = 'alphabetic'
  contexto.fillStyle = CORES.verde
  contexto.font = `700 30px ${FONTE}`
  contexto.fillText('CÁPSULA SONORA', MARGEM, 150)
  contexto.fillStyle = CORES.branco
  contexto.font = `800 84px ${FONTE}`
  escreverLimitado(contexto, capsula.rotulo, MARGEM, 250, LARGURA - MARGEM * 2)

  contexto.font = `800 120px ${FONTE}`
  contexto.fillStyle = CORES.verde
  contexto.fillText(formatarMinutos(capsula.totalMinutos), MARGEM, 420)
  contexto.font = `500 34px ${FONTE}`
  contexto.fillStyle = CORES.cinza
  contexto.fillText(
    `${capsula.totalStreams.toLocaleString('pt-BR')} streams · ${capsula.faixasDistintas.toLocaleString('pt-BR')} músicas diferentes`,
    MARGEM,
    480
  )

  const artista = capsula.topArtistas[0]
  if (artista) {
    const tamanhoFoto = 220
    desenharImagemInteira(contexto, fotoArtista, MARGEM, 560, tamanhoFoto)
    contexto.fillStyle = CORES.azul
    contexto.font = `700 28px ${FONTE}`
    contexto.fillText('ARTISTA DO MÊS', MARGEM + tamanhoFoto + 40, 620)
    contexto.fillStyle = CORES.branco
    contexto.font = `800 60px ${FONTE}`
    escreverLimitado(
      contexto,
      artista.nomeArtista,
      MARGEM + tamanhoFoto + 40,
      700,
      LARGURA - MARGEM * 2 - tamanhoFoto - 40
    )
    contexto.fillStyle = CORES.cinza
    contexto.font = `500 32px ${FONTE}`
    contexto.fillText(
      `${formatarMinutos(artista.totalMinutos)} · ${artista.totalStreams} streams`,
      MARGEM + tamanhoFoto + 40,
      752
    )
  }

  contexto.fillStyle = CORES.amarelo
  contexto.font = `700 28px ${FONTE}`
  contexto.fillText('TOP 5 MÚSICAS', MARGEM, 880)

  const tamanhoCapa = 140
  topMusicas.forEach((musica, indice) => {
    const y = 920 + indice * (tamanhoCapa + 30)
    contexto.fillStyle = CORES.apagado
    contexto.font = `800 44px ${FONTE}`
    contexto.fillText(String(indice + 1), MARGEM, y + tamanhoCapa / 2 + 16)
    desenharImagemInteira(contexto, capas[indice] ?? null, MARGEM + 60, y, tamanhoCapa)
    const xTexto = MARGEM + 60 + tamanhoCapa + 32
    const larguraTexto = LARGURA - xTexto - MARGEM
    contexto.fillStyle = CORES.branco
    contexto.font = `700 40px ${FONTE}`
    escreverLimitado(contexto, musica.nomeFaixa, xTexto, y + 58, larguraTexto)
    contexto.fillStyle = CORES.cinza
    contexto.font = `500 30px ${FONTE}`
    escreverLimitado(contexto, musica.artistaPrincipal, xTexto, y + 100, larguraTexto)
    contexto.fillStyle = CORES.verde
    contexto.font = `600 26px ${FONTE}`
    contexto.fillText(`${musica.totalStreams} streams`, xTexto, y + 136)
  })

  desenharIconeSpotify(contexto, MARGEM + 28, ALTURA - 110, 28)
  contexto.fillStyle = CORES.branco
  contexto.font = `600 30px ${FONTE}`
  contexto.fillText('Dados do Spotify e do YouTube Music', MARGEM + 74, ALTURA - 100)
  contexto.fillStyle = CORES.apagado
  contexto.font = `500 26px ${FONTE}`
  const assinatura = 'CirqueiraX'
  contexto.fillText(
    assinatura,
    LARGURA - MARGEM - contexto.measureText(assinatura).width,
    ALTURA - 100
  )

  return new Promise((resolver, rejeitar) => {
    canvas.toBlob(
      (blob) => (blob ? resolver(blob) : rejeitar(new Error('Falha ao gerar a imagem'))),
      'image/png'
    )
  })
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
