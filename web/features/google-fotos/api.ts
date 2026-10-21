import { api } from '@/config/api'
import type { RespostaApi, RespostaPaginada } from '@/shared/types/api'
import type {
  CategoriaComAlbumDetalhe,
  RegistroEnvioGoogleFotos,
  RespostaAlbunsGoogleFotos,
  ResumoEnviosGoogleFotos,
  StatusEnvioGoogleFotos,
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

export async function listarEnviosGoogleFotos(
  pagina: number,
  limite: number,
  status: StatusEnvioGoogleFotos | null
): Promise<RespostaPaginada<RegistroEnvioGoogleFotos>> {
  const { data } = await api.get<RespostaPaginada<RegistroEnvioGoogleFotos>>(
    '/api/v1/google-fotos/envios',
    { params: { pagina, limite, status: status ?? undefined } }
  )
  return data
}

export async function obterResumoEnviosGoogleFotos(): Promise<ResumoEnviosGoogleFotos> {
  const { data } = await api.get<RespostaApi<ResumoEnviosGoogleFotos>>(
    '/api/v1/google-fotos/envios/resumo'
  )
  return data.data
}

export async function reenviarGoogleFotos(uuidRegistro: string): Promise<RegistroEnvioGoogleFotos> {
  const { data } = await api.post<RespostaApi<RegistroEnvioGoogleFotos>>(
    `/api/v1/google-fotos/envios/${uuidRegistro}/reenviar`
  )
  return data.data
}
