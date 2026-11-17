import { limparConsultasPersistidas } from '@/shared/pwa/persistenciaConsultas'
import { limparDadosOffline } from '@/shared/pwa/serviceWorker'
import type { Usuario } from '@/shared/types'
import { normalizarUsuarioAuth } from '@/shared/utils/funcionalidadesSistema'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  usuario: Usuario | null
  token: string | null
  refreshToken: string | null
  autenticado: boolean
  setAutenticado: (usuario: Usuario, token: string, refreshToken: string) => void
  setToken: (token: string, refreshToken: string) => void
  limpar: () => void
}

function normalizarUsuarioPersistido(usuario: Usuario | null): Usuario | null {
  if (!usuario) return null
  return normalizarUsuarioAuth(usuario) as Usuario
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      refreshToken: null,
      autenticado: false,

      setAutenticado: (usuario, token, refreshToken) => {
        localStorage.setItem('token', token)
        set({
          usuario: normalizarUsuarioPersistido(usuario),
          token,
          refreshToken,
          autenticado: true,
        })
      },

      setToken: (token, refreshToken) => {
        localStorage.setItem('token', token)
        set({ token, refreshToken })
      },

      limpar: () => {
        localStorage.removeItem('token')
        limparDadosOffline()
        limparConsultasPersistidas()
        set({ usuario: null, token: null, refreshToken: null, autenticado: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
        refreshToken: state.refreshToken,
        autenticado: state.autenticado,
      }),
      merge: (persistido, atual) => {
        const estado = { ...atual, ...(persistido as Partial<AuthStore>) }
        return {
          ...estado,
          usuario: normalizarUsuarioPersistido(estado.usuario ?? null),
        }
      },
    }
  )
)
