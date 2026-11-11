import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import {
  DesconectarYoutubeMusicSchema,
  type ImportacaoYoutube,
  ImportacaoYoutubeSchema,
  type ResumoIdentificacao,
  ResumoIdentificacaoSchema,
  type StatusYoutubeMusic,
  StatusYoutubeMusicSchema,
} from './types'

const PREFIXO = '/api/v1/youtube-music'

export async function obterStatusYoutubeMusic(): Promise<StatusYoutubeMusic> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO}/status`)
  return StatusYoutubeMusicSchema.parse(data.data)
}

export async function conectarYoutubeMusic(cabecalhos: string): Promise<StatusYoutubeMusic> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/conectar`, { cabecalhos })
  return StatusYoutubeMusicSchema.parse(data.data)
}

export async function desconectarYoutubeMusic(): Promise<boolean> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/desconectar`)
  return DesconectarYoutubeMusicSchema.parse(data.data).desconectado
}

export async function iniciarImportacaoYoutube(arquivo: File): Promise<ImportacaoYoutube> {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/importacoes`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return ImportacaoYoutubeSchema.parse(data.data)
}

export async function consultarImportacaoYoutube(uuid: string): Promise<ImportacaoYoutube> {
  const { data } = await api.get<RespostaApi<unknown>>(`${PREFIXO}/importacoes/${uuid}`)
  return ImportacaoYoutubeSchema.parse(data.data)
}

export async function confirmarImportacaoYoutube(uuid: string): Promise<ImportacaoYoutube> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/importacoes/${uuid}/confirmar`)
  return ImportacaoYoutubeSchema.parse(data.data)
}

export async function cancelarClassificacaoImportacaoYoutube(
  uuid: string
): Promise<ImportacaoYoutube> {
  const { data } = await api.post<RespostaApi<unknown>>(`${PREFIXO}/importacoes/${uuid}/cancelar`)
  return ImportacaoYoutubeSchema.parse(data.data)
}

export async function obterResumoIdentificacao(): Promise<ResumoIdentificacao> {
  const { data } = await api.get<RespostaApi<unknown>>('/api/v1/musica/identificacao/resumo')
  return ResumoIdentificacaoSchema.parse(data.data)
}
