import type { TipoRevisao } from '../types'

export const REVISAO_QUERY_KEYS = {
  todas: ['musica', 'revisao'] as const,
  contagens: ['musica', 'revisao', 'contagens'] as const,
  lista: (tipo: TipoRevisao, pagina: number) =>
    ['musica', 'revisao', 'lista', tipo, pagina] as const,
  busca: (alvo: 'musicas' | 'artistas', termo: string) =>
    ['musica', 'revisao', 'busca', alvo, termo] as const,
}
