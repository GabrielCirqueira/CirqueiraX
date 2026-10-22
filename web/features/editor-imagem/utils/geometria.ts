import type {
  Anotacao,
  AnotacaoArraste,
  FerramentaEditor,
  ImagemEditor,
  Ponto,
  Retangulo,
} from '../types'
import { LADO_REFERENCIA_ESCALA } from './constantesEditor'

const PASSO_ANGULO_RESTRITO = Math.PI / 4

export function normalizarRetangulo(inicio: Ponto, fim: Ponto): Retangulo {
  return {
    x: Math.min(inicio.x, fim.x),
    y: Math.min(inicio.y, fim.y),
    largura: Math.abs(fim.x - inicio.x),
    altura: Math.abs(fim.y - inicio.y),
  }
}

export function distanciaEntre(inicio: Ponto, fim: Ponto): number {
  return Math.hypot(fim.x - inicio.x, fim.y - inicio.y)
}

export function calcularFatorEscala(imagem: ImagemEditor): number {
  return Math.max(1, Math.max(imagem.largura, imagem.altura) / LADO_REFERENCIA_ESCALA)
}

export function retanguloDaImagemInteira(imagem: ImagemEditor): Retangulo {
  return { x: 0, y: 0, largura: imagem.largura, altura: imagem.altura }
}

function isRecorte(anotacao: Anotacao): anotacao is AnotacaoArraste {
  return anotacao.tipo === 'recorte'
}

export function obterRecorteAtivo(imagem: ImagemEditor, anotacoes: Anotacao[]): Retangulo {
  const ultimoRecorte = anotacoes.filter(isRecorte).at(-1)
  if (!ultimoRecorte) return retanguloDaImagemInteira(imagem)
  return normalizarRetangulo(ultimoRecorte.inicio, ultimoRecorte.fim)
}

export function limitarAoRetangulo(ponto: Ponto, limite: Retangulo): Ponto {
  return {
    x: Math.min(Math.max(ponto.x, limite.x), limite.x + limite.largura),
    y: Math.min(Math.max(ponto.y, limite.y), limite.y + limite.altura),
  }
}

export function converterPontoDaTela(
  clienteX: number,
  clienteY: number,
  canvas: HTMLCanvasElement,
  recorte: Retangulo
): Ponto {
  const area = canvas.getBoundingClientRect()
  const escalaX = canvas.width / area.width
  const escalaY = canvas.height / area.height
  return {
    x: (clienteX - area.left) * escalaX + recorte.x,
    y: (clienteY - area.top) * escalaY + recorte.y,
  }
}

export function converterPontoParaTela(
  ponto: Ponto,
  canvas: HTMLCanvasElement,
  recorte: Retangulo
): Ponto {
  const area = canvas.getBoundingClientRect()
  return {
    x: ((ponto.x - recorte.x) * area.width) / canvas.width,
    y: ((ponto.y - recorte.y) * area.height) / canvas.height,
  }
}

export function escalaDaTela(canvas: HTMLCanvasElement): number {
  const area = canvas.getBoundingClientRect()
  if (canvas.width === 0) return 1
  return area.width / canvas.width
}

function restringirAngulo(inicio: Ponto, fim: Ponto): Ponto {
  const distancia = distanciaEntre(inicio, fim)
  const angulo = Math.atan2(fim.y - inicio.y, fim.x - inicio.x)
  const anguloRestrito = Math.round(angulo / PASSO_ANGULO_RESTRITO) * PASSO_ANGULO_RESTRITO
  return {
    x: inicio.x + Math.cos(anguloRestrito) * distancia,
    y: inicio.y + Math.sin(anguloRestrito) * distancia,
  }
}

function restringirProporcaoQuadrada(inicio: Ponto, fim: Ponto): Ponto {
  const lado = Math.max(Math.abs(fim.x - inicio.x), Math.abs(fim.y - inicio.y))
  return {
    x: inicio.x + Math.sign(fim.x - inicio.x || 1) * lado,
    y: inicio.y + Math.sign(fim.y - inicio.y || 1) * lado,
  }
}

export function aplicarRestricaoComShift(
  ferramenta: FerramentaEditor,
  inicio: Ponto,
  fim: Ponto
): Ponto {
  if (ferramenta === 'seta' || ferramenta === 'linha') return restringirAngulo(inicio, fim)
  if (ferramenta === 'retangulo' || ferramenta === 'elipse') {
    return restringirProporcaoQuadrada(inicio, fim)
  }
  return fim
}
