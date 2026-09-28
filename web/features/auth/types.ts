import type { Usuario } from '@/shared/types'

export interface LoginInput {
  emailOuUsuario: string
  senha: string
}

export interface RespostaLogin {
  token: string
  refresh_token: string
}

export interface RespostaRefresh {
  token: string
  refresh_token: string
}

export interface RespostaMe {
  id: number
  nomeCompleto: string
  username: string
  email: string
  roles: string[]
  criadoEm: string
}

export type UsuarioAuth = Usuario
