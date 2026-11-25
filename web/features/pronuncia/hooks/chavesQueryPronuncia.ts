import type { FiltrosHistorico } from '../types'

export const PRONUNCIA_QUERY_KEYS = {
  todas: ['pronuncia'] as const,
  painel: ['pronuncia', 'painel'] as const,
  historico: (filtros: FiltrosHistorico) => ['pronuncia', 'historico', filtros] as const,
  historicoTodos: ['pronuncia', 'historico'] as const,
  consulta: (uuid: string) => ['pronuncia', 'consulta', uuid] as const,
  relatos: (todos: boolean) => ['pronuncia', 'relatos', todos] as const,
  relatosTodos: ['pronuncia', 'relatos'] as const,
  excecoes: (busca: string) => ['pronuncia', 'excecoes', busca] as const,
  excecoesTodas: ['pronuncia', 'excecoes'] as const,
  tocandoAgora: ['pronuncia', 'tocando-agora'] as const,
  letra: (codigoFaixa: string) => ['pronuncia', 'letra', codigoFaixa] as const,
}
