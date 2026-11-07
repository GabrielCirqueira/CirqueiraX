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

export const ArtistaAnaliseSchema = z.object({
  nome: z.string(),
  codigoArtista: z.string().nullable(),
  streams: z.number(),
  minutos: z.number(),
  imagemUrl: z.string().nullable(),
  urlSpotify: z.string().nullable(),
})

export type ArtistaAnalise = z.infer<typeof ArtistaAnaliseSchema>

export const MusicaAnaliseSchema = z.object({
  nomeFaixa: z.string(),
  artista: z.string(),
  codigoFaixa: z.string().nullable(),
  album: z.string(),
  streams: z.number(),
  minutos: z.number(),
  imagemUrl: z.string().nullable(),
  urlSpotify: z.string().nullable(),
})

export type MusicaAnalise = z.infer<typeof MusicaAnaliseSchema>

export const AlbumAnaliseSchema = z.object({
  album: z.string(),
  artista: z.string(),
  streams: z.number(),
  minutos: z.number(),
  faixasDistintas: z.number(),
  faixaReferencia: z.string(),
  codigoFaixaReferencia: z.string().nullable(),
  imagemUrl: z.string().nullable(),
  urlSpotify: z.string().nullable(),
})

export type AlbumAnalise = z.infer<typeof AlbumAnaliseSchema>

export const RankingIntervaloSchema = z.object({
  topAlbuns: z.array(AlbumAnaliseSchema).default([]),
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

export const TipoPeriodoAnaliseSchema = z.enum(['todos', 'ano', 'mes', 'dias', 'intervalo'])

export type TipoPeriodoAnalise = z.infer<typeof TipoPeriodoAnaliseSchema>

export const PeriodoAnaliseSchema = z.object({
  tipo: TipoPeriodoAnaliseSchema,
  rotulo: z.string(),
  inicio: z.string().nullable(),
  fim: z.string().nullable(),
})

export type PeriodoAnalise = z.infer<typeof PeriodoAnaliseSchema>

export interface FiltroPeriodoAnalise {
  periodo: TipoPeriodoAnalise
  dias?: number
  ano?: number
  mes?: number
}

export const PontoMensalSchema = z.object({
  ano: z.number(),
  mes: z.number(),
  streams: z.number(),
  minutos: z.number(),
})

export type PontoMensal = z.infer<typeof PontoMensalSchema>

export const MesNoTopoSchema = z.object({
  ano: z.number(),
  mes: z.number(),
  posicao: z.number(),
})

export type MesNoTopo = z.infer<typeof MesNoTopoSchema>

export const RepeticaoDiariaSchema = z.object({
  musica: MusicaAnaliseSchema,
  vezes: z.number(),
  data: z.string(),
})

export type RepeticaoDiaria = z.infer<typeof RepeticaoDiariaSchema>

export const ComportamentoReproducaoSchema = z.object({
  comDadoPulo: z.number(),
  puladas: z.number(),
  taxaPulos: z.number().nullable(),
  comDadoAleatorio: z.number(),
  aleatorias: z.number(),
  taxaAleatorio: z.number().nullable(),
})

export type ComportamentoReproducao = z.infer<typeof ComportamentoReproducaoSchema>

export const DetalheArtistaSchema = z.object({
  artista: ArtistaAnaliseSchema,
  reproducoes: z.number(),
  faixasDistintas: z.number(),
  albunsDistintos: z.number(),
  diasOuvidos: z.number(),
  primeiraVezEm: z.string().nullable(),
  ultimaVezEm: z.string().nullable(),
  posicaoGeral: z.number().nullable(),
  percentualDoTempoTotal: z.number(),
  evolucao: z.array(PontoMensalSchema),
  mesesNoTopo: z.array(MesNoTopoSchema),
  topMusicas: z.array(MusicaAnaliseSchema),
  topAlbuns: z.array(AlbumAnaliseSchema),
  maiorRepeticaoDiaria: RepeticaoDiariaSchema.nullable(),
  comportamento: ComportamentoReproducaoSchema,
})

export type DetalheArtista = z.infer<typeof DetalheArtistaSchema>

export const DetalheMusicaSchema = z.object({
  musica: MusicaAnaliseSchema,
  artista: ArtistaAnaliseSchema,
  reproducoes: z.number(),
  diasOuvidos: z.number(),
  primeiraVezEm: z.string().nullable(),
  ultimaVezEm: z.string().nullable(),
  posicaoGeral: z.number().nullable(),
  duracaoMs: z.number().nullable(),
  evolucao: z.array(PontoMensalSchema),
  mesesNoTopo: z.array(MesNoTopoSchema),
  recordeDiario: RepeticaoDiariaSchema.nullable(),
  comportamento: ComportamentoReproducaoSchema,
  outrasDoArtista: z.array(MusicaAnaliseSchema),
})

export type DetalheMusica = z.infer<typeof DetalheMusicaSchema>

export const CelulaMapaHorarioSchema = z.object({
  diaSemana: z.number(),
  hora: z.number(),
  minutos: z.number(),
  streams: z.number(),
})

export type CelulaMapaHorario = z.infer<typeof CelulaMapaHorarioSchema>

export const HabitosSpotifySchema = z.object({
  periodo: PeriodoAnaliseSchema,
  totalMinutos: z.number(),
  totalStreams: z.number(),
  mapaHorarios: z.array(CelulaMapaHorarioSchema),
  concentracao: z.object({
    artistasDistintos: z.number(),
    minutosTopArtistas: z.number(),
    percentualTopArtistas: z.number(),
    topArtistas: z.array(ArtistaAnaliseSchema),
    faixasDistintas: z.number(),
    faixasUmaVez: z.number(),
    percentualUmaVez: z.number(),
    streamsPorFaixa: z.number(),
    percentualRepeticao: z.number(),
  }),
  comportamento: ComportamentoReproducaoSchema,
})

export type HabitosSpotify = z.infer<typeof HabitosSpotifySchema>

export const SequenciasSchema = z.object({
  atual: z.number(),
  inicioAtual: z.string().nullable(),
  maior: z.number(),
  inicioMaior: z.string().nullable(),
  fimMaior: z.string().nullable(),
  ouviuHoje: z.boolean(),
})

export type Sequencias = z.infer<typeof SequenciasSchema>

export const RecordesSpotifySchema = z.object({
  totais: z.object({
    minutos: z.number(),
    streams: z.number(),
    artistas: z.number(),
    faixas: z.number(),
    dias: z.number(),
    desde: z.string().nullable(),
  }),
  sequencias: SequenciasSchema,
  diaRecorde: z.object({ data: z.string(), minutos: z.number() }).nullable(),
  mesRecorde: PontoMensalSchema.nullable(),
  musicaMaisOuvida: MusicaAnaliseSchema.nullable(),
  artistaMaisHoras: ArtistaAnaliseSchema.nullable(),
  maiorRepeticaoDiaria: RepeticaoDiariaSchema.nullable(),
})

export type RecordesSpotify = z.infer<typeof RecordesSpotifySchema>

export const EvolucaoMensalSchema = z.object({
  meses: z.array(PontoMensalSchema),
  comparacao: z.object({
    ano: z.number(),
    mes: z.number(),
    diaAtual: z.number(),
    minutosMesAtual: z.number(),
    minutosMesAnteriorAteMesmoDia: z.number(),
    variacaoMesAnterior: z.number().nullable(),
    minutosMesmoMesAnoAnteriorAteMesmoDia: z.number(),
    minutosMesmoMesAnoAnterior: z.number(),
    variacaoAnoAnterior: z.number().nullable(),
  }),
})

export type EvolucaoMensal = z.infer<typeof EvolucaoMensalSchema>

export const DescobertasSpotifySchema = z.object({
  periodo: PeriodoAnaliseSchema,
  totalArtistasNovos: z.number(),
  totalMusicasNovas: z.number(),
  diasJanelaObsessao: z.number(),
  artistasNovos: z.array(
    z.object({ artista: ArtistaAnaliseSchema, primeiraVezEm: z.string().nullable() })
  ),
  musicasNovas: z.array(
    z.object({ musica: MusicaAnaliseSchema, primeiraVezEm: z.string().nullable() })
  ),
  redescobertas: z.array(
    z.object({
      artista: ArtistaAnaliseSchema,
      ultimaVezAntes: z.string().nullable(),
      voltouEm: z.string().nullable(),
      diasAusente: z.number(),
    })
  ),
  obsessoes: z.array(
    z.object({
      musica: MusicaAnaliseSchema,
      vezesNaJanela: z.number(),
      totalNoPeriodo: z.number(),
      inicioJanela: z.string().nullable(),
      fimJanela: z.string().nullable(),
    })
  ),
})

export type DescobertasSpotify = z.infer<typeof DescobertasSpotifySchema>

export const RetrospectivaAnualSchema = z.object({
  ano: z.number(),
  anosDisponiveis: z.array(z.number()),
  emAndamento: z.boolean(),
  totalMinutos: z.number(),
  totalStreams: z.number(),
  artistasDistintos: z.number(),
  faixasDistintas: z.number(),
  diasOuvindo: z.number(),
  variacaoMinutosAnoAnterior: z.number().nullable(),
  topArtistas: z.array(ArtistaAnaliseSchema),
  topMusicas: z.array(MusicaAnaliseSchema),
  topAlbuns: z.array(AlbumAnaliseSchema),
  meses: z.array(PontoMensalSchema),
  momentoFavorito: z
    .object({ diaSemana: z.number(), hora: z.number(), minutos: z.number() })
    .nullable(),
  diaRecorde: z.object({ data: z.string(), minutos: z.number() }).nullable(),
  maiorSequencia: z.number(),
  inicioMaiorSequencia: z.string().nullable(),
  fimMaiorSequencia: z.string().nullable(),
  artistasNovos: z.number(),
  musicasNovas: z.number(),
  primeiraMusica: MusicaAnaliseSchema.nullable(),
  maiorRepeticaoDiaria: RepeticaoDiariaSchema.nullable(),
  percentualTopArtistas: z.number(),
})

export type RetrospectivaAnual = z.infer<typeof RetrospectivaAnualSchema>

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

export type ItemComImagemSpotify = MusicaAnalise | ArtistaAnalise | AlbumAnalise
