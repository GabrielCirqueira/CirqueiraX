import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import type {
  CategoriaComAlbumDetalhe,
  RespostaAlbunsGoogleFotos,
  StatusGoogleFotos,
  VincularAlbumPayload,
} from './types'

export async function obterStatusGoogleFotos(): Promise<StatusGoogleFotos> {
  const { data } = await api.get<RespostaApi<StatusGoogleFotos>>('/api/v1/google-fotos/status')
  return data.data
}

export async function obterAlbunsGoogleFotos(): Promise<RespostaAlbunsGoogleFotos> {
  const { data } = await api.get<RespostaApi<RespostaAlbunsGoogleFotos>>(
    '/api/v1/google-fotos/albuns'
  )
  return data.data
}

export async function vincularAlbumCategoria(
  uuidCategoria: string,
  googlePhotosAlbumId: string
): Promise<CategoriaComAlbumDetalhe> {
  const payload: VincularAlbumPayload = { googlePhotosAlbumId }
  const { data } = await api.patch<RespostaApi<CategoriaComAlbumDetalhe>>(
    `/api/v1/categorias/${uuidCategoria}/album`,
    payload
  )
  return data.data
}

export async function listarTodasCategorias(): Promise<CategoriaComAlbumDetalhe[]> {
  const { data } = await api.get<RespostaApi<CategoriaComAlbumDetalhe[]>>('/api/v1/categorias')
  return data.data
}

export async function obterUrlOAuthGoogleFotos(): Promise<string> {
  const { data } = await api.get<RespostaApi<{ url: string }>>('/api/v1/google-fotos/oauth/url')
  return data.data.url
}

export async function concluirOAuthGoogleFotos(
  codigoOuUrl: string
): Promise<{ email: string; conectado: boolean }> {
  const { data } = await api.post<RespostaApi<{ email: string; conectado: boolean }>>(
    '/api/v1/google-fotos/oauth/concluir',
    { codigoOuUrl }
  )
  return data.data
}

export async function desconectarGoogleFotos(): Promise<void> {
  await api.post<RespostaApi<{ desconectado: boolean }>>('/api/v1/google-fotos/desconectar')
}
