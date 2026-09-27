import type { MediaItem } from '@/features/downloads-video/types'

export type ItemUploadEstado = 'pendente' | 'enviando' | 'sucesso' | 'duplicado' | 'erro'

export interface ArquivoFilaUpload {
  id: string
  file: File
  nome: string
  tamanhoBytes: number
  tipoMime: string
  previewUrl: string | null
  progresso: number
  status: ItemUploadEstado
  mensagemErro: string | null
  ehDuplicado: boolean
  categoriaId: string | null
  mediaItem: MediaItem | null
}

export interface ResultadoUploadMediaItem {
  mediaItem: MediaItem
  ehDuplicado: boolean
}

export interface EnviarArquivoParams {
  arquivo: File
  categoriaId?: string | null
  onProgress?: (progresso: number) => void
}
