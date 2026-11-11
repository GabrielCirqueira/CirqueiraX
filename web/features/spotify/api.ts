import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import {
  type ConcluirAutorizacaoSpotifyPayload,
  type DesconectarSpotify,
  DesconectarSpotifySchema,
  type ImportacaoSpotify,
  ImportacaoSpotifySchema,
  type ResultadoSincronizacaoSpotify,
  ResultadoSincronizacaoSpotifySchema,
  type StatusContaSpotify,
  StatusContaSpotifySchema,
  type TocandoAgora,
  TocandoAgoraSchema,
  type UrlAutorizacaoSpotify,
  UrlAutorizacaoSpotifySchema,
} from './types'

export async function obterStatusSpotify(): Promise<StatusContaSpotify> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/status')
  return StatusContaSpotifySchema.parse(data.data)
}

export async function obterUrlAutorizacaoSpotify(): Promise<UrlAutorizacaoSpotify> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/oauth/url')
  return UrlAutorizacaoSpotifySchema.parse(data.data)
}

export async function concluirAutorizacaoSpotify(
  payload: ConcluirAutorizacaoSpotifyPayload
): Promise<StatusContaSpotify> {
  const { data } = await api.post<RespostaApi<unknown>>('/api/v1/spotify/oauth/concluir', payload)
  return StatusContaSpotifySchema.parse(data.data)
}

export async function desconectarSpotify(): Promise<DesconectarSpotify> {
  const { data } = await api.post<RespostaApi<unknown>>('/api/v1/spotify/desconectar')
  return DesconectarSpotifySchema.parse(data.data)
}

export async function sincronizarSpotifyAgora(): Promise<ResultadoSincronizacaoSpotify> {
  const { data } = await api.post<RespostaApi<unknown>>('/api/v1/spotify/sincronizar')
  return ResultadoSincronizacaoSpotifySchema.parse(data.data)
}

export async function iniciarImportacaoSpotify(arquivo: File): Promise<ImportacaoSpotify> {
  const formData = new FormData()
  formData.append('arquivo', arquivo)

  const { data } = await api.post<RespostaApi<unknown>>('/api/v1/spotify/importacoes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return ImportacaoSpotifySchema.parse(data.data)
}

export async function consultarImportacaoSpotify(uuid: string): Promise<ImportacaoSpotify> {
  const { data } = await api.get<RespostaApi<unknown>>(`/api/v1/spotify/importacoes/${uuid}`)
  return ImportacaoSpotifySchema.parse(data.data)
}

export async function obterTocandoAgoraSpotify(): Promise<TocandoAgora> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/tocando-agora')
  return { ...TocandoAgoraSchema.parse(data.data), consultadoEm: Date.now() }
}
