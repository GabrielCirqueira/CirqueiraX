import type { CategoriaOpcao, MediaItem, StatusMediaItem } from '@/features/downloads-video/types'

export type { CategoriaOpcao, MediaItem, StatusMediaItem }

export interface FiltrosPrints {
  status?: string
  busca?: string
  categoriaId?: string
  origem?: string
  pagina?: number
  porPagina?: number
  ordenacao?: string
  direcao?: 'ASC' | 'DESC'
}

export interface MetricasPrints {
  total: number
  hoje: number
  tamanhoTotalBytes: number
  agentes: string[]
}
