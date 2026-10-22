import type {
  Anotacao,
  AnotacaoArraste,
  AnotacaoNumero,
  AnotacaoTexto,
  AnotacaoTraco,
  ImagemEditor,
  Retangulo,
} from '../types'
import {
  MULTIPLICADOR_MARCA_TEXTO,
  OPACIDADE_MARCA_TEXTO,
  TAMANHO_BLOCO_DESFOQUE,
} from './constantesEditor'
import { calcularFatorEscala, normalizarRetangulo } from './geometria'

const FONTE_ANOTACAO = '700 {tamanho}px Lato, ui-sans-serif, system-ui, sans-serif'
const COR_CONTORNO_CLARO = 'rgba(255, 255, 255, 0.95)'
const COR_CONTORNO_ESCURO = 'rgba(0, 0, 0, 0.75)'
const LIMIAR_LUMINANCIA_COR_CLARA = 0.6
const ANGULO_PONTA_SETA = Math.PI / 7
const RAZAO_CANTO_RETANGULO = 0.12
const RAZAO_CONTORNO_TEXTO = 0.16

export function montarFonte(tamanho: number): string {
  return FONTE_ANOTACAO.replace('{tamanho}', String(Math.round(tamanho)))
}

export function isCorClara(cor: string): boolean {
  const hex = cor.replace('#', '')
  const vermelho = Number.parseInt(hex.slice(0, 2), 16) / 255
  const verde = Number.parseInt(hex.slice(2, 4), 16) / 255
  const azul = Number.parseInt(hex.slice(4, 6), 16) / 255
  const luminancia = 0.299 * vermelho + 0.587 * verde + 0.114 * azul
  return luminancia > LIMIAR_LUMINANCIA_COR_CLARA
}

function corDeContorno(cor: string): string {
  return isCorClara(cor) ? COR_CONTORNO_ESCURO : COR_CONTORNO_CLARO
}

function prepararTraco(contexto: CanvasRenderingContext2D, cor: string, espessura: number) {
  contexto.strokeStyle = cor
  contexto.fillStyle = cor
  contexto.lineWidth = espessura
  contexto.lineCap = 'round'
  contexto.lineJoin = 'round'
}

function desenharCaminhoSuave(contexto: CanvasRenderingContext2D, anotacao: AnotacaoTraco) {
  const [primeiro, ...restantes] = anotacao.pontos
  if (!primeiro) return

  contexto.beginPath()
  contexto.moveTo(primeiro.x, primeiro.y)

  if (restantes.length === 0) {
    contexto.lineTo(primeiro.x + 0.1, primeiro.y + 0.1)
  }

  restantes.forEach((ponto, indice) => {
    const proximo = restantes[indice + 1]
    if (!proximo) {
      contexto.lineTo(ponto.x, ponto.y)
      return
    }
    contexto.quadraticCurveTo(
      ponto.x,
      ponto.y,
      (ponto.x + proximo.x) / 2,
      (ponto.y + proximo.y) / 2
    )
  })

  contexto.stroke()
}

function desenharTraco(contexto: CanvasRenderingContext2D, anotacao: AnotacaoTraco) {
  contexto.save()
  if (anotacao.tipo === 'marcaTexto') {
    contexto.globalAlpha = OPACIDADE_MARCA_TEXTO
    contexto.globalCompositeOperation = 'multiply'
    prepararTraco(contexto, anotacao.cor, anotacao.espessura * MULTIPLICADOR_MARCA_TEXTO)
    contexto.lineCap = 'butt'
  } else {
    prepararTraco(contexto, anotacao.cor, anotacao.espessura)
  }
  desenharCaminhoSuave(contexto, anotacao)
  contexto.restore()
}

function desenharSeta(contexto: CanvasRenderingContext2D, anotacao: AnotacaoArraste) {
  const { inicio, fim, espessura } = anotacao
  const angulo = Math.atan2(fim.y - inicio.y, fim.x - inicio.x)
  const comprimento = Math.hypot(fim.x - inicio.x, fim.y - inicio.y)
  const tamanhoPonta = Math.min(espessura * 4 + 10, comprimento * 0.6)
  const recuoHaste = tamanhoPonta * Math.cos(ANGULO_PONTA_SETA) * 0.8

  contexto.save()
  prepararTraco(contexto, anotacao.cor, espessura)
  contexto.beginPath()
  contexto.moveTo(inicio.x, inicio.y)
  contexto.lineTo(fim.x - Math.cos(angulo) * recuoHaste, fim.y - Math.sin(angulo) * recuoHaste)
  contexto.stroke()

  contexto.beginPath()
  contexto.moveTo(fim.x, fim.y)
  contexto.lineTo(
    fim.x - tamanhoPonta * Math.cos(angulo - ANGULO_PONTA_SETA),
    fim.y - tamanhoPonta * Math.sin(angulo - ANGULO_PONTA_SETA)
  )
  contexto.lineTo(
    fim.x - tamanhoPonta * Math.cos(angulo + ANGULO_PONTA_SETA),
    fim.y - tamanhoPonta * Math.sin(angulo + ANGULO_PONTA_SETA)
  )
  contexto.closePath()
  contexto.lineWidth = Math.max(1, espessura * 0.5)
  contexto.fill()
  contexto.stroke()
  contexto.restore()
}

function desenharLinha(contexto: CanvasRenderingContext2D, anotacao: AnotacaoArraste) {
  contexto.save()
  prepararTraco(contexto, anotacao.cor, anotacao.espessura)
  contexto.beginPath()
  contexto.moveTo(anotacao.inicio.x, anotacao.inicio.y)
  contexto.lineTo(anotacao.fim.x, anotacao.fim.y)
  contexto.stroke()
  contexto.restore()
}

function desenharRetangulo(contexto: CanvasRenderingContext2D, anotacao: AnotacaoArraste) {
  const area = normalizarRetangulo(anotacao.inicio, anotacao.fim)
  const raioCanto = Math.min(area.largura, area.altura) * RAZAO_CANTO_RETANGULO

  contexto.save()
  prepararTraco(contexto, anotacao.cor, anotacao.espessura)
  contexto.beginPath()
  contexto.roundRect(area.x, area.y, area.largura, area.altura, raioCanto)
  contexto.stroke()
  contexto.restore()
}

function desenharElipse(contexto: CanvasRenderingContext2D, anotacao: AnotacaoArraste) {
  const area = normalizarRetangulo(anotacao.inicio, anotacao.fim)

  contexto.save()
  prepararTraco(contexto, anotacao.cor, anotacao.espessura)
  contexto.beginPath()
  contexto.ellipse(
    area.x + area.largura / 2,
    area.y + area.altura / 2,
    area.largura / 2,
    area.altura / 2,
    0,
    0,
    Math.PI * 2
  )
  contexto.stroke()
  contexto.restore()
}

export function pixelarRegiao(
  contexto: CanvasRenderingContext2D,
  fonte: CanvasImageSource,
  regiao: Retangulo,
  recorte: Retangulo,
  tamanhoBloco: number
) {
  const largura = Math.round(regiao.largura)
  const altura = Math.round(regiao.altura)
  if (largura < 1 || altura < 1) return

  const reduzido = document.createElement('canvas')
  reduzido.width = Math.max(1, Math.ceil(largura / tamanhoBloco))
  reduzido.height = Math.max(1, Math.ceil(altura / tamanhoBloco))
  const contextoReduzido = reduzido.getContext('2d')
  if (!contextoReduzido) return

  contextoReduzido.drawImage(
    fonte,
    regiao.x - recorte.x,
    regiao.y - recorte.y,
    largura,
    altura,
    0,
    0,
    reduzido.width,
    reduzido.height
  )

  contexto.save()
  contexto.imageSmoothingEnabled = false
  contexto.drawImage(
    reduzido,
    0,
    0,
    reduzido.width,
    reduzido.height,
    regiao.x,
    regiao.y,
    largura,
    altura
  )
  contexto.restore()
}

function desenharDesfoque(
  contexto: CanvasRenderingContext2D,
  anotacao: AnotacaoArraste,
  recorte: Retangulo,
  fatorEscala: number,
  fonte: CanvasImageSource
) {
  const regiao = normalizarRetangulo(anotacao.inicio, anotacao.fim)
  pixelarRegiao(contexto, fonte, regiao, recorte, TAMANHO_BLOCO_DESFOQUE * fatorEscala)
}

export function desenharTexto(contexto: CanvasRenderingContext2D, anotacao: AnotacaoTexto) {
  contexto.save()
  contexto.font = montarFonte(anotacao.tamanhoFonte)
  contexto.textBaseline = 'top'
  contexto.lineJoin = 'round'
  contexto.lineWidth = anotacao.tamanhoFonte * RAZAO_CONTORNO_TEXTO
  contexto.strokeStyle = corDeContorno(anotacao.cor)
  contexto.fillStyle = anotacao.cor
  contexto.strokeText(anotacao.texto, anotacao.posicao.x, anotacao.posicao.y)
  contexto.fillText(anotacao.texto, anotacao.posicao.x, anotacao.posicao.y)
  contexto.restore()
}

function desenharNumero(contexto: CanvasRenderingContext2D, anotacao: AnotacaoNumero) {
  const { posicao, raio, cor, numero } = anotacao

  contexto.save()
  contexto.beginPath()
  contexto.arc(posicao.x, posicao.y, raio, 0, Math.PI * 2)
  contexto.fillStyle = cor
  contexto.fill()
  contexto.lineWidth = Math.max(2, raio * 0.16)
  contexto.strokeStyle = corDeContorno(cor)
  contexto.stroke()

  contexto.font = montarFonte(raio * 1.15)
  contexto.textAlign = 'center'
  contexto.textBaseline = 'middle'
  contexto.fillStyle = isCorClara(cor) ? '#111111' : '#FFFFFF'
  contexto.fillText(String(numero), posicao.x, posicao.y + raio * 0.06)
  contexto.restore()
}

export function desenharAnotacao(
  contexto: CanvasRenderingContext2D,
  anotacao: Anotacao,
  recorte: Retangulo,
  fatorEscala: number,
  fontePixelizacao: CanvasImageSource
) {
  switch (anotacao.tipo) {
    case 'pincel':
    case 'marcaTexto':
      desenharTraco(contexto, anotacao)
      return
    case 'seta':
      desenharSeta(contexto, anotacao)
      return
    case 'linha':
      desenharLinha(contexto, anotacao)
      return
    case 'retangulo':
      desenharRetangulo(contexto, anotacao)
      return
    case 'elipse':
      desenharElipse(contexto, anotacao)
      return
    case 'desfoque':
      desenharDesfoque(contexto, anotacao, recorte, fatorEscala, fontePixelizacao)
      return
    case 'texto':
      desenharTexto(contexto, anotacao)
      return
    case 'numero':
      desenharNumero(contexto, anotacao)
      return
    case 'recorte':
      return
  }
}

export function ajustarTamanhoCanvas(canvas: HTMLCanvasElement, recorte: Retangulo) {
  const largura = Math.round(recorte.largura)
  const altura = Math.round(recorte.altura)
  if (canvas.width !== largura) canvas.width = largura
  if (canvas.height !== altura) canvas.height = altura
}

export function prepararContexto(
  canvas: HTMLCanvasElement,
  recorte: Retangulo
): CanvasRenderingContext2D | null {
  const contexto = canvas.getContext('2d')
  if (!contexto) return null
  contexto.setTransform(1, 0, 0, 1, 0, 0)
  contexto.clearRect(0, 0, canvas.width, canvas.height)
  contexto.setTransform(1, 0, 0, 1, -recorte.x, -recorte.y)
  return contexto
}

export function renderizarCena(
  canvas: HTMLCanvasElement,
  imagem: ImagemEditor,
  anotacoes: Anotacao[],
  recorte: Retangulo
) {
  ajustarTamanhoCanvas(canvas, recorte)
  const contexto = prepararContexto(canvas, recorte)
  if (!contexto) return

  const fatorEscala = calcularFatorEscala(imagem)
  contexto.drawImage(imagem.bitmap, 0, 0)
  for (const anotacao of anotacoes) {
    desenharAnotacao(contexto, anotacao, recorte, fatorEscala, canvas)
  }
}

export function renderizarRascunho(
  canvasRascunho: HTMLCanvasElement,
  canvasBase: HTMLCanvasElement,
  imagem: ImagemEditor,
  anotacao: Anotacao | null,
  recorte: Retangulo
) {
  ajustarTamanhoCanvas(canvasRascunho, recorte)
  const contexto = prepararContexto(canvasRascunho, recorte)
  if (!contexto || !anotacao) return

  if (anotacao.tipo === 'recorte') {
    desenharMascaraRecorte(contexto, anotacao, recorte)
    return
  }

  desenharAnotacao(contexto, anotacao, recorte, calcularFatorEscala(imagem), canvasBase)
}

function desenharMascaraRecorte(
  contexto: CanvasRenderingContext2D,
  anotacao: AnotacaoArraste,
  recorte: Retangulo
) {
  const area = normalizarRetangulo(anotacao.inicio, anotacao.fim)
  contexto.save()
  contexto.fillStyle = 'rgba(0, 0, 0, 0.55)'
  contexto.beginPath()
  contexto.rect(recorte.x, recorte.y, recorte.largura, recorte.altura)
  contexto.rect(area.x, area.y, area.largura, area.altura)
  contexto.fill('evenodd')
  contexto.setLineDash([anotacao.espessura * 3, anotacao.espessura * 2])
  contexto.lineWidth = Math.max(1, anotacao.espessura * 0.5)
  contexto.strokeStyle = '#FFFFFF'
  contexto.strokeRect(area.x, area.y, area.largura, area.altura)
  contexto.restore()
}
