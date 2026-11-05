import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { z } from 'zod'
import {
  type ConfigurarNarracaoPayload,
  type CriarMarcacaoPayload,
  type EstadoDisco,
  type FilaGeracao,
  type LinkAmostra,
  type LinkArquivo,
  type LinkBloco,
  type LivroAudio,
  type LivroAudioBloco,
  type MarcacaoLivro,
  type SalvarPosicaoLivro,
  type TrechoNarracao,
  type UploadLivroAudioPayload,
  type VozLivroAudio,
  estadoDiscoSchema,
  filaGeracaoSchema,
  linkAmostraSchema,
  linkArquivoSchema,
  linkBlocoSchema,
  livroAudioBlocoSchema,
  livroAudioSchema,
  marcacaoLivroSchema,
  salvarPosicaoLivroSchema,
  trechoNarracaoSchema,
  vozLivroAudioSchema,
} from './types'
import { obterTrechosOffline } from './utils/offline'

const URL_LIVROS_AUDIO = '/api/v1/livros-audio'

function comBase<T extends { url: string }>(link: T): T {
  return { ...link, url: `${api.defaults.baseURL ?? ''}${link.url}` }
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
  if (!navigator.onLine) {
    const guardados = await obterTrechosOffline(uuid, numeroBloco, voz)
    if (guardados) return z.array(trechoNarracaoSchema).parse(guardados)
  }
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

export async function baixarPdfLivro(
  uuid: string,
  onProgresso?: (fracao: number) => void
): Promise<Blob> {
  const { data } = await api.get<Blob>(`${URL_LIVROS_AUDIO}/${uuid}/pdf`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
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

export async function listarLinksAmostras(): Promise<LinkAmostra[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/vozes/amostras`)
  return z.array(linkAmostraSchema).parse(data.data).map(comBase)
}

export async function listarLinksBlocos(uuid: string): Promise<LinkBloco[]> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/${uuid}/links`)
  return z.array(linkBlocoSchema).parse(data.data).map(comBase)
}

export async function obterLinkPdf(uuid: string): Promise<LinkArquivo> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/${uuid}/pdf/link`)
  return comBase(linkArquivoSchema.parse(data.data))
}

export async function abrirPdfEmNovaAba(uuid: string): Promise<void> {
  const janela = window.open('', '_blank')
  try {
    const { url } = await obterLinkPdf(uuid)
    if (janela) {
      janela.opener = null
      janela.location.href = url
    } else {
      window.location.href = url
    }
  } catch (erro) {
    janela?.close()
    throw erro
  }
}

export async function registrarEscutaLivro(uuid: string, segundos: number): Promise<void> {
  await api.post(`${URL_LIVROS_AUDIO}/${uuid}/escuta`, { segundos })
}

export async function obterFilaGeracao(): Promise<FilaGeracao> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/fila`)
  return filaGeracaoSchema.parse(data.data)
}

export async function obterEstadoDisco(): Promise<EstadoDisco> {
  const { data } = await api.get<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/disco`)
  return estadoDiscoSchema.parse(data.data)
}

export async function alterarFilaLivro(
  uuid: string,
  acao: 'pausar' | 'retomar' | 'priorizar'
): Promise<LivroAudio> {
  const { data } = await api.post<RespostaApi<unknown>>(`${URL_LIVROS_AUDIO}/${uuid}/fila/${acao}`)
  return livroAudioSchema.parse(data.data)
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
  return `${api.defaults.baseURL ?? ''}${URL_LIVROS_AUDIO}/${uuid}/pdf`
}

export function obterUrlRegistroEscuta(uuid: string): string {
  return `${api.defaults.baseURL ?? ''}${URL_LIVROS_AUDIO}/${uuid}/escuta`
}
