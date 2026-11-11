import type { FonteMusica } from '../types'

export const MUSICA_QUERY_KEYS = {
  todas: ['musica'] as const,
  resumo: (fonte: FonteMusica) => ['musica', fonte, 'resumo'] as const,
  capsulasMeses: (fonte: FonteMusica) => ['musica', fonte, 'capsulas', 'meses'] as const,
  capsulaDetalhe: (fonte: FonteMusica, ano: number, mes: number) =>
    ['musica', fonte, 'capsula', ano, mes] as const,
  imagens: ['musica', 'imagens'] as const,
  musicasItem: (fonte: FonteMusica, filtro: object) =>
    ['musica', fonte, 'musicas-item', filtro] as const,
  rankingIntervalo: (fonte: FonteMusica, params: object) =>
    ['musica', fonte, 'ranking-intervalo', params] as const,
  detalheArtista: (fonte: FonteMusica, artista: string) =>
    ['musica', fonte, 'detalhe-artista', artista] as const,
  detalheMusica: (fonte: FonteMusica, nome: string, artista: string) =>
    ['musica', fonte, 'detalhe-musica', nome, artista] as const,
  habitos: (fonte: FonteMusica, filtro: object) => ['musica', fonte, 'habitos', filtro] as const,
  recordes: (fonte: FonteMusica) => ['musica', fonte, 'recordes'] as const,
  evolucao: (fonte: FonteMusica, meses: number) => ['musica', fonte, 'evolucao', meses] as const,
  descobertas: (fonte: FonteMusica, filtro: object) =>
    ['musica', fonte, 'descobertas', filtro] as const,
  retrospectiva: (fonte: FonteMusica, ano: number) =>
    ['musica', fonte, 'retrospectiva', ano] as const,
}
