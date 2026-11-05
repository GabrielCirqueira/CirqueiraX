export const SPOTIFY_QUERY_KEYS = {
  status: ['spotify', 'status'] as const,
  autorizarUrl: ['spotify', 'autorizar-url'] as const,
  resumo: ['spotify', 'resumo'] as const,
  capsulasMeses: ['spotify', 'capsulas', 'meses'] as const,
  capsulaDetalhe: (ano: number, mes: number) => ['spotify', 'capsula', ano, mes] as const,
  importacao: (uuid: string) => ['spotify', 'importacao', uuid] as const,
  imagens: ['spotify', 'imagens'] as const,
}
