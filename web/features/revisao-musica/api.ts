import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import {
  type AcaoLoteRevisao,
  type ArtistaCatalogo,
  ArtistaCatalogoSchema,
  CanalRevisaoSchema,
  type ClassificacaoCanal,
  type ContagensRevisao,
  ContagensRevisaoSchema,
  type CorrecaoVideoPayload,
  DuplicataRevisaoSchema,
  type FiltrosRevisao,
  type MusicaCatalogo,
  MusicaCatalogoSchema,
  type PaginaRevisao,
  PaginaRevisaoBrutaSchema,
  type TipoRevisao,
  type VideoRevisao,
  VideoRevisaoSchema,
  VideosAfetadosSchema,
} from './types'

const PREFIXO = '/api/v1/musica'

export const TAMANHO_PAGINA_REVISAO = 20

export async function obterContagensRevisao(): Promise<ContagensRevisao> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO}/revisao/contagens`)
  return ContagensRevisaoSchema.parse(data.data)
}

function parametrosFiltro(filtros: FiltrosRevisao): Record<string, string | number | boolean> {
  const parametros: Record<string, string | number | boolean> = {}
  const busca = filtros.busca.trim()
  if (busca !== '') parametros.busca = busca
  if (filtros.sugestao) parametros.sugestao = filtros.sugestao
  if (filtros.confiancaMinima !== null) parametros.confiancaMinima = filtros.confiancaMinima
  if (filtros.semTitulo) parametros.semTitulo = true
  return parametros
}

export async function listarRevisao(
  tipo: TipoRevisao,
  pagina: number,
  filtros: FiltrosRevisao
): Promise<PaginaRevisao> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO}/revisao`, {
    params: {
      tipo,
      pagina,
      porPagina: filtros.porPagina,
      ordem: filtros.ordem,
      ...parametrosFiltro(filtros),
      ...(filtros.incluirCanaisUnicos ? { incluirCanaisUnicos: true } : {}),
    },
  })
  const bruta = PaginaRevisaoBrutaSchema.parse(data.data)
  const base = {
    tipo: bruta.tipo,
    total: bruta.total,
    pagina: bruta.pagina,
    porPagina: bruta.porPagina,
    videos: [],
    canais: [],
    duplicatas: [],
  }
  if (bruta.tipo === 'canal_novo') {
    return { ...base, canais: CanalRevisaoSchema.array().parse(bruta.itens) }
  }
  if (bruta.tipo === 'possivel_duplicata') {
    return { ...base, duplicatas: DuplicataRevisaoSchema.array().parse(bruta.itens) }
  }
  return { ...base, videos: VideoRevisaoSchema.array().parse(bruta.itens) }
}

export async function corrigirVideo(
  videoUuid: string,
  payload: CorrecaoVideoPayload
): Promise<VideoRevisao> {
  const { data } = await api.post<RespostaApi<unknown>>(
    `${PREFIXO}/revisao/videos/${videoUuid}/musica`,
    payload
  )
  return VideoRevisaoSchema.parse(data.data)
}

export async function definirMusicaEmLote(
  videoUuids: string[],
  musicaUuid: string
): Promise<number> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/revisao/videos/lote`, {
    videoUuids,
    musicaUuid,
  })
  return VideosAfetadosSchema.parse(data.data).videosAfetados
}

export async function aplicarAcaoEmLote(
  videoUuids: string[],
  acao: AcaoLoteRevisao
): Promise<number> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/revisao/videos/acao-lote`, {
    videoUuids,
    acao,
  })
  return VideosAfetadosSchema.parse(data.data).videosAfetados
}

export async function aplicarAcaoPorFiltro(
  tipo: TipoRevisao,
  filtros: FiltrosRevisao,
  acao: AcaoLoteRevisao
): Promise<number> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/revisao/videos/acao-filtro`, {
    tipo,
    acao,
    ...parametrosFiltro(filtros),
  })
  return VideosAfetadosSchema.parse(data.data).videosAfetados
}

export async function classificarCanal(
  canal: string,
  classificacao: ClassificacaoCanal
): Promise<number> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/canais/classificar`, {
    canal,
    classificacao,
  })
  return VideosAfetadosSchema.parse(data.data).videosAfetados
}

export async function unirMusicas(
  origemUuid: string,
  destinoUuid: string
): Promise<MusicaCatalogo> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/catalogo/unir`, {
    origemUuid,
    destinoUuid,
  })
  return MusicaCatalogoSchema.parse(data.data)
}

export async function unirVariasMusicas(
  origemUuids: string[],
  destinoUuid: string
): Promise<MusicaCatalogo> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/catalogo/unir-varias`, {
    origemUuids,
    destinoUuid,
  })
  return MusicaCatalogoSchema.parse(data.data)
}

export async function descartarDuplicata(primeiraUuid: string, segundaUuid: string): Promise<void> {
  await api.post<RespostaApi<unknown>>(`${PREFIXO}/catalogo/duplicatas/descartar`, {
    primeiraUuid,
    segundaUuid,
  })
}

export async function separarVideo(videoUuid: string): Promise<VideoRevisao> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/catalogo/separar`, {
    videoUuid,
  })
  return VideoRevisaoSchema.parse(data.data)
}

export async function unirArtistas(
  origemUuid: string,
  destinoUuid: string
): Promise<ArtistaCatalogo> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/artistas/unir`, {
    origemUuid,
    destinoUuid,
  })
  return ArtistaCatalogoSchema.parse(data.data)
}

export async function buscarMusicasCatalogo(busca: string): Promise<MusicaCatalogo[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO}/catalogo/musicas`, {
    params: { busca },
  })
  return MusicaCatalogoSchema.array().parse(data.data)
}

export async function buscarArtistasCatalogo(busca: string): Promise<ArtistaCatalogo[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO}/catalogo/artistas`, {
    params: { busca },
  })
  return ArtistaCatalogoSchema.array().parse(data.data)
}
