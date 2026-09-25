export type StatusMediaItem =
  | 'baixando'
  | 'recebido'
  | 'em_fila'
  | 'classificado'
  | 'distribuindo'
  | 'distribuido_local'
  | 'enviando_google_fotos'
  | 'concluido'
  | 'erro'

export type OrigemMedia = 'print_empresa' | 'print_pessoal' | 'bot_telegram' | 'manual'

export type PlataformaVideo = 'youtube' | 'tiktok' | 'twitter' | 'instagram' | 'outros'

export interface MetadataVideo {
  titulo?: string
  uploader?: string
  duracao?: number
  thumbnail?: string
  plataforma?: string
  url_original?: string
  data?: string
  [key: string]: unknown
}

export interface CategoriaVinculada {
  uuid: string
  nome?: string
  pastaLocal?: string
  googlePhotosAlbumId?: string | null
}

export interface MediaItem {
  uuid: string
  hash: string
  origem: OrigemMedia
  origemDescricao: string
  status: StatusMediaItem
  statusDescricao: string
  caminhoLocal: string | null
  googlePhotosMediaId: string | null
  categoriaId: string | null
  categoria: CategoriaVinculada | null
  metadata: MetadataVideo
  erroMotivo: string | null
  historicoStatus: Array<{ de?: string; para: string; em: string }>
  criadoEm: string
  atualizadoEm: string
}

export interface FiltrosMediaItem {
  status?: string
  origem?: string
  categoriaId?: string
  busca?: string
  ordenacao?: string
  direcao?: 'ASC' | 'DESC'
  pagina?: number
  porPagina?: number
}

export interface PedidoDownloadInput {
  url: string
}

export interface PedidoDownloadResposta {
  url: string
  origem: string
  plataforma: string
  plataformaDescricao: string
  status: string
}

export interface CategorizarLoteInput {
  uuids: string[]
  categoriaId: string
}

export interface RebaixarLoteInput {
  uuids: string[]
}

export interface ApagarLoteInput {
  uuids: string[]
}

export interface ApagarLoteResposta {
  removidos: string[]
  total: number
}

export interface AtualizarMetadataInput {
  titulo?: string
  uploader?: string
  data?: string
  duracao?: number
  metadata?: Record<string, unknown>
}
