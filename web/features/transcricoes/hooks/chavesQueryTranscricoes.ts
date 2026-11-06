import type { FiltrosTranscricoes } from '../types'

export const TRANSCRICOES_QUERY_KEYS = {
  todas: ['transcricoes'] as const,
  lista: (filtros: FiltrosTranscricoes) => ['transcricoes', 'lista', filtros] as const,
  resumo: ['transcricoes', 'resumo'] as const,
  detalhe: (uuid: string) => ['transcricoes', 'detalhe', uuid] as const,
}
