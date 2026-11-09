import { z } from 'zod'

export const StatusTranscricaoSchema = z.enum(['na_fila', 'transcrevendo', 'concluida', 'erro'])
export const StatusCorrecaoTranscricaoSchema = z.enum([
  'na_fila',
  'corrigindo',
  'concluida',
  'erro',
])
export const IdiomaTranscricaoSchema = z.enum(['auto', 'pt', 'en', 'es'])
export const FiltroListagemTranscricaoSchema = z.enum([
  'todas',
  'em_andamento',
  'concluidas',
  'favoritas',
  'com_erro',
])

export const SegmentoTranscricaoSchema = z.object({
  inicio: z.number(),
  fim: z.number(),
  texto: z.string(),
})

export const TranscricaoResumoSchema = z.object({
  uuid: z.string(),
  titulo: z.string(),
  nomeArquivoOriginal: z.string(),
  mimeType: z.string().nullable(),
  tamanhoBytes: z.number().nullable(),
  duracaoSegundos: z.number().nullable(),
  idiomaSolicitado: IdiomaTranscricaoSchema,
  idiomaDetectado: z.string().nullable(),
  status: StatusTranscricaoSchema,
  statusDescricao: z.string(),
  progresso: z.number(),
  previaTexto: z.string().nullable(),
  totalPalavras: z.number(),
  erroMotivo: z.string().nullable(),
  favorita: z.boolean(),
  origemVideo: z.boolean(),
  statusCorrecao: StatusCorrecaoTranscricaoSchema.nullable(),
  statusCorrecaoDescricao: z.string().nullable(),
  erroCorrecao: z.string().nullable(),
  isCorrecaoEmAndamento: z.boolean(),
  isCorrigivel: z.boolean(),
  corrigidoEm: z.string().nullable(),
  isEmAndamento: z.boolean(),
  isAudioDisponivel: z.boolean(),
  isReprocessavel: z.boolean(),
  isApagavel: z.boolean(),
  segundosRestantesEstimados: z.number().nullable(),
  segundosProcessamento: z.number().nullable(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  iniciadoEm: z.string().nullable(),
  concluidoEm: z.string().nullable(),
  audioExpiraEm: z.string().nullable(),
  audioExpiradoEm: z.string().nullable(),
})

export const TranscricaoDetalheSchema = TranscricaoResumoSchema.extend({
  texto: z.string().nullable(),
  textoCorrigido: z.string().nullable(),
  segmentos: z.array(SegmentoTranscricaoSchema),
})

export const ResumoTranscricoesSchema = z.object({
  total: z.number(),
  concluidas: z.number(),
  naFila: z.number(),
  transcrevendo: z.number(),
  comErro: z.number(),
  favoritas: z.number(),
  segundosTranscritos: z.number(),
  totalPalavras: z.number(),
  segundosRestantesEstimados: z.number(),
})

export type StatusTranscricao = z.infer<typeof StatusTranscricaoSchema>
export type StatusCorrecaoTranscricao = z.infer<typeof StatusCorrecaoTranscricaoSchema>
export type IdiomaTranscricao = z.infer<typeof IdiomaTranscricaoSchema>
export type FiltroListagemTranscricao = z.infer<typeof FiltroListagemTranscricaoSchema>
export type SegmentoTranscricao = z.infer<typeof SegmentoTranscricaoSchema>
export type TranscricaoResumo = z.infer<typeof TranscricaoResumoSchema>
export type TranscricaoDetalhe = z.infer<typeof TranscricaoDetalheSchema>
export type ResumoTranscricoes = z.infer<typeof ResumoTranscricoesSchema>

export interface PaginaTranscricoes {
  transcricoes: TranscricaoResumo[]
  total: number
  pagina: number
  porPagina: number
}

export interface FiltrosTranscricoes {
  busca: string
  filtro: FiltroListagemTranscricao
}

export interface AtualizarTranscricaoPayload {
  titulo?: string
  favorita?: boolean
}

export type SituacaoEnvio = 'aguardando' | 'enviando' | 'enviado' | 'falhou'

export interface EnvioAudio {
  id: string
  nome: string
  tamanhoBytes: number
  percentual: number
  situacao: SituacaoEnvio
  erro: string | null
}

export type FormatoExportacao = 'txt' | 'srt' | 'vtt' | 'md'

export type ModoVisualizacaoTexto = 'trechos' | 'corrido' | 'corrigido'

export type PaletaStatusTranscricao = 'gray' | 'amber' | 'green' | 'red' | 'brand'

export interface AparenciaStatusTranscricao {
  rotulo: string
  paleta: PaletaStatusTranscricao
}

export interface ParteTextoDestacado {
  texto: string
  destaque: boolean
}
