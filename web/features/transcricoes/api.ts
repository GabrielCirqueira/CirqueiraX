import { api } from '@/config/api'
import type { RespostaApi, RespostaPaginada } from '@/shared/types/api'
import { z } from 'zod'
import {
  type AtualizarTranscricaoPayload,
  type FiltrosTranscricoes,
  type IdiomaTranscricao,
  type PaginaTranscricoes,
  type ResumoTranscricoes,
  ResumoTranscricoesSchema,
  type TranscricaoDetalhe,
  TranscricaoDetalheSchema,
  type TranscricaoResumo,
  TranscricaoResumoSchema,
} from './types'

const URL_TRANSCRICOES = '/api/v1/transcricoes'

export async function listarTranscricoes(
  filtros: FiltrosTranscricoes,
  limite: number
): Promise<PaginaTranscricoes> {
  const { data } = await api.get<RespostaPaginada<unknown>>(URL_TRANSCRICOES, {
    params: { busca: filtros.busca || undefined, filtro: filtros.filtro, limite },
  })
  return {
    transcricoes: z.array(TranscricaoResumoSchema).parse(data.data),
    total: data.total,
    pagina: data.pagina,
    porPagina: data.porPagina,
  }
}

export async function obterResumoTranscricoes(): Promise<ResumoTranscricoes> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_TRANSCRICOES}/resumo`)
  return ResumoTranscricoesSchema.parse(data.data)
}

export async function obterTranscricao(uuid: string): Promise<TranscricaoDetalhe> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_TRANSCRICOES}/${uuid}`)
  return TranscricaoDetalheSchema.parse(data.data)
}

export async function enviarAudioTranscricao(
  arquivo: File,
  idioma: IdiomaTranscricao,
  aoProgredir: (percentual: number) => void
): Promise<TranscricaoResumo> {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  formData.append('idioma', idioma)

  const { data } = await api.post<RespostaApi<unknown>>(URL_TRANSCRICOES, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (evento) => {
      if (evento.total) aoProgredir(Math.round((evento.loaded / evento.total) * 100))
    },
  })
  return TranscricaoResumoSchema.parse(data.data)
}

export async function atualizarTranscricao(
  uuid: string,
  payload: AtualizarTranscricaoPayload
): Promise<TranscricaoResumo> {
  const { data } = await api.patch<RespostaApi<unknown>>(`${URL_TRANSCRICOES}/${uuid}`, payload)
  return TranscricaoResumoSchema.parse(data.data)
}

export async function reprocessarTranscricao(
  uuid: string,
  idioma: IdiomaTranscricao | null
): Promise<TranscricaoResumo> {
  const { data } = await api.post<RespostaApi<unknown>>(
    `${URL_TRANSCRICOES}/${uuid}/reprocessar`,
    idioma ? { idioma } : {}
  )
  return TranscricaoResumoSchema.parse(data.data)
}

export async function apagarTranscricao(uuid: string): Promise<void> {
  await api.delete(`${URL_TRANSCRICOES}/${uuid}`)
}

export function obterUrlAudioTranscricao(uuid: string): string {
  const token = localStorage.getItem('token')
  const caminho = `${URL_TRANSCRICOES}/${uuid}/audio`
  return token ? `${caminho}?token=${encodeURIComponent(token)}` : caminho
}
