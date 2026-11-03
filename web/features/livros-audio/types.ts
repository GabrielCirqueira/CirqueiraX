import { z } from 'zod'

export const statusLivroAudioSchema = z.enum([
  'enviado',
  'extraindo',
  'gerando_audio',
  'parcial',
  'pronto',
  'erro',
])

export const livroAudioSchema = z.object({
  uuid: z.string().uuid(),
  titulo: z.string(),
  totalPaginas: z.number().int().nullable(),
  paginaAtual: z.number().int(),
  blocoAtual: z.number().int().nullable(),
  segundosNoBloco: z.number().int(),
  tamanhoBytes: z.number().int(),
  tamanhoTotalBytes: z.number().int().optional(),
  idioma: z.string().nullable(),
  idiomaDescricao: z.string().nullable(),
  totalBlocos: z.number().int(),
  blocosProntos: z.number().int(),
  blocosComErro: z.number().int(),
  segundosAudioProntos: z.number().int(),
  temAudioParaOuvir: z.boolean(),
  status: statusLivroAudioSchema,
  statusDescricao: z.string(),
  erroMotivo: z.string().nullable(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  ultimaEscutaEm: z.string().nullable(),
  isEnviado: z.boolean(),
  isExtraindo: z.boolean(),
  isGerandoAudio: z.boolean(),
  isParcial: z.boolean(),
  isPronto: z.boolean(),
  isErro: z.boolean(),
  isEmProcessamento: z.boolean(),
  isDisponivelParaOuvir: z.boolean(),
})

export const salvarPosicaoLivroSchema = z.object({
  paginaAtual: z.number().int().min(1),
  blocoAtual: z.number().int().min(0).nullable().optional(),
  segundosNoBloco: z.number().int().min(0).default(0),
})

export const statusLivroAudioBlocoSchema = z.enum(['pendente', 'gerando', 'pronto', 'erro'])

export const livroAudioBlocoSchema = z.object({
  uuid: z.string().uuid(),
  numeroBloco: z.number().int(),
  paginaInicio: z.number().int(),
  paginaFim: z.number().int(),
  duracaoSegundos: z.number().int().nullable(),
  tamanhoBytes: z.number().int().nullable(),
  status: statusLivroAudioBlocoSchema,
  statusDescricao: z.string(),
  isPronto: z.boolean(),
  isGerando: z.boolean(),
  isPendente: z.boolean(),
  isErro: z.boolean(),
  possuiTrechos: z.boolean(),
  possuiPalavras: z.boolean().default(false),
  erroMotivo: z.string().nullable(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
})

export const palavraNarracaoSchema = z.object({
  inicio: z.number(),
  fim: z.number(),
  texto: z.string(),
})

export const trechoNarracaoSchema = z.object({
  inicio: z.number(),
  fim: z.number(),
  texto: z.string(),
  palavras: z.array(palavraNarracaoSchema).default([]),
})

export type StatusLivroAudio = z.infer<typeof statusLivroAudioSchema>
export type LivroAudio = z.infer<typeof livroAudioSchema>
export type StatusLivroAudioBloco = z.infer<typeof statusLivroAudioBlocoSchema>
export type LivroAudioBloco = z.infer<typeof livroAudioBlocoSchema>
export type SalvarPosicaoLivro = z.infer<typeof salvarPosicaoLivroSchema>
export type TrechoNarracao = z.infer<typeof trechoNarracaoSchema>
export type PalavraNarracao = z.infer<typeof palavraNarracaoSchema>
export type ModoDestaqueNarracao = 'frase' | 'palavra'

export interface UploadLivroAudioPayload {
  arquivo: File
  titulo?: string
}
