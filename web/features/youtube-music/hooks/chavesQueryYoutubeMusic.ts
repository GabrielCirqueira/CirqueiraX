export const YOUTUBE_MUSIC_QUERY_KEYS = {
  todas: ['youtube-music'] as const,
  status: ['youtube-music', 'status'] as const,
  importacoes: ['youtube-music', 'importacoes'] as const,
  importacao: (uuid: string) => ['youtube-music', 'importacao', uuid] as const,
  resumoIdentificacao: ['youtube-music', 'resumo-identificacao'] as const,
  tokensExtensao: ['youtube-music', 'extensao', 'tokens'] as const,
}
