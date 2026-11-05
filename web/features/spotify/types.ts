import { z } from 'zod'

export const StatusContaSpotifySchema = z.object({
  conectada: z.boolean(),
  status: z.enum(['desconectada', 'conectada', 'reconectar', 'revogada']),
  nomeExibicao: z.string().nullable(),
  urlFoto: z.string().nullable(),
  conectadoEm: z.string().nullable(),
  ultimaColetaEm: z.string().nullable(),
  coletaParada: z.boolean().optional(),
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

export const ItemRankingMusicaSchema = z.object({
  posicao: z.number(),
  codigoFaixa: z.string().nullable(),
  nomeFaixa: z.string(),
  artistaPrincipal: z.string(),
  album: z.string(),
  totalStreams: z.number(),
  totalMinutos: z.number(),
  urlSpotify: z.string().nullable().optional(),
  imagemUrl: z.string().nullable().optional(),
})

export type ItemRankingMusica = z.infer<typeof ItemRankingMusicaSchema>

export const ItemRankingArtistaSchema = z.object({
  posicao: z.number(),
  nomeArtista: z.string(),
  codigoArtista: z.string().nullable(),
  totalStreams: z.number(),
  totalMinutos: z.number(),
  urlSpotify: z.string().nullable().optional(),
  imagemUrl: z.string().nullable().optional(),
})

export type ItemRankingArtista = z.infer<typeof ItemRankingArtistaSchema>

export const ResumoIntervaloSchema = z.object({
  totalMinutos: z.number(),
  totalStreams: z.number(),
  variacaoMinutosPercentual: z.number().nullable(),
  topMusicas: z.array(ItemRankingMusicaSchema),
  topArtistas: z.array(ItemRankingArtistaSchema),
})

export type ResumoIntervalo = z.infer<typeof ResumoIntervaloSchema>

export const RankingIntervaloSchema = z.object({
  totalMinutos: z.number(),
  totalStreams: z.number(),
  variacaoMinutosPercentual: z.number().nullable(),
  topMusicas: z.array(ItemRankingMusicaSchema),
  topArtistas: z.array(ItemRankingArtistaSchema),
  rotuloPeriodo: z.string(),
  dataInicio: z.string(),
  dataFim: z.string(),
})

export type RankingIntervalo = z.infer<typeof RankingIntervaloSchema>

export const CuriosidadesSpotifySchema = z.object({
  horarioPico: z.string().nullable(),
  minutosHorarioPico: z.number(),
  diaSemanaMaisOuvido: z.string().nullable(),
  minutosDiaSemana: z.number(),
  diaMaisLongoData: z.string().nullable(),
  diaMaisLongoMinutos: z.number(),
  faixaMaisRepetidaNome: z.string().nullable(),
  faixaMaisRepetidaArtista: z.string().nullable(),
  faixaMaisRepetidaVezes: z.number(),
  faixaMaisRepetidaData: z.string().nullable(),
  artistasDescobertosNoMes: z.number(),
  mediaMinutosDiarios: z.number(),
  variacaoMediaDiariaPercentual: z.number().nullable(),
})

export type CuriosidadesSpotify = z.infer<typeof CuriosidadesSpotifySchema>

export const ResumoGeralSpotifySchema = z.object({
  hoje: ResumoIntervaloSchema,
  semana: ResumoIntervaloSchema,
  curiosidades: CuriosidadesSpotifySchema,
})

export type ResumoGeralSpotify = z.infer<typeof ResumoGeralSpotifySchema>

export const ItemRankingMusicaCapsulaSchema = z.object({
  posicao: z.number(),
  codigoFaixa: z.string().nullable(),
  nomeFaixa: z.string(),
  artistaPrincipal: z.string(),
  album: z.string(),
  totalStreams: z.number(),
  totalMinutos: z.number(),
  movimento: z.number().nullable(),
  isEstreia: z.boolean(),
  mesesNoTop5: z.number(),
  urlSpotify: z.string().nullable().optional(),
  imagemUrl: z.string().nullable().optional(),
})

export type ItemRankingMusicaCapsula = z.infer<typeof ItemRankingMusicaCapsulaSchema>

export const ItemRankingArtistaCapsulaSchema = z.object({
  posicao: z.number(),
  nomeArtista: z.string(),
  codigoArtista: z.string().nullable(),
  totalStreams: z.number(),
  totalMinutos: z.number(),
  movimento: z.number().nullable(),
  isEstreia: z.boolean(),
  urlSpotify: z.string().nullable().optional(),
  imagemUrl: z.string().nullable().optional(),
})

export type ItemRankingArtistaCapsula = z.infer<typeof ItemRankingArtistaCapsulaSchema>

export const MinutosPorDiaCapsulaSchema = z.object({
  data: z.string(),
  dia: z.number(),
  minutos: z.number(),
})

export type MinutosPorDiaCapsula = z.infer<typeof MinutosPorDiaCapsulaSchema>

export const CapsulaMensalSchema = z.object({
  ano: z.number(),
  mes: z.number(),
  rotulo: z.string(),
  emAndamento: z.boolean(),
  calculadoEm: z.string(),
  totalMinutos: z.number(),
  totalStreams: z.number(),
  faixasDistintas: z.number(),
  variacaoFaixasDistintasPercentual: z.number().nullable(),
  musicaMaisOuvida: ItemRankingMusicaCapsulaSchema.nullable(),
  artistaMaisOuvido: ItemRankingArtistaCapsulaSchema.nullable(),
  topMusicas: z.array(ItemRankingMusicaCapsulaSchema),
  topArtistas: z.array(ItemRankingArtistaCapsulaSchema),
  minutosPorDia: z.array(MinutosPorDiaCapsulaSchema),
})

export type CapsulaMensal = z.infer<typeof CapsulaMensalSchema>

export const ResumoMesCapsulaSchema = z.object({
  ano: z.number(),
  mes: z.number(),
  rotulo: z.string(),
  totalMinutos: z.number(),
  totalStreams: z.number(),
  musicaMaisOuvida: z.string().nullable(),
  artistaMaisOuvido: z.string().nullable(),
  isEmAndamento: z.boolean(),
})

export type ResumoMesCapsula = z.infer<typeof ResumoMesCapsulaSchema>

export const ItemConsultaImagemSchema = z.object({
  chave: z.string(),
  status: z.string(),
  imagemUrl: z.string().nullable(),
  urlSpotify: z.string().nullable(),
})

export type ItemConsultaImagem = z.infer<typeof ItemConsultaImagemSchema>

export const RespostaConsultaImagensSchema = z.record(z.string(), ItemConsultaImagemSchema)

export type RespostaConsultaImagens = z.infer<typeof RespostaConsultaImagensSchema>

export const ItemTopMusicaArtistaSchema = z.object({
  nomeFaixa: z.string(),
  codigoFaixa: z.string().nullable(),
  album: z.string(),
  totalStreams: z.number(),
  totalMinutos: z.number(),
  urlSpotify: z.string().nullable().optional(),
  imagemUrl: z.string().nullable().optional(),
})

export type ItemTopMusicaArtista = z.infer<typeof ItemTopMusicaArtistaSchema>
