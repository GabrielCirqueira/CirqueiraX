import { z } from 'zod'

export const DIRECOES_TRADUCAO = ['auto', 'pt_en', 'en_pt'] as const
export type DirecaoTraducao = (typeof DIRECOES_TRADUCAO)[number]

export const ModoPronunciaSchema = z.enum(['simples', 'clara', 'natural'])
export type ModoPronuncia = z.infer<typeof ModoPronunciaSchema>

export const TipoErroPronunciaSchema = z.enum(['traducao', 'pronuncia'])
export type TipoErroPronuncia = z.infer<typeof TipoErroPronunciaSchema>

export const PalavraPronunciadaSchema = z.object({
  tipo: z.literal('palavra'),
  texto: z.string(),
  chave: z.string(),
  silabas: z.array(z.string()),
  tonica: z.number().nullable(),
  figurada: z.string(),
  simples: z.string().default(''),
  fonemas: z.array(z.string()),
  origem: z.enum(['excecao', 'dicionario', 'derivada', 'aproximada']),
  origemDescricao: z.string(),
  aproximada: z.boolean(),
  dicas: z.array(z.string()),
  funcional: z.boolean(),
})
export type PalavraPronunciada = z.infer<typeof PalavraPronunciadaSchema>

export const PontuacaoSchema = z.object({ tipo: z.literal('pontuacao'), texto: z.string() })

export const ItemSentencaSchema = z.discriminatedUnion('tipo', [
  PalavraPronunciadaSchema,
  PontuacaoSchema,
])
export type ItemSentenca = z.infer<typeof ItemSentencaSchema>

export const SentencaPronunciadaSchema = z.object({
  texto: z.string(),
  pronuncia: z.string(),
  falaNatural: z.string(),
  simples: z.string().default(''),
  itens: z.array(ItemSentencaSchema),
})
export type SentencaPronunciada = z.infer<typeof SentencaPronunciadaSchema>

export const AnalisePronunciaSchema = z.object({
  versaoMotor: z.number(),
  pronuncia: z.string(),
  falaNatural: z.string(),
  simples: z.string().default(''),
  palavrasAproximadas: z.array(z.string()),
  sentencas: z.array(SentencaPronunciadaSchema),
})
export type AnalisePronuncia = z.infer<typeof AnalisePronunciaSchema>

export const FraseResumoSchema = z.object({
  uuid: z.string(),
  idiomaOrigem: z.enum(['pt', 'en']),
  textoPortugues: z.string(),
  textoIngles: z.string(),
  pronuncia: z.string(),
  pronunciaSimples: z.string().default(''),
  status: z.enum(['ok', 'reportada', 'corrigida']),
  statusDescricao: z.string(),
})
export type FraseResumo = z.infer<typeof FraseResumoSchema>

export const ConsultaResumoSchema = z.object({
  uuid: z.string(),
  favorita: z.boolean(),
  vezesConsultada: z.number(),
  ultimaConsultaEm: z.string(),
  frase: FraseResumoSchema,
})
export type ConsultaResumo = z.infer<typeof ConsultaResumoSchema>

export const ConsultaDetalheSchema = ConsultaResumoSchema.extend({
  analise: AnalisePronunciaSchema,
})
export type ConsultaDetalhe = z.infer<typeof ConsultaDetalheSchema>

export interface PaginaHistorico {
  consultas: ConsultaResumo[]
  total: number
}

export interface FiltrosHistorico {
  busca: string
  favoritas: boolean
}

export const UsoTraducaoSchema = z.object({
  configurado: z.boolean(),
  caracteresUsados: z.number(),
  limiteCaracteres: z.number(),
})
export type UsoTraducao = z.infer<typeof UsoTraducaoSchema>

export const PainelPronunciaSchema = z.object({
  palavrasDicionario: z.number(),
  excecoes: z.number(),
  frases: z.number(),
  relatosEmAberto: z.number(),
  usoTraducao: UsoTraducaoSchema,
})
export type PainelPronuncia = z.infer<typeof PainelPronunciaSchema>

export const CorrecaoPalavraSchema = z.object({ palavra: z.string(), pronuncia: z.string() })
export type CorrecaoPalavra = z.infer<typeof CorrecaoPalavraSchema>

export const RelatoPronunciaSchema = z.object({
  uuid: z.string(),
  tipo: TipoErroPronunciaSchema,
  tipoDescricao: z.string(),
  status: z.enum(['pendente', 'sugerido', 'aprovado', 'rejeitado']),
  statusDescricao: z.string(),
  emAberto: z.boolean(),
  palavra: z.string().nullable(),
  comentario: z.string().nullable(),
  autor: z.string().nullable(),
  textoInglesAntes: z.string(),
  pronunciaAntes: z.string(),
  sugestaoTraducao: z.string().nullable(),
  sugestaoPalavras: z.array(CorrecaoPalavraSchema),
  explicacaoSugestao: z.string().nullable(),
  criadoEm: z.string(),
  resolvidoEm: z.string().nullable(),
  frase: FraseResumoSchema,
})
export type RelatoPronuncia = z.infer<typeof RelatoPronunciaSchema>

export const ExcecaoPronunciaSchema = z.object({
  uuid: z.string(),
  palavra: z.string(),
  pronuncia: z.string(),
  observacao: z.string().nullable(),
  origem: z.enum(['manual', 'ia']),
  origemDescricao: z.string(),
  atualizadaEm: z.string(),
})
export type ExcecaoPronuncia = z.infer<typeof ExcecaoPronunciaSchema>

export interface ReportarErroPayload {
  tipo: TipoErroPronuncia
  palavra: string | null
  comentario: string | null
}

export interface AprovarRelatoPayload {
  traducao: string | null
  palavras: CorrecaoPalavra[]
}

export interface SalvarExcecaoPayload {
  palavra: string
  pronuncia: string
  observacao: string | null
}

export const TocandoAgoraPronunciaSchema = z.object({
  conectado: z.boolean(),
  proximaConsultaMs: z.number(),
  temItem: z.boolean(),
  emReproducao: z.boolean(),
  tipo: z.string(),
  codigoFaixa: z.string().nullable(),
  nome: z.string().nullable(),
  artistas: z.array(z.string()),
  album: z.string().nullable(),
  capaUrl: z.string().nullable(),
  duracaoMs: z.number(),
  progressoMs: z.number(),
  urlSpotify: z.string().nullable(),
  bloqueadoAte: z.string().nullable().optional(),
})
export type TocandoAgoraPronuncia = z.infer<typeof TocandoAgoraPronunciaSchema> & {
  consultadoEm: number
}

export const LinhaLetraSchema = z.object({
  inicioMs: z.number().nullable(),
  texto: z.string(),
  traducao: z.string().nullable(),
  analise: AnalisePronunciaSchema.nullable(),
})
export type LinhaLetra = z.infer<typeof LinhaLetraSchema>

export const LetraMusicaSchema = z.object({
  uuid: z.string(),
  codigoFaixa: z.string(),
  titulo: z.string(),
  artista: z.string(),
  situacao: z.enum(['sincronizada', 'simples', 'instrumental', 'nao_encontrada']),
  situacaoDescricao: z.string(),
  traduzida: z.boolean(),
  percentualAproximado: z.number(),
  linhas: z.array(LinhaLetraSchema),
})
export type LetraMusica = z.infer<typeof LetraMusicaSchema>

export interface FaixaParaLetra {
  codigoFaixa: string
  titulo: string
  artista: string
  album: string | null
  duracaoMs: number
}
