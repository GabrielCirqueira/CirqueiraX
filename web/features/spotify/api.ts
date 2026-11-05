import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { z } from 'zod'
import {
  type CapsulaMensal,
  CapsulaMensalSchema,
  type ConcluirAutorizacaoSpotifyPayload,
  type DesconectarSpotify,
  DesconectarSpotifySchema,
  type ImportacaoSpotify,
  ImportacaoSpotifySchema,
  type ItemTopMusicaArtista,
  ItemTopMusicaArtistaSchema,
  type RespostaConsultaImagens,
  RespostaConsultaImagensSchema,
  type ResultadoSincronizacaoSpotify,
  ResultadoSincronizacaoSpotifySchema,
  type ResumoGeralSpotify,
  ResumoGeralSpotifySchema,
  type ResumoMesCapsula,
  ResumoMesCapsulaSchema,
  type StatusContaSpotify,
  StatusContaSpotifySchema,
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

export async function listarCapsulasSpotify(): Promise<ResumoMesCapsula[]> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/capsula')
  return z.array(ResumoMesCapsulaSchema).parse(data.data)
}

export async function obterCapsulaSpotify(ano: number, mes: number): Promise<CapsulaMensal> {
  const { data } = await api.get<RespostaApi<unknown>>(`/api/v1/spotify/capsula/${ano}/${mes}`)
  return CapsulaMensalSchema.parse(data.data)
}

export async function obterResumoSpotify(): Promise<ResumoGeralSpotify> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/resumo')
  return ResumoGeralSpotifySchema.parse(data.data)
}

export async function consultarImagensSpotify(chaves: string[]): Promise<RespostaConsultaImagens> {
  const { data } = await api.post<RespostaApi<unknown>>('/api/v1/spotify/imagens/consultar', {
    chaves,
  })
  return RespostaConsultaImagensSchema.parse(data.data)
}

export async function obterTopMusicasArtista(
  artista: string,
  ano?: number | null,
  mes?: number | null
): Promise<ItemTopMusicaArtista[]> {
  const params: Record<string, string | number> = { artista }
  if (ano !== undefined && ano !== null) params.ano = ano
  if (mes !== undefined && mes !== null) params.mes = mes

  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/artistas/top-musicas', {
    params,
  })
  return z.array(ItemTopMusicaArtistaSchema).parse(data.data)
}
