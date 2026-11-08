export const SPOTIFY_QUERY_KEYS = {
  status: ['spotify', 'status'] as const,
  autorizarUrl: ['spotify', 'autorizar-url'] as const,
  resumo: ['spotify', 'resumo'] as const,
  capsulasMeses: ['spotify', 'capsulas', 'meses'] as const,
  capsulaDetalhe: (ano: number, mes: number) => ['spotify', 'capsula', ano, mes] as const,
  importacao: (uuid: string) => ['spotify', 'importacao', uuid] as const,
  imagens: ['spotify', 'imagens'] as const,
  musicasItem: (filtro: object) => ['spotify', 'musicas-item', filtro] as const,
  rankingIntervalo: (params: Record<string, unknown>) =>
    ['spotify', 'ranking-intervalo', params] as const,
  detalheArtista: (artista: string) => ['spotify', 'detalhe-artista', artista] as const,
  detalheMusica: (nome: string, artista: string) =>
    ['spotify', 'detalhe-musica', nome, artista] as const,
  habitos: (filtro: object) => ['spotify', 'habitos', filtro] as const,
  recordes: ['spotify', 'recordes'] as const,
  evolucao: (meses: number) => ['spotify', 'evolucao', meses] as const,
  descobertas: (filtro: object) => ['spotify', 'descobertas', filtro] as const,
  retrospectiva: (ano: number) => ['spotify', 'retrospectiva', ano] as const,
  tocandoAgora: ['spotify', 'tocando-agora'] as const,
}
