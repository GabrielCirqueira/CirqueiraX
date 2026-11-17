import { addToast } from '@/shared/components/ui/toaster'
import type { Usuario } from '@/shared/types'
import { useAuthStore } from '@/stores'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { alterarSenha, atualizarPerfil } from '../api'
import type { AlterarSenhaInput, AtualizarPerfilInput } from '../types'

function mensagemErroApi(erro: unknown, fallback: string): string {
  if (!axios.isAxiosError(erro)) return fallback
  const data = erro.response?.data as { error?: string; message?: string } | undefined
  return data?.error || data?.message || fallback
}

export function useAtualizarPerfil() {
  const token = useAuthStore((s) => s.token)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setAutenticado = useAuthStore((s) => s.setAutenticado)

  return useMutation({
    mutationFn: (input: AtualizarPerfilInput) => atualizarPerfil(input),
    onSuccess: (usuario: Usuario) => {
      if (token && refreshToken) {
        setAutenticado(usuario, token, refreshToken)
      }
      addToast({ title: 'Perfil atualizado.', color: 'success' })
    },
    onError: (erro) => {
      addToast({
        title: mensagemErroApi(erro, 'Não foi possível atualizar o perfil.'),
        color: 'danger',
      })
    },
  })
}

export function useAlterarSenha() {
  return useMutation({
    mutationFn: (input: AlterarSenhaInput) => alterarSenha(input),
    onSuccess: () => {
      addToast({ title: 'Senha alterada com sucesso.', color: 'success' })
    },
    onError: (erro) => {
      addToast({
        title: mensagemErroApi(erro, 'Não foi possível alterar a senha.'),
        color: 'danger',
      })
    },
  })
}
