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
