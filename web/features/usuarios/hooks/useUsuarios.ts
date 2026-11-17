import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  atualizarUsuario,
  cadastrarUsuario,
  listarFuncionalidadesSistema,
  listarUsuarios,
} from '../api'
import type { AtualizarUsuarioInput, CadastrarUsuarioInput } from '../types'
import { CHAVES_QUERY_USUARIOS } from './chavesQueryUsuarios'

function mensagemErroApi(erro: unknown, fallback: string): string {
  if (!axios.isAxiosError(erro)) return fallback
  const data = erro.response?.data as { error?: string; message?: string } | undefined
  return data?.error || data?.message || fallback
}

export function useListarUsuarios(habilitado = true) {
  return useQuery({
    queryKey: CHAVES_QUERY_USUARIOS.lista(),
    queryFn: listarUsuarios,
    enabled: habilitado,
    staleTime: 30_000,
  })
}

export function useListarFuncionalidadesSistema(habilitado = true) {
  return useQuery({
    queryKey: CHAVES_QUERY_USUARIOS.funcionalidades(),
    queryFn: listarFuncionalidadesSistema,
    enabled: habilitado,
    staleTime: 300_000,
  })
}

export function useCadastrarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CadastrarUsuarioInput) => cadastrarUsuario(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHAVES_QUERY_USUARIOS.todos })
      addToast({ title: 'Usuário criado com sucesso.', color: 'success' })
    },
    onError: (erro) => {
      addToast({
        title: mensagemErroApi(erro, 'Não foi possível criar o usuário.'),
        color: 'danger',
      })
    },
  })
}

export function useAtualizarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AtualizarUsuarioInput }) =>
      atualizarUsuario(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHAVES_QUERY_USUARIOS.todos })
      addToast({ title: 'Usuário atualizado com sucesso.', color: 'success' })
    },
    onError: (erro) => {
      addToast({
        title: mensagemErroApi(erro, 'Não foi possível atualizar o usuário.'),
        color: 'danger',
      })
    },
  })
}
