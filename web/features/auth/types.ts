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

export type RespostaMe = Usuario

export type UsuarioAuth = Usuario
