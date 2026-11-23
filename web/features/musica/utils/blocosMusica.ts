import type {
  AlbumAnalise,
  ItemRankingArtista,
  ItemRankingMusica,
  MusicaAnalise,
  PorFonte,
} from '../types'
import type {
  FaixaDoDia,
  FiltroBlocoMusica,
  PontoSerieMusica,
  ReproducaoRecenteMusica,
} from '../typesBlocos'
import { gerarRotaArtista, gerarRotaMusica } from './analiseMusica'
import { formatarNomeMesAbreviado } from './formatadoresMusica'

export interface OpcaoPeriodoBloco {
  chave: string
  rotulo: string
  filtro: FiltroBlocoMusica
}

export function criarOpcoesPeriodoVisao(anoAtual: number): OpcaoPeriodoBloco[] {
  return [
    { chave: 'hoje', rotulo: 'Hoje', filtro: { periodo: 'dias', dias: 1 } },
    { chave: 'ontem', rotulo: 'Ontem', filtro: { periodo: 'ontem' } },
    { chave: '7d', rotulo: '7 dias', filtro: { periodo: 'dias', dias: 7 } },
    { chave: '30d', rotulo: '30 dias', filtro: { periodo: 'dias', dias: 30 } },
    { chave: '90d', rotulo: '90 dias', filtro: { periodo: 'dias', dias: 90 } },
    { chave: 'ano', rotulo: String(anoAtual), filtro: { periodo: 'ano', ano: anoAtual } },
    { chave: 'todos', rotulo: 'Sempre', filtro: { periodo: 'todos' } },
  ]
}

export function criarOpcoesPeriodoBlocos(anoAtual: number): OpcaoPeriodoBloco[] {
  return criarOpcoesPeriodoVisao(anoAtual).filter(
    (opcao) => opcao.chave !== 'hoje' && opcao.chave !== 'ontem'
  )
}

export function filtroDaOpcao(opcoes: OpcaoPeriodoBloco[], chave: string): FiltroBlocoMusica {
  return opcoes.find((opcao) => opcao.chave === chave)?.filtro ?? { periodo: 'dias', dias: 30 }
}

export const ROTULOS_FAIXA_DO_DIA: Record<FaixaDoDia, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

export const CORES_FAIXA_DO_DIA: Record<FaixaDoDia, string> = {
  madrugada: 'cirqueira.musica.azul',
  manha: 'cirqueira.musica.amarelo',
  tarde: 'cirqueira.musica.verde',
  noite: 'cirqueira.musica.fonteYoutubeMusic',
}

export function faixaDaHora(hora: number): FaixaDoDia {
  if (hora < 6) return 'madrugada'
  if (hora < 12) return 'manha'
  if (hora < 18) return 'tarde'
  return 'noite'
}

export function encontrarPico<T extends { minutos: number }>(itens: T[]): T | null {
  return itens.reduce<T | null>(
    (maior, item) => (maior === null || item.minutos > maior.minutos ? item : maior),
    null
  )
}

export function proporcao(valor: number, maximo: number): number {
  if (maximo <= 0) return 0
  return Math.round((valor / maximo) * 100)
}

export const NOMES_DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function rotuloFaixaSessao(ateMinutos: number | null, anterior: number | null): string {
  const formatar = (minutos: number) => (minutos < 60 ? `${minutos} min` : `${minutos / 60} h`)
  if (ateMinutos === null) return `${formatar(anterior ?? 0)}+`
  if (anterior === null) return `< ${formatar(ateMinutos)}`
  return `${formatar(anterior)}–${formatar(ateMinutos)}`
}

export function rotuloPontoSerie(ponto: PontoSerieMusica, granularidade: 'dia' | 'mes'): string {
  const [ano, mes, dia] = ponto.data.split('-').map(Number)
  if (granularidade === 'mes')
    return `${formatarNomeMesAbreviado(mes ?? 1)}/${String(ano).slice(2)}`
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
}

export interface FatiaFonte {
  fonte: 'spotify' | 'youtube_music'
  minutos: number
  percentual: number
}

export function fatiasPorFonte(porFonte: PorFonte | undefined): FatiaFonte[] {
  const spotify = porFonte?.spotify?.minutos ?? 0
  const youtube = porFonte?.youtube_music?.minutos ?? 0
  const total = spotify + youtube
  if (total <= 0) return []
  return [
    { fonte: 'spotify', minutos: spotify, percentual: Math.round((spotify / total) * 100) },
    { fonte: 'youtube_music', minutos: youtube, percentual: Math.round((youtube / total) * 100) },
  ]
}

export interface PontoPercentualServico {
  rotulo: string
  spotify: number
  youtube_music: number
}

export function percentualServicoPorMes(
  meses: { ano: number; mes: number; porFonte: PorFonte }[]
): PontoPercentualServico[] {
  return meses.map((mes) => {
    const fatias = fatiasPorFonte(mes.porFonte)
    return {
      rotulo: `${formatarNomeMesAbreviado(mes.mes)}/${String(mes.ano).slice(2)}`,
      spotify: fatias[0]?.percentual ?? 0,
      youtube_music: fatias[1]?.percentual ?? 0,
    }
  })
}

export interface GrupoDiaRecente {
  data: string
  minutos: number
  itens: ReproducaoRecenteMusica[]
}

export function agruparReproducoesPorDia(itens: ReproducaoRecenteMusica[]): GrupoDiaRecente[] {
  const grupos = new Map<string, GrupoDiaRecente>()
  for (const item of itens) {
    const data = item.tocadaEm.slice(0, 10)
    const grupo = grupos.get(data) ?? { data, minutos: 0, itens: [] }
    grupo.itens.push(item)
    grupo.minutos += item.minutos
    grupos.set(data, grupo)
  }
  return Array.from(grupos.values())
}

export function horaDaReproducao(tocadaEm: string): string {
  return tocadaEm.slice(11, 16)
}

export function musicasValidas(itens: (MusicaAnalise | null | undefined)[]): MusicaAnalise[] {
  return itens.filter((item): item is MusicaAnalise => Boolean(item))
}

export function formatarDiasSemOuvir(dias: number): string {
  if (dias >= 365) {
    const anos = Math.floor(dias / 365)
    return `${anos} ${anos === 1 ? 'ano' : 'anos'} sem ouvir`
  }
  if (dias >= 60) return `${Math.floor(dias / 30)} meses sem ouvir`
  return `${dias} dias sem ouvir`
}

export function dataIsoNesteDia(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export type OrdemTabelaRanking = 'streams' | 'minutos'
export type FiltroServicoTabela = 'todos' | 'spotify' | 'youtube_music'

export function filtrarOrdenarRanking<
  T extends { nome: string; streams: number; minutos: number; porFonte?: PorFonte },
>(itens: T[], busca: string, ordem: OrdemTabelaRanking, servico: FiltroServicoTabela): T[] {
  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  return itens
    .filter((item) => termo === '' || item.nome.toLocaleLowerCase('pt-BR').includes(termo))
    .filter((item) => servico === 'todos' || (item.porFonte?.[servico]?.minutos ?? 0) > 0)
    .sort((a, b) =>
      ordem === 'minutos'
        ? b.minutos - a.minutos || b.streams - a.streams
        : b.streams - a.streams || b.minutos - a.minutos
    )
}

export interface LinhaTabelaRanking {
  chave: string
  posicao: number
  nome: string
  subtitulo: string
  imagemUrl: string | null
  streams: number
  minutos: number
  porFonte?: PorFonte
  rota: string | null
  tipoCapa: 'faixa' | 'artista' | 'album'
}

export function linhasRankingMusicas(
  itens: ItemRankingMusica[],
  imagemDe: (item: ItemRankingMusica) => string | null
): LinhaTabelaRanking[] {
  return itens.map((item, indice) => ({
    chave: item.musicaUuid ?? `${item.nomeFaixa}-${item.artistaPrincipal}`,
    posicao: indice + 1,
    nome: item.nomeFaixa,
    subtitulo: item.artistaPrincipal,
    imagemUrl: imagemDe(item),
    streams: item.totalStreams,
    minutos: item.totalMinutos,
    porFonte: item.porFonte,
    rota: gerarRotaMusica(item.nomeFaixa, item.artistaPrincipal, item.musicaUuid),
    tipoCapa: 'faixa',
  }))
}

export function linhasRankingArtistas(
  itens: ItemRankingArtista[],
  imagemDe: (item: ItemRankingArtista) => string | null
): LinhaTabelaRanking[] {
  return itens.map((item, indice) => ({
    chave: item.artistaUuid ?? item.nomeArtista,
    posicao: indice + 1,
    nome: item.nomeArtista,
    subtitulo: '',
    imagemUrl: imagemDe(item),
    streams: item.totalStreams,
    minutos: item.totalMinutos,
    porFonte: item.porFonte,
    rota: gerarRotaArtista(item.nomeArtista, item.artistaUuid),
    tipoCapa: 'artista',
  }))
}

export function linhasRankingAlbuns(
  itens: AlbumAnalise[],
  imagemDe: (item: AlbumAnalise) => string | null
): LinhaTabelaRanking[] {
  return itens.map((item, indice) => ({
    chave: `${item.album}-${item.artista}`,
    posicao: indice + 1,
    nome: item.album,
    subtitulo: `${item.artista} · ${item.faixasDistintas} faixas`,
    imagemUrl: imagemDe(item),
    streams: item.streams,
    minutos: item.minutos,
    porFonte: item.porFonte,
    rota: null,
    tipoCapa: 'album',
  }))
}
