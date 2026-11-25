import type { Anotacao } from '../types'
import { ROTULO_TIPO_ANOTACAO } from './propriedadesPainel'

/** Tipo próprio na área de transferência: fica só entre abas do editor e não suja outros apps. */
export const TIPO_AREA_TRANSFERENCIA_ANOTACAO = 'application/x-cirqueirax-anotacao'

export function serializarAnotacao(anotacao: Anotacao): string {
  return JSON.stringify(anotacao)
}

export function lerAnotacaoSerializada(conteudo: string): Anotacao | null {
  if (!conteudo) return null
  try {
    const valor: unknown = JSON.parse(conteudo)
    if (typeof valor !== 'object' || valor === null) return null
    const tipo = (valor as { tipo?: unknown }).tipo
    if (typeof tipo !== 'string' || !(tipo in ROTULO_TIPO_ANOTACAO)) return null
    if (tipo === 'recorte') return null
    return valor as Anotacao
  } catch {
    return null
  }
}
