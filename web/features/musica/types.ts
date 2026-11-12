import { z } from 'zod'

export const FonteMusicaSchema = z.enum(['todas', 'spotify', 'youtube_music'])

export type FonteMusica = z.infer<typeof FonteMusicaSchema>

export const FonteReproducaoSchema = z.enum(['spotify', 'youtube_music'])

export type FonteReproducao = z.infer<typeof FonteReproducaoSchema>

export const DivisaoFonteSchema = z.object({
  streams: z.number(),
  minutos: z.number(),
})

export type DivisaoFonte = z.infer<typeof DivisaoFonteSchema>

export const PorFonteSchema = z.preprocess(
  (valor) => (Array.isArray(valor) ? {} : valor),
  z.object({
    spotify: DivisaoFonteSchema.optional(),
    youtube_music: DivisaoFonteSchema.optional(),
  })
)

export type PorFonte = z.infer<typeof PorFonteSchema>

const CamposFonteSchema = {
  fontes: z.array(FonteReproducaoSchema).optional(),
  porFonte: PorFonteSchema.optional(),
  estimado: z.boolean().optional(),
}

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
  musicaUuid: z.string().nullable().optional(),
  artistas: z.array(z.string()).optional(),
  mashup: z.boolean().optional(),
  urlYoutubeMusic: z.string().nullable().optional(),
  ...CamposFonteSchema,
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
  artistaUuid: z.string().nullable().optional(),
  ...CamposFonteSchema,
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
  artistaUuid: z.string().nullable().optional(),
  ...CamposFonteSchema,
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
  musicaUuid: z.string().nullable().optional(),
  artistas: z.array(z.string()).optional(),
  mashup: z.boolean().optional(),
  urlYoutubeMusic: z.string().nullable().optional(),
  ...CamposFonteSchema,
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

export const CuriosidadesMusicaSchema = z.object({
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

export type CuriosidadesMusica = z.infer<typeof CuriosidadesMusicaSchema>

export const ResumoGeralMusicaSchema = z.object({
  hoje: ResumoIntervaloSchema,
  semana: ResumoIntervaloSchema,
  curiosidades: CuriosidadesMusicaSchema,
})

export type ResumoGeralMusica = z.infer<typeof ResumoGeralMusicaSchema>

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
  ...CamposFonteSchema,
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
  ...CamposFonteSchema,
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
  musicaUuid: z.string().nullable().optional(),
  artistas: z.array(z.string()).optional(),
  mashup: z.boolean().optional(),
  urlYoutubeMusic: z.string().nullable().optional(),
  ...CamposFonteSchema,
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
  porFonte: PorFonteSchema.optional(),
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

export const DivisaoFonteDetalheSchema = z.object({
  streams: z.number(),
  minutos: z.number(),
  primeira: z.string().nullable().optional(),
  ultima: z.string().nullable().optional(),
})

export type DivisaoFonteDetalhe = z.infer<typeof DivisaoFonteDetalheSchema>

export const PorFonteDetalheSchema = z.preprocess(
  (valor) => (Array.isArray(valor) ? {} : valor),
  z.object({
    spotify: DivisaoFonteDetalheSchema.optional(),
    youtube_music: DivisaoFonteDetalheSchema.optional(),
  })
)

export type PorFonteDetalhe = z.infer<typeof PorFonteDetalheSchema>

export const VarianteMusicaSchema = z.object({
  fonte: FonteReproducaoSchema,
  titulo: z.string(),
  canal: z.string(),
  codigo: z.string().nullable(),
  videoUuid: z.string().nullable().optional(),
  tipoVersao: z.string().nullable(),
  urlCapa: z.string().nullable(),
  url: z.string().nullable(),
  streams: z.number(),
  minutos: z.number(),
})

export type VarianteMusica = z.infer<typeof VarianteMusicaSchema>

export const ComponenteMashupSchema = z.object({
  texto: z.string(),
  musicaUuid: z.string().nullable(),
  titulo: z.string().nullable(),
})

export type ComponenteMashup = z.infer<typeof ComponenteMashupSchema>

export const VersoesMusicaSchema = z.object({
  mashup: z.boolean(),
  variantes: z.array(VarianteMusicaSchema),
  componentes: z.array(ComponenteMashupSchema),
  artistas: z.array(z.string()),
})

export type VersoesMusica = z.infer<typeof VersoesMusicaSchema>

export const UuidResolvidoSchema = z.object({ uuid: z.string() })

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
  porFonte: PorFonteDetalheSchema.optional(),
  minutosEstimados: z.number().optional(),
  mashups: z.array(MusicaAnaliseSchema).default([]),
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
  porFonte: PorFonteDetalheSchema.optional(),
  minutosEstimados: z.number().optional(),
  variantes: z.array(VarianteMusicaSchema).default([]),
  componentes: z.array(ComponenteMashupSchema).default([]),
})

export type DetalheMusica = z.infer<typeof DetalheMusicaSchema>

export const CelulaMapaHorarioSchema = z.object({
  diaSemana: z.number(),
  hora: z.number(),
  minutos: z.number(),
  streams: z.number(),
})

export type CelulaMapaHorario = z.infer<typeof CelulaMapaHorarioSchema>

export const HabitosMusicaSchema = z.object({
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

export type HabitosMusica = z.infer<typeof HabitosMusicaSchema>

export const SequenciasSchema = z.object({
  atual: z.number(),
  inicioAtual: z.string().nullable(),
  maior: z.number(),
  inicioMaior: z.string().nullable(),
  fimMaior: z.string().nullable(),
  ouviuHoje: z.boolean(),
})

export type Sequencias = z.infer<typeof SequenciasSchema>

export const RecordesMusicaSchema = z.object({
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

export type RecordesMusica = z.infer<typeof RecordesMusicaSchema>

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

export const DescobertasMusicaSchema = z.object({
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

export type DescobertasMusica = z.infer<typeof DescobertasMusicaSchema>

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

export type ItemComImagemMusica = MusicaAnalise | ArtistaAnalise | AlbumAnalise
