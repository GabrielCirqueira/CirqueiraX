import type { Anotacao, PropriedadeEditavel } from '../types'
import { LIMITES_PROPRIEDADE, type LimitePropriedade } from './constantesEditor'
import { isFerramentaForma } from './fabricaAnotacoes'
import { propriedadesDoTipo } from './transformacaoAnotacoes'

export const ROTULO_TIPO_ANOTACAO: Record<Anotacao['tipo'], string> = {
  seta: 'Seta',
  linha: 'Linha',
  retangulo: 'Retângulo',
  elipse: 'Círculo',
  triangulo: 'Triângulo',
  losango: 'Losango',
  estrela: 'Estrela',
  hexagono: 'Hexágono',
  balao: 'Balão de fala',
  pincel: 'Pincel',
  marcaTexto: 'Marca-texto',
  texto: 'Texto',
  numero: 'Marcador',
  desfoque: 'Área pixelada',
  recorte: 'Recorte',
}

const LIMITE_RAIO_CANTO_PADRAO = 100

export function temPropriedade(tipo: Anotacao['tipo'], propriedade: PropriedadeEditavel): boolean {
  return propriedadesDoTipo(tipo).includes(propriedade)
}

export function rotuloDaCor(tipo: Anotacao['tipo']): string {
  if (isFerramentaForma(tipo)) return 'Cor da borda'
  if (tipo === 'texto') return 'Cor do texto'
  return 'Cor'
}

export function limiteDaEspessura(tipo: Anotacao['tipo']): LimitePropriedade {
  return isFerramentaForma(tipo)
    ? LIMITES_PROPRIEDADE.espessuraForma
    : LIMITES_PROPRIEDADE.espessura
}

export function limiteDoRaioCanto(limiteCalculado: number | null): LimitePropriedade {
  return {
    minimo: 0,
    maximo: Math.max(1, Math.round(limiteCalculado ?? LIMITE_RAIO_CANTO_PADRAO)),
  }
}
