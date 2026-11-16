import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import {
  type ConfirmarPreviaPayload,
  DesconectarYoutubeOAuthSchema,
  type IniciarTransferenciaPayload,
  ListaParesSchema,
  ListaPlaylistsSchema,
  ListaVinculosSchema,
  type ServicoPlaylist,
  StatusContaYoutubeOAuthSchema,
  TransferenciaDetalheSchema,
  TransferenciaResumoSchema,
  UrlYoutubeOAuthSchema,
  VinculoPlaylistSchema,
} from './types'

const BASE_YOUTUBE_OAUTH = '/api/v1/youtube-oauth'
const BASE_TRANSFERENCIA = '/api/v1/transferencia-playlists'

export async function obterStatusYoutubeOAuth() {
  const { data } = await api.get<RespostaApi<unknown>>(`${BASE_YOUTUBE_OAUTH}/status`)
  return StatusContaYoutubeOAuthSchema.parse(data.data)
}

export async function obterUrlYoutubeOAuth() {
  const { data } = await api.get<RespostaApi<unknown>>(`${BASE_YOUTUBE_OAUTH}/oauth/url`)
  return UrlYoutubeOAuthSchema.parse(data.data)
}

export async function concluirYoutubeOAuth(code: string) {
  const { data } = await api.post<RespostaApi<unknown>>(`${BASE_YOUTUBE_OAUTH}/oauth/concluir`, {
    code,
  })
  return StatusContaYoutubeOAuthSchema.parse(data.data)
}

export async function desconectarYoutubeOAuth() {
  const { data } = await api.post<RespostaApi<unknown>>(`${BASE_YOUTUBE_OAUTH}/desconectar`)
  return DesconectarYoutubeOAuthSchema.parse(data.data)
}

export async function listarPlaylistsServico(servico: ServicoPlaylist) {
  const { data } = await api.get<RespostaApi<unknown>>(
    `${BASE_TRANSFERENCIA}/servicos/${servico}/playlists`
  )
  return ListaPlaylistsSchema.parse(data.data)
}

export async function detectarParesPlaylists() {
  const { data } = await api.get<RespostaApi<unknown>>(`${BASE_TRANSFERENCIA}/pares`)
  return ListaParesSchema.parse(data.data)
}

export async function iniciarTransferencia(payload: IniciarTransferenciaPayload) {
  const { data } = await api.post<RespostaApi<unknown>>(BASE_TRANSFERENCIA, payload)
  return TransferenciaResumoSchema.parse(data.data)
}

export async function obterDetalheTransferencia(uuid: string) {
  const { data } = await api.get<RespostaApi<unknown>>(`${BASE_TRANSFERENCIA}/${uuid}`)
  return TransferenciaDetalheSchema.parse(data.data)
}

export async function confirmarPreviaTransferencia(uuid: string, payload: ConfirmarPreviaPayload) {
  const { data } = await api.post<RespostaApi<unknown>>(
    `${BASE_TRANSFERENCIA}/${uuid}/confirmar-previa`,
    payload
  )
  return TransferenciaDetalheSchema.parse(data.data)
}

export async function executarTransferencia(uuid: string) {
  const { data } = await api.post<RespostaApi<unknown>>(`${BASE_TRANSFERENCIA}/${uuid}/executar`)
  return TransferenciaResumoSchema.parse(data.data)
}

export async function listarVinculosPlaylists() {
  const { data } = await api.get<RespostaApi<unknown>>(`${BASE_TRANSFERENCIA}/vinculos`)
  return ListaVinculosSchema.parse(data.data)
}

export async function sincronizarVinculoPlaylist(uuid: string, force = false) {
  const { data } = await api.post<RespostaApi<unknown>>(
    `${BASE_TRANSFERENCIA}/vinculos/${uuid}/sincronizar`,
    { force }
  )
  return VinculoPlaylistSchema.parse(data.data)
}
