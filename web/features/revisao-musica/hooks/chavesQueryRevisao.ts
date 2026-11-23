import type { FiltrosRevisao, TipoRevisao } from '../types'

export const REVISAO_QUERY_KEYS = {
  todas: ['musica', 'revisao'] as const,
  contagens: ['musica', 'revisao', 'contagens'] as const,
  listasDoTipo: (tipo: TipoRevisao) => ['musica', 'revisao', 'lista', tipo] as const,
  lista: (tipo: TipoRevisao, pagina: number, filtros: FiltrosRevisao) =>
    ['musica', 'revisao', 'lista', tipo, pagina, filtros] as const,
  busca: (alvo: 'musicas' | 'artistas', termo: string) =>
    ['musica', 'revisao', 'busca', alvo, termo] as const,
}
