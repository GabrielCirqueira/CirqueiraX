import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { useAuthStore } from '@/stores'
import { toast } from '@heroui/react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import type { LoginInput, RespostaLogin, RespostaMe } from './types'

export function useLogin() {
  const { setAutenticado } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (input: LoginInput): Promise<void> => {
      const { data: loginData } = await api.post<RespostaLogin>('/api/v1/auth/login', {
        username: input.emailOuUsuario.trim(),
        senha: input.senha,
      })

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
          criadoEm: meData.criadoEm,
        },
        loginData.token,
        loginData.refresh_token
      )
    },
    onSuccess: () => {
      toast.success('Bem-vindo ao CirqueiraX!')
      navigate('/dashboard')
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.danger('E-mail ou senha incorretos.')
      } else {
        toast.danger('Falha ao autenticar. Tente novamente.')
      }
    },
  })
}
