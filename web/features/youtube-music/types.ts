import { z } from 'zod'

export const EstadoContaYoutubeMusicSchema = z.enum([
  'nao_configurado',
  'conectada',
  'reconectar',
  'desconectada',
])

export type EstadoContaYoutubeMusic = z.infer<typeof EstadoContaYoutubeMusicSchema>

export const TocandoAgoraExtensaoSchema = z.object({
  titulo: z.string(),
  canal: z.string(),
  artistas: z.array(z.string()).default([]),
  album: z.string().nullable().default(null),
  urlCapa: z.string().nullable().default(null),
  videoId: z.string().default(''),
  identificada: z.boolean().default(false),
  inicioEm: z.string(),
  msOuvidos: z.number(),
  duracaoMs: z.number().nullable(),
  atualizadoEm: z.string().nullable().default(null),
  vezesOuvida: z.number().default(0),
  primeiraVezEm: z.string().nullable().default(null),
})

export type TocandoAgoraExtensao = z.infer<typeof TocandoAgoraExtensaoSchema>

export const ResumoExtensaoYoutubeSchema = z.object({
  aparelhosAtivos: z.number(),
  ultimoEventoEm: z.string().nullable(),
  tocandoAgora: TocandoAgoraExtensaoSchema.nullable(),
})

export type ResumoExtensaoYoutube = z.infer<typeof ResumoExtensaoYoutubeSchema>

export const TokenExtensaoYoutubeSchema = z.object({
  uuid: z.string(),
  nomeAparelho: z.string(),
  criadoEm: z.string(),
  ultimoUsoEm: z.string().nullable(),
})

export type TokenExtensaoYoutube = z.infer<typeof TokenExtensaoYoutubeSchema>

export const TokenExtensaoGeradoSchema = TokenExtensaoYoutubeSchema.extend({
  token: z.string(),
})

export type TokenExtensaoGerado = z.infer<typeof TokenExtensaoGeradoSchema>

export const StatusYoutubeMusicSchema = z.object({
  conectada: z.boolean(),
  status: EstadoContaYoutubeMusicSchema,
  statusDescricao: z.string(),
  nomeConta: z.string().nullable(),
  conectadoEm: z.string().nullable(),
  ultimaConsultaEm: z.string().nullable(),
  ultimaNovidadeEm: z.string().nullable(),
  erroMotivo: z.string().nullable(),
  totalReproducoesColetadas: z.number(),
  ultimaDetectada: z
    .object({
      titulo: z.string(),
      canal: z.string(),
      tocadaEm: z.string().nullable(),
    })
    .nullable()
    .optional(),
  extensao: ResumoExtensaoYoutubeSchema.optional(),
})

export type StatusYoutubeMusic = z.infer<typeof StatusYoutubeMusicSchema>

export const DesconectarYoutubeMusicSchema = z.object({
  desconectado: z.boolean(),
})

export const StatusImportacaoYoutubeSchema = z.enum([
  'enviada',
  'processando',
  'aguardando_confirmacao',
  'classificando',
  'concluida',
  'erro',
])

export type StatusImportacaoYoutube = z.infer<typeof StatusImportacaoYoutubeSchema>

export const RelatorioImportacaoYoutubeSchema = z.object({
  reproducoesLidas: z.number().default(0),
  videosUnicos: z.number().default(0),
  musicas: z.number().default(0),
  mashups: z.number().default(0),
  compilacoes: z.number().default(0),
  naoMusica: z.number().default(0),
  revisar: z.number().default(0),
  indisponiveis: z.number().default(0),
  pendentes: z.number().default(0),
  mesesComDados: z.number().default(0),
  custoEstimadoMicrodolares: z.number().default(0),
  custoRealMicrodolares: z.number().default(0),
})

export type DadosRelatorioImportacaoYoutube = z.infer<typeof RelatorioImportacaoYoutubeSchema>

export const ImportacaoYoutubeSchema = z.object({
  uuid: z.string(),
  status: StatusImportacaoYoutubeSchema,
  statusDescricao: z.string(),
  etapa: z.string(),
  etapaDescricao: z.string(),
  nomeArquivoOriginal: z.string().nullable(),
  tamanhoBytes: z.number().nullable(),
  leitura: z.object({
    totalLidos: z.number(),
    totalDescartados: z.number(),
    totalNovos: z.number(),
    totalIgnorados: z.number(),
    totalUnificados: z.number(),
    totalVideosNovos: z.number(),
    primeiraReproducaoEm: z.string().nullable(),
    ultimaReproducaoEm: z.string().nullable(),
  }),
  previa: z.object({
    descartadosPorRegra: z.number(),
    indisponiveis: z.number(),
    semIa: z.number(),
    paraIa: z.number(),
    tokensEntradaEstimados: z.number(),
    tokensSaidaEstimados: z.number(),
    custoEstimadoUsd: z.number(),
  }),
  classificacao: z.object({
    classificados: z.number(),
    tokensEntradaReais: z.number(),
    tokensSaidaReais: z.number(),
    custoRealUsd: z.number(),
    confirmadaEm: z.string().nullable(),
  }),
  relatorio: RelatorioImportacaoYoutubeSchema.nullable(),
  erroMotivo: z.string().nullable(),
  criadoEm: z.string(),
  iniciadoEm: z.string().nullable(),
  concluidoEm: z.string().nullable(),
  aguardandoConfirmacao: z.boolean(),
  isFinalizada: z.boolean(),
})

export type ImportacaoYoutube = z.infer<typeof ImportacaoYoutubeSchema>

export const ResumoIdentificacaoSchema = z.object({
  pendentes: z.number(),
  emRevisao: z.number(),
  compilacoes: z.number(),
  porStatus: z.record(z.string(), z.number()),
  total: z.number(),
})

export type ResumoIdentificacao = z.infer<typeof ResumoIdentificacaoSchema>
