import { api } from '@/config/api'
import type { Usuario } from '@/shared/types'
import type { RespostaApi } from '@/shared/types/api'
import type { AlterarSenhaInput, AtualizarPerfilInput } from './types'

export async function atualizarPerfil(input: AtualizarPerfilInput): Promise<Usuario> {
  const { data } = await api.put<RespostaApi<Usuario>>('/api/v1/auth/me', input)
  return data.data
}

export async function alterarSenha(input: AlterarSenhaInput): Promise<void> {
  await api.put('/api/v1/auth/me/senha', input)
}
