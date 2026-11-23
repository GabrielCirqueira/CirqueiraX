import { ALTURA_RODAPE, MARGEM_IMAGEM, type Prancheta } from './desenhoCapsula'

export const ALTURA_GRANDE = 1800
export const ALTURA_MEDIA = 1300

export function numero(valor: number): string {
  return valor.toLocaleString('pt-BR')
}

export function plural(valor: number, singular: string, pluralTexto: string): string {
  return `${numero(valor)} ${valor === 1 ? singular : pluralTexto}`
}

export function limiteInferior(prancheta: Prancheta): number {
  return prancheta.altura - ALTURA_RODAPE - 20
}

export function larguraUtil(prancheta: Prancheta): number {
  return prancheta.largura - MARGEM_IMAGEM * 2
}

export function paisagem(prancheta: Prancheta): boolean {
  return prancheta.largura > prancheta.altura
}

export function tamanhoQueCabe(
  prancheta: Prancheta,
  texto: string,
  larguraMaxima: number,
  inicial: number,
  peso = 800
): number {
  const { contexto, estilo } = prancheta
  let tamanho = inicial
  while (tamanho > 24) {
    contexto.font = `${peso} ${tamanho}px ${estilo.familia}`
    if (contexto.measureText(texto).width <= larguraMaxima) return tamanho
    tamanho -= 4
  }
  return tamanho
}

export function desenharCodigoBarras(
  prancheta: Prancheta,
  semente: string,
  x: number,
  y: number,
  largura: number
) {
  const { contexto, tema } = prancheta
  contexto.fillStyle = tema.texto
  let posicao = x
  let indice = 0
  while (posicao < x + largura) {
    const codigo = semente.charCodeAt(indice % semente.length) + indice
    const espessura = 2 + (codigo % 4) * 2
    if (indice % 2 === 0) contexto.fillRect(posicao, y, espessura, 90)
    posicao += espessura + 2
    indice += 1
  }
}
