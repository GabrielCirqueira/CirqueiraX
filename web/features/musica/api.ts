import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { z } from 'zod'
import {
  type CapsulaMensal,
  CapsulaMensalSchema,
  type DescobertasMusica,
  DescobertasMusicaSchema,
  type DetalheArtista,
  DetalheArtistaSchema,
  type DetalheMusica,
  DetalheMusicaSchema,
  type EvolucaoMensal,
  EvolucaoMensalSchema,
  type FiltroPeriodoAnalise,
  type FonteMusica,
  type HabitosMusica,
  HabitosMusicaSchema,
  type ItemTopMusicaArtista,
  ItemTopMusicaArtistaSchema,
  type RankingIntervalo,
  RankingIntervaloSchema,
  type RecordesMusica,
  RecordesMusicaSchema,
  type RespostaConsultaImagens,
  RespostaConsultaImagensSchema,
  type ResumoGeralMusica,
  ResumoGeralMusicaSchema,
  type ResumoMesCapsula,
  ResumoMesCapsulaSchema,
  type RetrospectivaAnual,
  RetrospectivaAnualSchema,
} from './types'

const PREFIXO_MUSICA = '/api/v1/musica'
const PREFIXO_ALIAS_SPOTIFY = '/api/v1/spotify'

export async function listarCapsulasMusica(fonte: FonteMusica): Promise<ResumoMesCapsula[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_MUSICA}/capsula`, {
    params: { fonte },
  })
  return z.array(ResumoMesCapsulaSchema).parse(data.data)
}

export async function obterCapsulaMusica(
  ano: number,
  mes: number,
  fonte: FonteMusica
): Promise<CapsulaMensal> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_MUSICA}/capsula/${ano}/${mes}`, {
    params: { fonte },
  })
  return CapsulaMensalSchema.parse(data.data)
}

export async function obterResumoMusica(fonte: FonteMusica): Promise<ResumoGeralMusica> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_MUSICA}/resumo`, {
    params: { fonte },
  })
  return ResumoGeralMusicaSchema.parse(data.data)
}

export async function consultarImagensSpotify(chaves: string[]): Promise<RespostaConsultaImagens> {
  const { data } = await api.post<RespostaApi<unknown>>(
    `${PREFIXO_ALIAS_SPOTIFY}/imagens/consultar`,
    { chaves }
  )
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

export type PeriodoMusicasItem = Omit<FiltroIntervaloRankingParams, 'limite'>

export interface FiltroMusicasItem {
  artista: string
  album?: string | null
  periodo?: PeriodoMusicasItem | null
  limite: number
}

function montarParametrosPeriodo(
  periodo: PeriodoMusicasItem | null | undefined
): Record<string, string | number> {
  const params: Record<string, string | number> = { tipo: periodo?.tipo ?? 'todos' }
  if (periodo?.dias !== undefined) params.dias = periodo.dias
  if (periodo?.ano !== undefined) params.ano = periodo.ano
  if (periodo?.mes !== undefined) params.mes = periodo.mes
  if (periodo?.inicio) params.inicio = periodo.inicio
  if (periodo?.fim) params.fim = periodo.fim
  return params
}

export async function obterMusicasItem(
  filtro: FiltroMusicasItem,
  fonte: FonteMusica
): Promise<ItemTopMusicaArtista[]> {
  const params: Record<string, string | number> = {
    ...montarParametrosPeriodo(filtro.periodo),
    artista: filtro.artista,
    limite: filtro.limite,
    fonte,
  }
  if (filtro.album) params.album = filtro.album

  const { data } = await api.get<RespostaApi<unknown>>(
    `${PREFIXO_ALIAS_SPOTIFY}/artistas/top-musicas`,
    { params }
  )
  return z.array(ItemTopMusicaArtistaSchema).parse(data.data)
}

export async function obterRankingIntervaloMusica(
  params: FiltroIntervaloRankingParams,
  fonte: FonteMusica
): Promise<RankingIntervalo> {
  const queryParams: Record<string, string | number> = { ...montarParametrosPeriodo(params), fonte }
  if (params.limite !== undefined) queryParams.limite = params.limite

  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_MUSICA}/ranking`, {
    params: queryParams,
  })
  return RankingIntervaloSchema.parse(data.data)
}

export async function obterDetalheArtistaMusica(
  artista: string,
  fonte: FonteMusica
): Promise<DetalheArtista> {
  const { data } = await api.get<RespostaApi<unknown>>(
    `${PREFIXO_ALIAS_SPOTIFY}/artistas/detalhe`,
    { params: { artista, fonte } }
  )
  return DetalheArtistaSchema.parse(data.data)
}

export async function obterDetalheMusica(
  nome: string,
  artista: string,
  fonte: FonteMusica
): Promise<DetalheMusica> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_ALIAS_SPOTIFY}/musicas/detalhe`, {
    params: { nome, artista, fonte },
  })
  return DetalheMusicaSchema.parse(data.data)
}

export async function obterHabitosMusica(
  filtro: FiltroPeriodoAnalise,
  fonte: FonteMusica
): Promise<HabitosMusica> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_MUSICA}/habitos`, {
    params: { ...filtro, fonte },
  })
  return HabitosMusicaSchema.parse(data.data)
}

export async function obterRecordesMusica(fonte: FonteMusica): Promise<RecordesMusica> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_MUSICA}/recordes`, {
    params: { fonte },
  })
  return RecordesMusicaSchema.parse(data.data)
}

export async function obterEvolucaoMensalMusica(
  meses: number,
  fonte: FonteMusica
): Promise<EvolucaoMensal> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_MUSICA}/evolucao`, {
    params: { meses, fonte },
  })
  return EvolucaoMensalSchema.parse(data.data)
}

export async function obterDescobertasMusica(
  filtro: FiltroPeriodoAnalise,
  fonte: FonteMusica
): Promise<DescobertasMusica> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_MUSICA}/descobertas`, {
    params: { ...filtro, fonte },
  })
  return DescobertasMusicaSchema.parse(data.data)
}

export async function obterRetrospectivaMusica(
  ano: number,
  fonte: FonteMusica
): Promise<RetrospectivaAnual> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO_MUSICA}/retrospectiva/${ano}`, {
    params: { fonte },
  })
  return RetrospectivaAnualSchema.parse(data.data)
}
