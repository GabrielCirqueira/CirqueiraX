import { api } from '@/config/api'
import { addToast } from '@/shared/components/ui/toaster'
import type { Usuario } from '@/shared/types'
import type { RespostaApi } from '@/shared/types/api'
import { useAuthStore } from '@/stores'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { encerrarSessaoNoServidor } from './api'
import type { LoginInput, RespostaLogin, RespostaMe } from './types'
import { destinoAposLogin } from './utils'

export function useLogin() {
  const { setAutenticado } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  return useMutation({
    mutationFn: async (input: LoginInput): Promise<string> => {
      const { data: loginData } = await api.post<RespostaLogin>('/api/v1/auth/login', {
        username: input.emailOuUsuario.trim(),
        senha: input.senha,
      })

      localStorage.setItem('token', loginData.token)

      const { data: meResposta } = await api.get<RespostaApi<RespostaMe>>('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${loginData.token}` },
      })
      const meData = meResposta.data

      setAutenticado(
        {
          id: meData.id,
          nomeCompleto: meData.nomeCompleto,
          username: meData.username,
          email: meData.email,
          roles: meData.roles,
          administrador: Boolean(meData.administrador),
          permissoes: meData.permissoes ?? [],
          criadoEm: meData.criadoEm,
          atualizadoEm: meData.atualizadoEm,
        },
        loginData.token,
        loginData.refresh_token
      )

      return destinoAposLogin(location.state, meData)
    },
    onSuccess: (destino) => {
      addToast({ title: 'Bem-vindo ao CirqueiraX!', color: 'success' })
      navigate(destino, { replace: true })
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        addToast({ title: 'E-mail ou senha incorretos.', color: 'danger' })
      } else {
        addToast({ title: 'Falha ao autenticar. Tente novamente.', color: 'danger' })
      }
    },
  })
}

export function useSair() {
  const limpar = useAuthStore((s) => s.limpar)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  return function sair() {
    if (refreshToken) encerrarSessaoNoServidor(refreshToken).catch(() => {})
    limpar()
  }
}

export function useSincronizarUsuarioAuth() {
  const autenticado = useAuthStore((s) => s.autenticado)
  const token = useAuthStore((s) => s.token)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setAutenticado = useAuthStore((s) => s.setAutenticado)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<Usuario> => {
      const { data } = await api.get<RespostaApi<Usuario>>('/api/v1/auth/me')
      const usuario = data.data
      if (token && refreshToken) {
        setAutenticado(
          {
            ...usuario,
            administrador: Boolean(usuario.administrador),
            permissoes: usuario.permissoes ?? [],
          },
          token,
          refreshToken
        )
      }
      return usuario
    },
    enabled: autenticado && Boolean(token),
    staleTime: 60_000,
    retry: 1,
  })
}
