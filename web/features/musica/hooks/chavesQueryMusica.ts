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
  detalheArtista: (fonte: FonteMusica, alvo: object) =>
    ['musica', fonte, 'detalhe-artista', alvo] as const,
  detalheMusica: (fonte: FonteMusica, alvo: object) =>
    ['musica', fonte, 'detalhe-musica', alvo] as const,
  versoes: (fonte: FonteMusica, musicaUuid: string, periodo: object) =>
    ['musica', fonte, 'versoes', musicaUuid, periodo] as const,
  habitos: (fonte: FonteMusica, filtro: object) => ['musica', fonte, 'habitos', filtro] as const,
  recordes: (fonte: FonteMusica) => ['musica', fonte, 'recordes'] as const,
  linhaDoTempo: (fonte: FonteMusica) => ['musica', fonte, 'linha-do-tempo'] as const,
  evolucao: (fonte: FonteMusica, meses: number) => ['musica', fonte, 'evolucao', meses] as const,
  descobertas: (fonte: FonteMusica, filtro: object) =>
    ['musica', fonte, 'descobertas', filtro] as const,
  retrospectiva: (fonte: FonteMusica, ano: number) =>
    ['musica', fonte, 'retrospectiva', ano] as const,
  extensaoNoNavegador: ['musica', 'extensao-no-navegador'] as const,
  imagemCapsula: (ano: number, mes: number, opcoes: object, imagens: object) =>
    ['musica', 'imagem-capsula', ano, mes, opcoes, imagens] as const,
}
