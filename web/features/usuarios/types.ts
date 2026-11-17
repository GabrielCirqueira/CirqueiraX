import type { FuncionalidadeSistema } from '@/shared/utils/funcionalidadesSistema'
import type { Usuario } from '@/shared/types'

export type UsuarioSistema = Usuario

export interface FuncionalidadeOpcao {
  codigo: FuncionalidadeSistema
  descricao: string
}

export interface CadastrarUsuarioInput {
  nomeCompleto: string
  username: string
  email: string
  senha: string
  administrador: boolean
  permissoes: FuncionalidadeSistema[]
}

export interface AtualizarUsuarioInput {
  nomeCompleto: string
  email: string
  administrador: boolean
  permissoes: FuncionalidadeSistema[]
  senha?: string
}

export interface FormularioUsuarioValores {
  nomeCompleto: string
  username: string
  email: string
  senha: string
  administrador: boolean
  permissoes: FuncionalidadeSistema[]
}
