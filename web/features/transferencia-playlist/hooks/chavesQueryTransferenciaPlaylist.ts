import type { ServicoPlaylist } from '../types'

export const CHAVES_QUERY_TRANSFERENCIA_PLAYLIST = {
  youtubeOAuthStatus: ['youtube-oauth', 'status'] as const,
  playlistsServico: (servico: ServicoPlaylist) =>
    ['transferencia-playlist', 'playlists', servico] as const,
  pares: ['transferencia-playlist', 'pares'] as const,
  pendentes: ['transferencia-playlist', 'pendentes'] as const,
  detalhe: (uuid: string) => ['transferencia-playlist', 'detalhe', uuid] as const,
  vinculos: ['transferencia-playlist', 'vinculos'] as const,
}
