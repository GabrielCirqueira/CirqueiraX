import type {
  AlbumAnalise,
  ArtistaAnalise,
  FonteReproducao,
  MusicaAnalise,
  PorFonte,
} from './types'

export interface FiltroBlocoMusica {
  periodo: 'dias' | 'mes' | 'ano' | 'todos'
  dias?: number
  ano?: number
  mes?: number
}

export interface PontoSerieMusica {
  data: string
  minutos: number
  streams: number
}

export interface VisaoGeralMusica {
  periodo: { tipo: string; rotulo: string; inicio: string | null; fim: string | null }
  totais: {
    minutos: number
    streams: number
    artistas: number
    musicas: number
    dias: number
    porFonte: PorFonte
    minutosEstimados: number
  }
  variacaoMinutosPercentual: number | null
  serie: { granularidade: 'dia' | 'mes'; pontos: PontoSerieMusica[] }
  porHora: { hora: number; minutos: number }[]
  topMusicas: MusicaAnalise[]
  topArtistas: ArtistaAnalise[]
  topAlbuns: AlbumAnalise[]
  artistasNovos: ArtistaAnalise[]
}

export type FaixaDoDia = 'madrugada' | 'manha' | 'tarde' | 'noite'

export interface RotinaMusica {
  porHora: { hora: number; minutos: number }[]
  porDiaSemana: { diaSemana: number; minutos: number }[]
  periodos: {
    faixa: FaixaDoDia
    inicio: number
    fim: number
    minutos: number
    topArtista: ArtistaAnalise | null
  }[]
}

export interface SessoesMusica {
  sessoes: number
  duracaoMediaMinutos: number
  maratonaMinutos: number
  maratonaInicio: string | null
  maratonaFim: string | null
  maratonaFaixas: number
  histograma: { ateMinutos: number | null; sessoes: number }[]
  maratonaMusicas: MusicaAnalise[]
}

export interface ItemComMusica {
  nome: string
  artista: string
  musicaUuid: string
  musica: MusicaAnalise | null
}

export interface ExtremosDiaMusica {
  aberturas: (ItemComMusica & { dias: number })[]
  fechamentos: (ItemComMusica & { dias: number })[]
}

export interface SaudadeMusica {
  diasSemOuvir: number
  itens: (ItemComMusica & {
    streams: number
    minutos: number
    ultima: string
    diasSemOuvir: number
  })[]
}

export interface ProfundidadeMusica {
  mesesNoPeriodo: number
  itens: {
    nome: string
    artistaUuid: string
    musicasDistintas: number
    mesesAtivos: number
    streams: number
    minutos: number
    artista: ArtistaAnalise | null
  }[]
}

export interface VersoesMusica {
  percentualAlteradas: number
  porTipo: { tipo: string; rotulo: string; streams: number; minutos: number; percentual: number }[]
  topVersoes: {
    musicaUuid: string
    tipo: string
    rotulo: string
    titulo: string
    urlCapa: string | null
    streams: number
    minutos: number
    musica: MusicaAnalise | null
  }[]
  mashups: (ItemComMusica & {
    streams: number
    minutos: number
    artistasComponentes: ArtistaAnalise[]
  })[]
}

export interface NesteDiaMusica {
  mes: number
  dia: number
  anos: { ano: number; streams: number; minutos: number; musicas: MusicaAnalise[] }[]
}

export interface AlbunsSequenciaMusica {
  itens: {
    data: string
    album: string
    artista: string
    faixas: number
    minutos: number
    musicaUuid: string | null
    musica: MusicaAnalise | null
  }[]
}

export interface ReproducaoRecenteMusica {
  musicaUuid: string
  fonte: FonteReproducao
  tocadaEm: string
  tocadaEmUtc: string
  minutos: number
  musica: MusicaAnalise | null
}

export interface PaginaUltimasOuvidas {
  itens: ReproducaoRecenteMusica[]
  proximoCursor: string | null
}

export interface ComparativoServicosMusica {
  meses: { ano: number; mes: number; minutos: number; porFonte: PorFonte }[]
  contagem: { spotify: number; youtube_music: number; ambas: number }
  soSpotify: MusicaAnalise[]
  soYoutubeMusic: MusicaAnalise[]
}
