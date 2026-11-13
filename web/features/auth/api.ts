import { api } from '@/config/api'

export async function encerrarSessaoNoServidor(refreshToken: string): Promise<void> {
  await api.post('/api/v1/auth/logout', { refresh_token: refreshToken })
}
