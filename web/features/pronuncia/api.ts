import { api } from '@/config/api'
import type { RespostaApi, RespostaPaginada } from '@/shared/types/api'
import { z } from 'zod'
import {
  type AnalisePronuncia,
  AnalisePronunciaSchema,
  type AprovarRelatoPayload,
  type ConsultaDetalhe,
  ConsultaDetalheSchema,
  ConsultaResumoSchema,
  type DirecaoTraducao,
  type ExcecaoPronuncia,
  ExcecaoPronunciaSchema,
  type FaixaParaLetra,
  type FiltrosHistorico,
  type LetraMusica,
  LetraMusicaSchema,
  type PaginaHistorico,
  type PainelPronuncia,
  PainelPronunciaSchema,
  type RelatoPronuncia,
  RelatoPronunciaSchema,
  type ReportarErroPayload,
  type SalvarExcecaoPayload,
  type TocandoAgoraPronuncia,
  TocandoAgoraPronunciaSchema,
} from './types'

const URL_PRONUNCIA = '/api/v1/pronuncia'

export async function traduzirTexto(
  texto: string,
  direcao: DirecaoTraducao
): Promise<ConsultaDetalhe> {
  const { data } = await api.post<RespostaApi<unknown>>(`${URL_PRONUNCIA}/traducoes`, {
    texto,
    direcao,
  })
  return ConsultaDetalheSchema.parse(data.data)
}

export async function gerarPreviaPronuncia(texto: string): Promise<AnalisePronuncia> {
  const { data } = await api.post<RespostaApi<unknown>>(`${URL_PRONUNCIA}/previa`, { texto })
  return AnalisePronunciaSchema.parse(data.data)
}

export async function obterPainelPronuncia(): Promise<PainelPronuncia> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_PRONUNCIA}/painel`)
  return PainelPronunciaSchema.parse(data.data)
}

export async function listarHistoricoPronuncia(
  filtros: FiltrosHistorico,
  limite: number
): Promise<PaginaHistorico> {
  const { data } = await api.get<RespostaPaginada<unknown>>(`${URL_PRONUNCIA}/historico`, {
    params: {
      busca: filtros.busca || undefined,
      favoritas: filtros.favoritas ? 1 : undefined,
      limite,
    },
  })
  return { consultas: z.array(ConsultaResumoSchema).parse(data.data), total: data.total }
}

export async function obterConsultaPronuncia(uuid: string): Promise<ConsultaDetalhe> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_PRONUNCIA}/historico/${uuid}`)
  return ConsultaDetalheSchema.parse(data.data)
}

export async function favoritarConsultaPronuncia(
  uuid: string,
  favorita: boolean
): Promise<ConsultaDetalhe> {
  const { data } = await api.put<RespostaApi<unknown>>(
    `${URL_PRONUNCIA}/historico/${uuid}/favorita`,
    { favorita }
  )
  return ConsultaDetalheSchema.parse(data.data)
}

export async function apagarConsultaPronuncia(uuid: string): Promise<void> {
  await api.delete(`${URL_PRONUNCIA}/historico/${uuid}`)
}

export async function reportarErroPronuncia(
  uuidConsulta: string,
  payload: ReportarErroPayload
): Promise<void> {
  await api.post(`${URL_PRONUNCIA}/historico/${uuidConsulta}/relatos`, payload)
}

export async function listarRelatosPronuncia(todos: boolean): Promise<RelatoPronuncia[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_PRONUNCIA}/relatos`, {
    params: { todos: todos ? 1 : undefined },
  })
  return z.array(RelatoPronunciaSchema).parse(data.data)
}

export async function sugerirCorrecaoPronuncia(uuid: string): Promise<RelatoPronuncia> {
  const { data } = await api.post<RespostaApi<unknown>>(
    `${URL_PRONUNCIA}/relatos/${uuid}/sugestao`,
    null,
    { timeout: 120000 }
  )
  return RelatoPronunciaSchema.parse(data.data)
}

export async function aprovarRelatoPronuncia(
  uuid: string,
  payload: AprovarRelatoPayload
): Promise<RelatoPronuncia> {
  const { data } = await api.post<RespostaApi<unknown>>(
    `${URL_PRONUNCIA}/relatos/${uuid}/aprovar`,
    payload
  )
  return RelatoPronunciaSchema.parse(data.data)
}

export async function rejeitarRelatoPronuncia(uuid: string): Promise<RelatoPronuncia> {
  const { data } = await api.post<RespostaApi<unknown>>(`${URL_PRONUNCIA}/relatos/${uuid}/rejeitar`)
  return RelatoPronunciaSchema.parse(data.data)
}

export async function listarExcecoesPronuncia(busca: string): Promise<ExcecaoPronuncia[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_PRONUNCIA}/excecoes`, {
    params: { busca: busca || undefined },
  })
  return z.array(ExcecaoPronunciaSchema).parse(data.data)
}

export async function salvarExcecaoPronuncia(
  payload: SalvarExcecaoPayload
): Promise<ExcecaoPronuncia> {
  const { data } = await api.put<RespostaApi<unknown>>(`${URL_PRONUNCIA}/excecoes`, payload)
  return ExcecaoPronunciaSchema.parse(data.data)
}

export async function apagarExcecaoPronuncia(uuid: string): Promise<void> {
  await api.delete(`${URL_PRONUNCIA}/excecoes/${uuid}`)
}

/** A posição vale para o momento em que o servidor consultou o Spotify, no meio da requisição, e não para quando a resposta chegou. */
export async function obterTocandoAgoraPronuncia(): Promise<TocandoAgoraPronuncia> {
  const enviadoEm = Date.now()
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_PRONUNCIA}/musica/tocando-agora`)
  return {
    ...TocandoAgoraPronunciaSchema.parse(data.data),
    consultadoEm: Math.round((enviadoEm + Date.now()) / 2),
    fonte: 'spotify',
  }
}

export async function obterLetraMusica(faixa: FaixaParaLetra): Promise<LetraMusica> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_PRONUNCIA}/musica/letra`, {
    params: { ...faixa, album: faixa.album ?? undefined },
    timeout: 60000,
  })
  return LetraMusicaSchema.parse(data.data)
}

export async function traduzirLetraMusica(uuid: string): Promise<LetraMusica> {
  const { data } = await api.post<RespostaApi<unknown>>(
    `${URL_PRONUNCIA}/musica/letra/${uuid}/traducao`,
    null,
    { timeout: 60000 }
  )
  return LetraMusicaSchema.parse(data.data)
}
