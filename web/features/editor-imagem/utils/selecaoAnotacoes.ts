import type {
  AlcaTransformacao,
  Anotacao,
  AnotacaoArraste,
  FerramentaEditor,
  Ponto,
  Retangulo,
} from '../types'
import { MULTIPLICADOR_MARCA_TEXTO } from './constantesEditor'
import { medirCaixaTexto } from './desenhoCanvas'
import { distanciaEntre, normalizarRetangulo } from './geometria'

export type ModoAcerto = 'area' | 'preciso'

export interface AlcaPosicionada {
  alca: AlcaTransformacao
  ponto: Ponto
}

const CURSOR_POR_ALCA: Record<AlcaTransformacao, string> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  inicio: 'grab',
  fim: 'grab',
}

const TIPOS_COM_CAIXA_REDIMENSIONAVEL = ['retangulo', 'elipse', 'desfoque']
const TIPOS_COM_PONTAS = ['seta', 'linha']

const CURSOR_POR_FERRAMENTA: Partial<Record<FerramentaEditor, string>> = {
  selecionar: 'default',
  texto: 'text',
  numero: 'copy',
}

export function cursorDaFerramenta(ferramenta: FerramentaEditor): string {
  return CURSOR_POR_FERRAMENTA[ferramenta] ?? 'crosshair'
}

export function cursorDaAlca(alca: AlcaTransformacao): string {
  return CURSOR_POR_ALCA[alca]
}

function expandir(retangulo: Retangulo, margem: number): Retangulo {
  return {
    x: retangulo.x - margem,
    y: retangulo.y - margem,
    largura: retangulo.largura + margem * 2,
    altura: retangulo.altura + margem * 2,
  }
}

function contem(retangulo: Retangulo, ponto: Ponto): boolean {
  return (
    ponto.x >= retangulo.x &&
    ponto.x <= retangulo.x + retangulo.largura &&
    ponto.y >= retangulo.y &&
    ponto.y <= retangulo.y + retangulo.altura
  )
}

function distanciaAoSegmento(ponto: Ponto, inicio: Ponto, fim: Ponto): number {
  const dx = fim.x - inicio.x
  const dy = fim.y - inicio.y
  const comprimentoQuadrado = dx * dx + dy * dy
  if (comprimentoQuadrado === 0) return distanciaEntre(ponto, inicio)
  const projecao = ((ponto.x - inicio.x) * dx + (ponto.y - inicio.y) * dy) / comprimentoQuadrado
  const t = Math.max(0, Math.min(1, projecao))
  return distanciaEntre(ponto, { x: inicio.x + t * dx, y: inicio.y + t * dy })
}

function caixaDosPontos(pontos: Ponto[]): Retangulo {
  const xs = pontos.map((ponto) => ponto.x)
  const ys = pontos.map((ponto) => ponto.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, largura: Math.max(...xs) - x, altura: Math.max(...ys) - y }
}

export function caixaDaAnotacao(anotacao: Anotacao): Retangulo {
  switch (anotacao.tipo) {
    case 'pincel':
    case 'marcaTexto':
      return caixaDosPontos(anotacao.pontos)
    case 'texto':
      return medirCaixaTexto(anotacao)
    case 'numero':
      return {
        x: anotacao.posicao.x - anotacao.raio,
        y: anotacao.posicao.y - anotacao.raio,
        largura: anotacao.raio * 2,
        altura: anotacao.raio * 2,
      }
    default:
      return normalizarRetangulo(anotacao.inicio, anotacao.fim)
  }
}

function acertouBordaDaForma(anotacao: AnotacaoArraste, ponto: Ponto, margem: number): boolean {
  const area = normalizarRetangulo(anotacao.inicio, anotacao.fim)
  if (anotacao.tipo === 'retangulo') {
    return contem(expandir(area, margem), ponto) && !contem(expandir(area, -margem), ponto)
  }
  const raioX = Math.max(area.largura / 2, 1)
  const raioY = Math.max(area.altura / 2, 1)
  const distanciaNormalizada = Math.hypot(
    (ponto.x - (area.x + raioX)) / raioX,
    (ponto.y - (area.y + raioY)) / raioY
  )
  return Math.abs(distanciaNormalizada - 1) * Math.min(raioX, raioY) <= margem
}

function acertouForma(
  anotacao: AnotacaoArraste,
  ponto: Ponto,
  tolerancia: number,
  modo: ModoAcerto
): boolean {
  const margem = tolerancia + anotacao.espessura / 2
  if (anotacao.tipo === 'seta' || anotacao.tipo === 'linha') {
    return distanciaAoSegmento(ponto, anotacao.inicio, anotacao.fim) <= margem
  }
  const preenchida = anotacao.preenchimento !== 'nenhum' || anotacao.tipo === 'desfoque'
  if (modo === 'area' || preenchida) {
    return contem(expandir(normalizarRetangulo(anotacao.inicio, anotacao.fim), margem), ponto)
  }
  return acertouBordaDaForma(anotacao, ponto, margem)
}

export function acertouAnotacao(
  anotacao: Anotacao,
  ponto: Ponto,
  tolerancia: number,
  modo: ModoAcerto
): boolean {
  switch (anotacao.tipo) {
    case 'recorte':
      return false
    case 'pincel':
    case 'marcaTexto': {
      const largura =
        anotacao.tipo === 'marcaTexto'
          ? anotacao.espessura * MULTIPLICADOR_MARCA_TEXTO
          : anotacao.espessura
      const margem = tolerancia + largura / 2
      return anotacao.pontos.some((atual, indice) => {
        const anterior = anotacao.pontos[indice - 1] ?? atual
        return distanciaAoSegmento(ponto, anterior, atual) <= margem
      })
    }
    case 'texto':
    case 'numero':
      return contem(expandir(caixaDaAnotacao(anotacao), tolerancia), ponto)
    default:
      return acertouForma(anotacao, ponto, tolerancia, modo)
  }
}

export function encontrarAnotacaoNoPonto(
  anotacoes: Anotacao[],
  ponto: Ponto,
  tolerancia: number,
  modo: ModoAcerto
): Anotacao | null {
  for (let indice = anotacoes.length - 1; indice >= 0; indice--) {
    const anotacao = anotacoes[indice]
    if (anotacao && acertouAnotacao(anotacao, ponto, tolerancia, modo)) return anotacao
  }
  return null
}

export function alcasDaAnotacao(anotacao: Anotacao): AlcaPosicionada[] {
  if (anotacao.tipo === 'seta' || anotacao.tipo === 'linha') {
    return [
      { alca: 'inicio', ponto: anotacao.inicio },
      { alca: 'fim', ponto: anotacao.fim },
    ]
  }
  if (!TIPOS_COM_CAIXA_REDIMENSIONAVEL.includes(anotacao.tipo)) return []

  const { x, y, largura, altura } = caixaDaAnotacao(anotacao)
  const meioX = x + largura / 2
  const meioY = y + altura / 2
  return [
    { alca: 'nw', ponto: { x, y } },
    { alca: 'n', ponto: { x: meioX, y } },
    { alca: 'ne', ponto: { x: x + largura, y } },
    { alca: 'e', ponto: { x: x + largura, y: meioY } },
    { alca: 'se', ponto: { x: x + largura, y: y + altura } },
    { alca: 's', ponto: { x: meioX, y: y + altura } },
    { alca: 'sw', ponto: { x, y: y + altura } },
    { alca: 'w', ponto: { x, y: meioY } },
  ]
}

export function encontrarAlcaNoPonto(
  anotacao: Anotacao,
  ponto: Ponto,
  tolerancia: number
): AlcaTransformacao | null {
  const encontrada = alcasDaAnotacao(anotacao).find(
    (alca) => distanciaEntre(alca.ponto, ponto) <= tolerancia
  )
  return encontrada?.alca ?? null
}

export function isAnotacaoComPontas(anotacao: Anotacao): boolean {
  return TIPOS_COM_PONTAS.includes(anotacao.tipo)
}
