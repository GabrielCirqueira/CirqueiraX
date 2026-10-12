import type { MediaItem } from '@/features/downloads-video/types'

export type { MediaItem }

export interface CategoriaOpcao {
  uuid: string
  nome: string
  pastaLocal?: string
  googlePhotosAlbumId?: string | null
}

export interface FiltrosCentralMidias {
  pagina?: number
  porPagina?: number
  busca?: string
  status?: string
  origem?: string
  tipo?: 'todos' | 'imagem' | 'video' | string
  categoriaId?: string
  ordenacao?: string
  direcao?: 'ASC' | 'DESC' | string
}

export interface ContagensMidias {
  total: number
  manual: number
  downloads: number
  prints: number
  origens?: Record<string, number>
}
