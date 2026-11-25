import type { Anotacao, EixoAlinhamento, GuiaAlinhamento, Retangulo } from '../types'
import { caixaDaAnotacao } from './selecaoAnotacoes'

interface ResultadoEncaixe {
  dx: number
  dy: number
  guias: GuiaAlinhamento[]
}

interface MelhorEncaixe {
  ajuste: number
  posicao: number
}

function linhasVerticais(caixa: Retangulo): number[] {
  return [caixa.x, caixa.x + caixa.largura / 2, caixa.x + caixa.largura]
}

function linhasHorizontais(caixa: Retangulo): number[] {
  return [caixa.y, caixa.y + caixa.altura / 2, caixa.y + caixa.altura]
}

function procurarEncaixe(
  proprias: number[],
  alvos: number[],
  tolerancia: number
): MelhorEncaixe | null {
  let melhor: MelhorEncaixe | null = null
  for (const propria of proprias) {
    for (const alvo of alvos) {
      const ajuste = alvo - propria
      if (Math.abs(ajuste) > tolerancia) continue
      if (!melhor || Math.abs(ajuste) < Math.abs(melhor.ajuste)) melhor = { ajuste, posicao: alvo }
    }
  }
  return melhor
}

/**
 * Encaixa a caixa movida nas bordas e no centro da tela e dos outros itens,
 * devolvendo o ajuste e as guias que explicam o encaixe.
 */
export function calcularEncaixe(
  movida: Anotacao,
  outras: Anotacao[],
  tela: Retangulo,
  tolerancia: number
): ResultadoEncaixe {
  const caixa = caixaDaAnotacao(movida)
  const referencias = [
    tela,
    ...outras
      .filter((anotacao) => anotacao.id !== movida.id && !anotacao.oculta)
      .filter((anotacao) => anotacao.tipo !== 'recorte')
      .map(caixaDaAnotacao),
  ]
  const vertical = procurarEncaixe(
    linhasVerticais(caixa),
    referencias.flatMap(linhasVerticais),
    tolerancia
  )
  const horizontal = procurarEncaixe(
    linhasHorizontais(caixa),
    referencias.flatMap(linhasHorizontais),
    tolerancia
  )
  const guias: GuiaAlinhamento[] = []
  if (vertical) guias.push({ orientacao: 'vertical', posicao: vertical.posicao })
  if (horizontal) guias.push({ orientacao: 'horizontal', posicao: horizontal.posicao })
  return { dx: vertical?.ajuste ?? 0, dy: horizontal?.ajuste ?? 0, guias }
}

export function deslocamentoParaAlinhar(
  caixa: Retangulo,
  tela: Retangulo,
  eixo: EixoAlinhamento
): { dx: number; dy: number } {
  switch (eixo) {
    case 'esquerda':
      return { dx: tela.x - caixa.x, dy: 0 }
    case 'centroHorizontal':
      return { dx: tela.x + tela.largura / 2 - (caixa.x + caixa.largura / 2), dy: 0 }
    case 'direita':
      return { dx: tela.x + tela.largura - (caixa.x + caixa.largura), dy: 0 }
    case 'topo':
      return { dx: 0, dy: tela.y - caixa.y }
    case 'centroVertical':
      return { dx: 0, dy: tela.y + tela.altura / 2 - (caixa.y + caixa.altura / 2) }
    case 'base':
      return { dx: 0, dy: tela.y + tela.altura - (caixa.y + caixa.altura) }
  }
}
