import { z } from 'zod'

export const statusLivroAudioSchema = z.enum([
  'enviado',
  'extraindo',
  'gerando_audio',
  'parcial',
  'pronto',
  'erro',
])

export const modoNotasLivroAudioSchema = z.enum(['normal', 'fim_capitulo', 'pular'])

export const pronunciaLivroSchema = z.object({
  de: z.string(),
  para: z.string(),
})

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
  modoNotas: modoNotasLivroAudioSchema.default('normal'),
  pronuncias: z.array(pronunciaLivroSchema).default([]),
  narracaoDesatualizada: z.boolean().default(false),
  status: statusLivroAudioSchema,
  statusDescricao: z.string(),
  erroMotivo: z.string().nullable(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  ultimaEscutaEm: z.string().nullable(),
  filaPausada: z.boolean().default(false),
  prioridadeFila: z.number().int().default(0),
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
  registradaEm: z.number().int().positive().optional(),
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

export const vozLivroAudioSchema = z.object({
  id: z.string(),
  nome: z.string(),
  descricao: z.string(),
  principal: z.boolean(),
  motor: z.enum(['edge', 'piper']).default('edge'),
  status: z.enum(['pronta', 'gerando', 'parcial', 'erro', 'nao_gerada']),
  totalBlocos: z.number(),
  blocosProntos: z.array(z.number()),
  blocosComErro: z.number(),
  tamanhoBytes: z.number().default(0),
  tamanhoEstimadoBytes: z.number().default(0),
})

export type VozLivroAudio = z.infer<typeof vozLivroAudioSchema>

export const linkArquivoSchema = z.object({
  url: z.string(),
  expiraEm: z.number().int(),
})

export const linkAmostraSchema = linkArquivoSchema.extend({ voz: z.string() })

export const linkBlocoSchema = linkArquivoSchema.extend({
  numeroBloco: z.number().int(),
  voz: z.string().nullable(),
})

export const itemFilaGeracaoSchema = z.object({
  uuid: z.string(),
  titulo: z.string(),
  posicao: z.number().int(),
  pausado: z.boolean(),
  priorizado: z.boolean(),
  ouvindoAgora: z.boolean(),
  paginaAtual: z.number().int(),
  totalPartes: z.number().int(),
  partesProntas: z.number().int(),
  partesRestantes: z.number().int(),
  gerandoAgora: z.boolean(),
  segundosParaTerminar: z.number().int().nullable(),
})

export const filaGeracaoSchema = z.object({
  segundosPorParte: z.number().int(),
  partesNaFila: z.number().int(),
  segundosRestantes: z.number().int(),
  livros: z.array(itemFilaGeracaoSchema),
})

export const estadoDiscoSchema = z.object({
  livreBytes: z.number(),
  totalBytes: z.number(),
  usadoBytes: z.number(),
  nivel: z.enum(['ok', 'atencao', 'critico']),
  bytesParaFila: z.number(),
  mensagem: z.string().nullable(),
})

export type LinkArquivo = z.infer<typeof linkArquivoSchema>
export type LinkAmostra = z.infer<typeof linkAmostraSchema>
export type LinkBloco = z.infer<typeof linkBlocoSchema>
export type ItemFilaGeracao = z.infer<typeof itemFilaGeracaoSchema>
export type FilaGeracao = z.infer<typeof filaGeracaoSchema>
export type EstadoDisco = z.infer<typeof estadoDiscoSchema>

export const tipoMarcacaoSchema = z.enum(['marcador', 'destaque', 'nota'])

export const retanguloMarcacaoSchema = z.object({
  pagina: z.number().int(),
  esquerda: z.number(),
  topo: z.number(),
  largura: z.number(),
  altura: z.number(),
})

export const marcacaoLivroSchema = z.object({
  uuid: z.string(),
  tipo: tipoMarcacaoSchema,
  tipoDescricao: z.string(),
  pagina: z.number().int(),
  numeroBloco: z.number().int().nullable(),
  indiceTrecho: z.number().int().nullable(),
  segundos: z.number().nullable(),
  texto: z.string().nullable(),
  nota: z.string().nullable(),
  retangulos: z.array(retanguloMarcacaoSchema).default([]),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
})

export type TipoMarcacao = z.infer<typeof tipoMarcacaoSchema>
export type RetanguloMarcacao = z.infer<typeof retanguloMarcacaoSchema>
export type MarcacaoLivro = z.infer<typeof marcacaoLivroSchema>

export interface CriarMarcacaoPayload {
  tipo: TipoMarcacao
  pagina: number
  numeroBloco?: number | null
  indiceTrecho?: number | null
  segundos?: number | null
  texto?: string | null
  nota?: string | null
  retangulos?: RetanguloMarcacao[]
}

export interface AlvoReproducao {
  id: number
  numeroBloco: number
  pagina: number
  indiceTrecho?: number | null
  indicePalavra?: number | null
  texto?: string | null
  busca?: string | null
  segundos?: number | null
}

export type TemaPagina = 'claro' | 'sepia' | 'escuro'

export type StatusLivroAudio = z.infer<typeof statusLivroAudioSchema>
export type LivroAudio = z.infer<typeof livroAudioSchema>
export type StatusLivroAudioBloco = z.infer<typeof statusLivroAudioBlocoSchema>
export type LivroAudioBloco = z.infer<typeof livroAudioBlocoSchema>
export type SalvarPosicaoLivro = z.infer<typeof salvarPosicaoLivroSchema>
export type TrechoNarracao = z.infer<typeof trechoNarracaoSchema>
export type PalavraNarracao = z.infer<typeof palavraNarracaoSchema>
export type ModoDestaqueNarracao = 'frase' | 'palavra'
export type ModoNotasLivroAudio = z.infer<typeof modoNotasLivroAudioSchema>
export type PronunciaLivro = z.infer<typeof pronunciaLivroSchema>

export interface ConfigurarNarracaoPayload {
  modoNotas: ModoNotasLivroAudio
  pronuncias: PronunciaLivro[]
}

export interface UploadLivroAudioPayload {
  arquivo: File
  titulo?: string
}
