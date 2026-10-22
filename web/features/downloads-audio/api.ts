import { api } from '@/config/api'
import type { RespostaApi, RespostaPaginada } from '@/shared/types/api'
import type { Audio, PaginaAudios } from './types'

const URL_AUDIOS = '/api/v1/audios'

export async function listarAudios(pagina: number, limite: number): Promise<PaginaAudios> {
  const { data } = await api.get<RespostaPaginada<Audio>>(URL_AUDIOS, {
    params: { pagina, limite },
  })
  return { audios: data.data, total: data.total, pagina: data.pagina, porPagina: data.porPagina }
}

export async function solicitarDownloadAudio(url: string): Promise<Audio> {
  const { data } = await api.post<RespostaApi<Audio>>(URL_AUDIOS, { url })
  return data.data
}

export async function rebaixarAudio(uuid: string): Promise<Audio> {
  const { data } = await api.post<RespostaApi<Audio>>(`${URL_AUDIOS}/${uuid}/rebaixar`)
  return data.data
}

export async function apagarAudio(uuid: string): Promise<void> {
  await api.delete(`${URL_AUDIOS}/${uuid}`)
}

function comToken(caminho: string): string {
  const token = localStorage.getItem('token')
  return token ? `${caminho}?token=${encodeURIComponent(token)}` : caminho
}

export function obterUrlArquivoAudio(uuid: string): string {
  return comToken(`${URL_AUDIOS}/${uuid}/arquivo`)
}

export function obterUrlReproducaoAudio(uuid: string): string {
  return comToken(`${URL_AUDIOS}/${uuid}/stream`)
}
