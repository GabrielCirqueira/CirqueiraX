import type { AnotacaoArraste, Ponto, Retangulo } from '../types'
import { normalizarRetangulo } from './geometria'

const PONTAS_ESTRELA = 5
const RAZAO_RAIO_INTERNO_ESTRELA = 0.45
const RAZAO_CORPO_BALAO = 0.78
const RAZAO_INICIO_RABO_BALAO = 0.16
const RAZAO_FIM_RABO_BALAO = 0.36
const RAZAO_PONTA_RABO_BALAO = 0.1

function poligono(caminho: Path2D, pontos: Ponto[]) {
  const [primeiro, ...restantes] = pontos
  if (!primeiro) return
  caminho.moveTo(primeiro.x, primeiro.y)
  for (const ponto of restantes) caminho.lineTo(ponto.x, ponto.y)
  caminho.closePath()
}

function pontosEstrela({ x, y, largura, altura }: Retangulo): Ponto[] {
  const centroX = x + largura / 2
  const centroY = y + altura / 2
  return Array.from({ length: PONTAS_ESTRELA * 2 }, (_, indice) => {
    const angulo = -Math.PI / 2 + (indice * Math.PI) / PONTAS_ESTRELA
    const fator = indice % 2 === 0 ? 1 : RAZAO_RAIO_INTERNO_ESTRELA
    return {
      x: centroX + Math.cos(angulo) * (largura / 2) * fator,
      y: centroY + Math.sin(angulo) * (altura / 2) * fator,
    }
  })
}

function pontosHexagono({ x, y, largura, altura }: Retangulo): Ponto[] {
  return [
    { x: x + largura * 0.25, y },
    { x: x + largura * 0.75, y },
    { x: x + largura, y: y + altura / 2 },
    { x: x + largura * 0.75, y: y + altura },
    { x: x + largura * 0.25, y: y + altura },
    { x, y: y + altura / 2 },
  ]
}

function balao(caminho: Path2D, { x, y, largura, altura }: Retangulo, raioCanto: number) {
  const corpo = altura * RAZAO_CORPO_BALAO
  const raio = Math.max(0, Math.min(raioCanto, largura / 2, corpo / 2))
  const direita = x + largura
  const base = y + corpo
  caminho.moveTo(x + raio, y)
  caminho.lineTo(direita - raio, y)
  caminho.arcTo(direita, y, direita, y + raio, raio)
  caminho.lineTo(direita, base - raio)
  caminho.arcTo(direita, base, direita - raio, base, raio)
  caminho.lineTo(x + largura * RAZAO_FIM_RABO_BALAO, base)
  caminho.lineTo(x + largura * RAZAO_PONTA_RABO_BALAO, y + altura)
  caminho.lineTo(x + largura * RAZAO_INICIO_RABO_BALAO, base)
  caminho.lineTo(x + raio, base)
  caminho.arcTo(x, base, x, base - raio, raio)
  caminho.lineTo(x, y + raio)
  caminho.arcTo(x, y, x + raio, y, raio)
  caminho.closePath()
}

export function criarCaminhoForma(anotacao: AnotacaoArraste): Path2D {
  const area = normalizarRetangulo(anotacao.inicio, anotacao.fim)
  const caminho = new Path2D()

  switch (anotacao.tipo) {
    case 'retangulo': {
      const raio = Math.max(0, Math.min(anotacao.raioCanto, area.largura / 2, area.altura / 2))
      caminho.roundRect(area.x, area.y, area.largura, area.altura, raio)
      break
    }
    case 'elipse':
      caminho.ellipse(
        area.x + area.largura / 2,
        area.y + area.altura / 2,
        area.largura / 2,
        area.altura / 2,
        0,
        0,
        Math.PI * 2
      )
      break
    case 'triangulo':
      poligono(caminho, [
        { x: area.x + area.largura / 2, y: area.y },
        { x: area.x + area.largura, y: area.y + area.altura },
        { x: area.x, y: area.y + area.altura },
      ])
      break
    case 'losango':
      poligono(caminho, [
        { x: area.x + area.largura / 2, y: area.y },
        { x: area.x + area.largura, y: area.y + area.altura / 2 },
        { x: area.x + area.largura / 2, y: area.y + area.altura },
        { x: area.x, y: area.y + area.altura / 2 },
      ])
      break
    case 'estrela':
      poligono(caminho, pontosEstrela(area))
      break
    case 'hexagono':
      poligono(caminho, pontosHexagono(area))
      break
    case 'balao':
      balao(caminho, area, anotacao.raioCanto)
      break
    default:
      caminho.rect(area.x, area.y, area.largura, area.altura)
  }

  return caminho
}
