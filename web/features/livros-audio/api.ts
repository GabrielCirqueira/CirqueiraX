import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { z } from 'zod'
import {
  type LivroAudio,
  type LivroAudioBloco,
  type SalvarPosicaoLivro,
  type UploadLivroAudioPayload,
  livroAudioBlocoSchema,
  livroAudioSchema,
  salvarPosicaoLivroSchema,
} from './types'

const URL_LIVROS_AUDIO = '/api/v1/livros-audio'

function comToken(caminho: string): string {
  const token = localStorage.getItem('token')
  return token ? `${caminho}?token=${encodeURIComponent(token)}` : caminho
}

export async function listarLivrosAudio(): Promise<LivroAudio[]> {
  const { data } = await api.get<RespostaApi<unknown>>(URL_LIVROS_AUDIO)
  return z.array(livroAudioSchema).parse(data.data)
}

export async function obterLivroAudio(uuid: string): Promise<LivroAudio> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/${uuid}`)
  return livroAudioSchema.parse(data.data)
}

export async function listarBlocosLivroAudio(uuid: string): Promise<LivroAudioBloco[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/${uuid}/blocos`)
  return z.array(livroAudioBlocoSchema).parse(data.data)
}

export async function fazerUploadLivroAudio(payload: UploadLivroAudioPayload): Promise<LivroAudio> {
  const formData = new FormData()
  formData.append('arquivo', payload.arquivo)
  if (payload.titulo && payload.titulo.trim().length > 0) {
    formData.append('titulo', payload.titulo.trim())
  }

  const { data } = await api.post<RespostaApi<unknown>>(URL_LIVROS_AUDIO, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return livroAudioSchema.parse(data.data)
}

export async function salvarPosicaoLivroAudio(
  uuid: string,
  posicao: SalvarPosicaoLivro
): Promise<LivroAudio> {
  const dadosValidados = salvarPosicaoLivroSchema.parse(posicao)
  const { data } = await api.put<RespostaApi<unknown>>(
    `${URL_LIVROS_AUDIO}/${uuid}/posicao`,
    dadosValidados
  )
  return livroAudioSchema.parse(data.data)
}

export async function apagarLivroAudio(uuid: string): Promise<void> {
  await api.delete(`${URL_LIVROS_AUDIO}/${uuid}`)
}

export function obterUrlPdfLivro(uuid: string): string {
  return comToken(`${URL_LIVROS_AUDIO}/${uuid}/pdf`)
}

export function obterUrlStreamBloco(
  uuid: string,
  numeroBloco: number,
  tokenSobrescrever?: string
): string {
  const token = tokenSobrescrever ?? localStorage.getItem('token')
  const baseUrl = `${URL_LIVROS_AUDIO}/${uuid}/blocos/${numeroBloco}/stream`
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
}
