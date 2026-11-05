import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { z } from 'zod'
import {
  type ConfigurarNarracaoPayload,
  type CriarMarcacaoPayload,
  type LivroAudio,
  type LivroAudioBloco,
  type MarcacaoLivro,
  type SalvarPosicaoLivro,
  type TrechoNarracao,
  type UploadLivroAudioPayload,
  type VozLivroAudio,
  livroAudioBlocoSchema,
  livroAudioSchema,
  marcacaoLivroSchema,
  salvarPosicaoLivroSchema,
  trechoNarracaoSchema,
  vozLivroAudioSchema,
} from './types'
import { obterTrechosOffline } from './utils/offline'

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

export async function listarTrechosBloco(
  uuid: string,
  numeroBloco: number,
  voz: string | null = null
): Promise<TrechoNarracao[]> {
  try {
    return await listarTrechosBlocoDaRede(uuid, numeroBloco, voz)
  } catch (erro) {
    const offline = await obterTrechosOffline(uuid, numeroBloco, voz)
    if (offline) return z.array(trechoNarracaoSchema).parse(offline)
    throw erro
  }
}

export async function listarTrechosBlocoDaRede(
  uuid: string,
  numeroBloco: number,
  voz: string | null = null
): Promise<TrechoNarracao[]> {
  const { data } = await api.get<RespostaApi<unknown>>(
    `${URL_LIVROS_AUDIO}/${uuid}/blocos/${numeroBloco}/trechos`,
    { params: voz ? { voz } : undefined }
  )
  return z.array(trechoNarracaoSchema).parse(data.data)
}

export async function baixarAudioBloco(
  uuid: string,
  numeroBloco: number,
  voz: string | null,
  onProgresso?: (fracao: number) => void
): Promise<Blob> {
  const { data } = await api.get<Blob>(`${URL_LIVROS_AUDIO}/${uuid}/blocos/${numeroBloco}/stream`, {
    params: voz ? { voz } : undefined,
    responseType: 'blob',
    headers: { Accept: 'audio/mpeg' },
    onDownloadProgress: (evento) => {
      if (onProgresso && evento.total) onProgresso(evento.loaded / evento.total)
    },
  })
  return data
}

export async function listarMarcacoesLivro(uuid: string): Promise<MarcacaoLivro[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/${uuid}/marcacoes`)
  return z.array(marcacaoLivroSchema).parse(data.data)
}

export async function criarMarcacaoLivro(
  uuid: string,
  payload: CriarMarcacaoPayload
): Promise<MarcacaoLivro> {
  const { data } = await api.post<RespostaApi<unknown>>(
    `${URL_LIVROS_AUDIO}/${uuid}/marcacoes`,
    payload
  )
  return marcacaoLivroSchema.parse(data.data)
}

export async function atualizarMarcacaoLivro(
  uuid: string,
  marcacao: string,
  nota: string | null
): Promise<MarcacaoLivro> {
  const { data } = await api.patch<RespostaApi<unknown>>(
    `${URL_LIVROS_AUDIO}/${uuid}/marcacoes/${marcacao}`,
    { nota }
  )
  return marcacaoLivroSchema.parse(data.data)
}

export async function removerMarcacaoLivro(uuid: string, marcacao: string): Promise<void> {
  await api.delete(`${URL_LIVROS_AUDIO}/${uuid}/marcacoes/${marcacao}`)
}

export async function listarVozesLivro(uuid: string): Promise<VozLivroAudio[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/${uuid}/vozes`)
  return z.array(vozLivroAudioSchema).parse(data.data)
}

export async function solicitarVozLivro(uuid: string, voz: string): Promise<VozLivroAudio[]> {
  const { data } = await api.post<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/${uuid}/vozes`, {
    voz,
  })
  return z.array(vozLivroAudioSchema).parse(data.data)
}

export async function removerVozLivro(uuid: string, voz: string): Promise<VozLivroAudio[]> {
  const { data } = await api.delete<RespostaApi<unknown>>(
    `${URL_LIVROS_AUDIO}/${uuid}/vozes/${encodeURIComponent(voz)}`
  )
  return z.array(vozLivroAudioSchema).parse(data.data)
}

export async function configurarNarracaoLivro(
  uuid: string,
  payload: ConfigurarNarracaoPayload
): Promise<LivroAudio> {
  const { data } = await api.put<RespostaApi<unknown>>(
    `${URL_LIVROS_AUDIO}/${uuid}/narracao`,
    payload
  )
  return livroAudioSchema.parse(data.data)
}

export function obterUrlAmostraVoz(voz: string): string {
  return comToken(`${URL_LIVROS_AUDIO}/vozes/${encodeURIComponent(voz)}/amostra`)
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
  voz: string | null = null,
  versao?: string,
  tokenSobrescrever?: string
): string {
  const token = tokenSobrescrever ?? localStorage.getItem('token')
  const parametros = new URLSearchParams()
  if (voz) parametros.set('voz', voz)
  if (versao) parametros.set('v', String(Date.parse(versao) || versao))
  if (token) parametros.set('token', token)
  const consulta = parametros.toString()
  const baseUrl = `${URL_LIVROS_AUDIO}/${uuid}/blocos/${numeroBloco}/stream`
  return consulta ? `${baseUrl}?${consulta}` : baseUrl
}
