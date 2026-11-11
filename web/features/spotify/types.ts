import { z } from 'zod'

export const StatusContaSpotifySchema = z.object({
  conectada: z.boolean(),
  status: z.enum(['desconectada', 'conectada', 'reconectar', 'revogada']),
  nomeExibicao: z.string().nullable(),
  urlFoto: z.string().nullable(),
  conectadoEm: z.string().nullable(),
  ultimaColetaEm: z.string().nullable(),
  coletaParada: z.boolean().optional(),
  bloqueadoAte: z.string().nullable().optional(),
  motivoBloqueio: z.string().nullable().optional(),
})

export type StatusContaSpotify = z.infer<typeof StatusContaSpotifySchema>

export const UrlAutorizacaoSpotifySchema = z.object({
  url: z.string(),
  state: z.string(),
})

export type UrlAutorizacaoSpotify = z.infer<typeof UrlAutorizacaoSpotifySchema>

export const ConcluirAutorizacaoSpotifyPayloadSchema = z.object({
  code: z.string(),
  state: z.string(),
})

export type ConcluirAutorizacaoSpotifyPayload = z.infer<
  typeof ConcluirAutorizacaoSpotifyPayloadSchema
>

export const DesconectarSpotifySchema = z.object({
  desconectado: z.boolean(),
  reproducoesRemovidas: z.number(),
})

export type DesconectarSpotify = z.infer<typeof DesconectarSpotifySchema>

export const ResultadoSincronizacaoSpotifySchema = z.object({
  totalColetadas: z.number(),
  totalNovas: z.number(),
  totalDuplicadas: z.number(),
})

export type ResultadoSincronizacaoSpotify = z.infer<typeof ResultadoSincronizacaoSpotifySchema>

export const StatusImportacaoSpotifyEnum = z.enum(['enviada', 'processando', 'concluida', 'erro'])

export type TipoStatusImportacaoSpotify = z.infer<typeof StatusImportacaoSpotifyEnum>

export const ImportacaoSpotifySchema = z.object({
  uuid: z.string(),
  status: StatusImportacaoSpotifyEnum,
  nomeArquivoOriginal: z.string(),
  tamanhoBytes: z.number(),
  totalLidos: z.number(),
  totalNovos: z.number(),
  totalIgnorados: z.number(),
  totalSubstituidos: z.number(),
  erroMotivo: z.string().nullable(),
  criadoEm: z.string(),
  iniciadoEm: z.string().nullable(),
  concluidoEm: z.string().nullable(),
})

export type ImportacaoSpotify = z.infer<typeof ImportacaoSpotifySchema>

export const TocandoAgoraSchema = z.object({
  temItem: z.boolean(),
  emReproducao: z.boolean(),
  tipo: z.string(),
  codigoFaixa: z.string().nullable(),
  nome: z.string().nullable(),
  artistas: z.array(z.string()),
  codigoArtista: z.string().nullable(),
  album: z.string().nullable(),
  capaUrl: z.string().nullable(),
  duracaoMs: z.number(),
  progressoMs: z.number(),
  urlSpotify: z.string().nullable(),
  vezesOuvida: z.number(),
  primeiraVezEm: z.string().nullable(),
})

export type TocandoAgora = z.infer<typeof TocandoAgoraSchema> & { consultadoEm: number }
