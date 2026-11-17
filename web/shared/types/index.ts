/**
 * Interfaces globais compartilhadas entre múltiplas features.
 *
 * Tipos exclusivos de uma feature ficam em web/features/{feature}/types.ts
 */

import type { FuncionalidadeSistema } from '@/shared/utils/funcionalidadesSistema'

export interface Usuario {
  id: number
  nomeCompleto: string
  username: string
  email: string
  roles: string[]
  administrador: boolean
  permissoes: FuncionalidadeSistema[]
  criadoEm: string
  atualizadoEm?: string
}

export interface Paginacao {
  pagina: number
  porPagina: number
  total: number
  totalPaginas: number
}

export interface FiltrosBase {
  pagina?: number
  porPagina?: number
  busca?: string
}
