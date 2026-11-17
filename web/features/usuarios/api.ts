import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import type {
  AtualizarUsuarioInput,
  CadastrarUsuarioInput,
  FuncionalidadeOpcao,
  UsuarioSistema,
} from './types'

export async function listarUsuarios(): Promise<UsuarioSistema[]> {
  const { data } = await api.get<RespostaApi<UsuarioSistema[]>>('/api/v1/usuarios')
  if (!Array.isArray(data.data)) {
    throw new Error('Resposta inválida ao listar usuários.')
  }
  return data.data
}

export async function obterUsuario(id: number): Promise<UsuarioSistema> {
  const { data } = await api.get<RespostaApi<UsuarioSistema>>(`/api/v1/usuarios/${id}`)
  return data.data
}

export async function listarFuncionalidadesSistema(): Promise<FuncionalidadeOpcao[]> {
  const { data } = await api.get<RespostaApi<FuncionalidadeOpcao[]>>(
    '/api/v1/usuarios/funcionalidades'
  )
  return data.data
}

export async function cadastrarUsuario(input: CadastrarUsuarioInput): Promise<UsuarioSistema> {
  const { data } = await api.post<RespostaApi<UsuarioSistema>>('/api/v1/usuarios', input)
  return data.data
}

export async function atualizarUsuario(
  id: number,
  input: AtualizarUsuarioInput
): Promise<UsuarioSistema> {
  const { data } = await api.put<RespostaApi<UsuarioSistema>>(`/api/v1/usuarios/${id}`, input)
  return data.data
}
