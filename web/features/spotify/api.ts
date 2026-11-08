import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { z } from 'zod'
import {
  type CapsulaMensal,
  CapsulaMensalSchema,
  type ConcluirAutorizacaoSpotifyPayload,
  type DescobertasSpotify,
  DescobertasSpotifySchema,
  type DesconectarSpotify,
  DesconectarSpotifySchema,
  type DetalheArtista,
  DetalheArtistaSchema,
  type DetalheMusica,
  DetalheMusicaSchema,
  type EvolucaoMensal,
  EvolucaoMensalSchema,
  type FiltroPeriodoAnalise,
  type HabitosSpotify,
  HabitosSpotifySchema,
  type ImportacaoSpotify,
  ImportacaoSpotifySchema,
  type ItemTopMusicaArtista,
  ItemTopMusicaArtistaSchema,
  type RankingIntervalo,
  RankingIntervaloSchema,
  type RecordesSpotify,
  RecordesSpotifySchema,
  type RespostaConsultaImagens,
  RespostaConsultaImagensSchema,
  type ResultadoSincronizacaoSpotify,
  ResultadoSincronizacaoSpotifySchema,
  type ResumoGeralSpotify,
  ResumoGeralSpotifySchema,
  type ResumoMesCapsula,
  ResumoMesCapsulaSchema,
  type RetrospectivaAnual,
  RetrospectivaAnualSchema,
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

export interface FiltroIntervaloRankingParams {
  tipo: 'dias' | 'mes' | 'ano' | 'personalizado' | 'todos'
  dias?: number
  ano?: number
  mes?: number
  inicio?: string
  fim?: string
  limite?: number
}

export type PeriodoMusicasItemSpotify = Omit<FiltroIntervaloRankingParams, 'limite'>

export interface FiltroMusicasItemSpotify {
  artista: string
  album?: string | null
  periodo?: PeriodoMusicasItemSpotify | null
  limite: number
}

export async function obterMusicasItemSpotify(
  filtro: FiltroMusicasItemSpotify
): Promise<ItemTopMusicaArtista[]> {
  const params: Record<string, string | number> = {
    artista: filtro.artista,
    limite: filtro.limite,
    tipo: filtro.periodo?.tipo ?? 'todos',
  }
  if (filtro.album) params.album = filtro.album
  if (filtro.periodo?.dias !== undefined) params.dias = filtro.periodo.dias
  if (filtro.periodo?.ano !== undefined) params.ano = filtro.periodo.ano
  if (filtro.periodo?.mes !== undefined) params.mes = filtro.periodo.mes
  if (filtro.periodo?.inicio) params.inicio = filtro.periodo.inicio
  if (filtro.periodo?.fim) params.fim = filtro.periodo.fim

  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/artistas/top-musicas', {
    params,
  })
  return z.array(ItemTopMusicaArtistaSchema).parse(data.data)
}

export async function obterRankingIntervaloSpotify(
  params: FiltroIntervaloRankingParams
): Promise<RankingIntervalo> {
  const queryParams: Record<string, string | number> = {
    tipo: params.tipo,
  }
  if (params.dias !== undefined) queryParams.dias = params.dias
  if (params.ano !== undefined) queryParams.ano = params.ano
  if (params.mes !== undefined) queryParams.mes = params.mes
  if (params.inicio) queryParams.inicio = params.inicio
  if (params.fim) queryParams.fim = params.fim
  if (params.limite !== undefined) queryParams.limite = params.limite

  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/ranking', {
    params: queryParams,
  })
  return RankingIntervaloSchema.parse(data.data)
}

export async function obterDetalheArtistaSpotify(artista: string): Promise<DetalheArtista> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/artistas/detalhe', {
    params: { artista },
  })
  return DetalheArtistaSchema.parse(data.data)
}

export async function obterDetalheMusicaSpotify(
  nome: string,
  artista: string
): Promise<DetalheMusica> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/musicas/detalhe', {
    params: { nome, artista },
  })
  return DetalheMusicaSchema.parse(data.data)
}

export async function obterHabitosSpotify(filtro: FiltroPeriodoAnalise): Promise<HabitosSpotify> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/habitos', {
    params: filtro,
  })
  return HabitosSpotifySchema.parse(data.data)
}

export async function obterRecordesSpotify(): Promise<RecordesSpotify> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/recordes')
  return RecordesSpotifySchema.parse(data.data)
}

export async function obterEvolucaoMensalSpotify(meses: number): Promise<EvolucaoMensal> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/evolucao', {
    params: { meses },
  })
  return EvolucaoMensalSchema.parse(data.data)
}

export async function obterDescobertasSpotify(
  filtro: FiltroPeriodoAnalise
): Promise<DescobertasSpotify> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/descobertas', {
    params: filtro,
  })
  return DescobertasSpotifySchema.parse(data.data)
}

export async function obterRetrospectivaSpotify(ano: number): Promise<RetrospectivaAnual> {
  const { data } = await api.get<RespostaApi<unknown>>(`/api/v1/spotify/retrospectiva/${ano}`)
  return RetrospectivaAnualSchema.parse(data.data)
}

export async function obterTocandoAgoraSpotify(): Promise<TocandoAgora> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/spotify/tocando-agora')
  return { ...TocandoAgoraSchema.parse(data.data), consultadoEm: Date.now() }
}
