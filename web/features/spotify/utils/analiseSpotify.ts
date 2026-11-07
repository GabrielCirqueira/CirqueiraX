import type {
  AlbumAnalise,
  ArtistaAnalise,
  FiltroPeriodoAnalise,
  ItemComImagemSpotify,
  MusicaAnalise,
  PontoMensal,
} from '../types'
import { gerarChaveArtista, gerarChaveFaixa } from './chavesSpotify'
import { formatarNomeMesAbreviado } from './formatadoresSpotify'

export const NOMES_DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const NOMES_DIAS_SEMANA_EXTENSO = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]

export const ORDEM_DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 0]

export interface OpcaoPeriodoAnalise {
  chave: string
  rotulo: string
  filtro: FiltroPeriodoAnalise
}

export function criarOpcoesPeriodoAnalise(anoAtual: number): OpcaoPeriodoAnalise[] {
  return [
    { chave: '30d', rotulo: '30 dias', filtro: { periodo: 'dias', dias: 30 } },
    { chave: '90d', rotulo: '90 dias', filtro: { periodo: 'dias', dias: 90 } },
    { chave: 'ano', rotulo: String(anoAtual), filtro: { periodo: 'ano', ano: anoAtual } },
    { chave: 'todos', rotulo: 'Sempre', filtro: { periodo: 'todos' } },
  ]
}

export function isMusicaAnalise(item: ItemComImagemSpotify): item is MusicaAnalise {
  return 'nomeFaixa' in item
}

export function isAlbumAnalise(item: ItemComImagemSpotify): item is AlbumAnalise {
  return 'faixaReferencia' in item
}

export function isArtistaAnalise(item: ItemComImagemSpotify): item is ArtistaAnalise {
  return 'codigoArtista' in item
}

export function chaveImagemItem(item: ItemComImagemSpotify): string {
  if (isMusicaAnalise(item)) {
    return gerarChaveFaixa(item.codigoFaixa, item.artista, item.nomeFaixa)
  }
  if (isAlbumAnalise(item)) {
    return gerarChaveFaixa(item.codigoFaixaReferencia, item.artista, item.faixaReferencia)
  }
  return gerarChaveArtista(item.codigoArtista, item.nome)
}

export function gerarRotaArtista(nomeArtista: string): string {
  return `/spotify/artista?nome=${encodeURIComponent(nomeArtista)}`
}

export function gerarRotaMusica(nomeFaixa: string, artista: string): string {
  return `/spotify/musica?nome=${encodeURIComponent(nomeFaixa)}&artista=${encodeURIComponent(artista)}`
}

export function formatarRotuloMesCurto(ponto: Pick<PontoMensal, 'ano' | 'mes'>): string {
  return `${formatarNomeMesAbreviado(ponto.mes)}/${String(ponto.ano).slice(-2)}`
}

export function formatarFaixaHoraria(hora: number): string {
  return `${String(hora).padStart(2, '0')}h–${String((hora + 1) % 24).padStart(2, '0')}h`
}

export function formatarNumeroPtBr(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor)
}

export function formatarPercentualSimples(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—'
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function formatarDataExtensa(dataIso: string | null | undefined): string {
  if (!dataIso) return '—'
  const data = new Date(dataIso.length === 10 ? `${dataIso}T12:00:00` : dataIso)
  if (Number.isNaN(data.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(data)
    .replace(' de ', ' ')
    .replace('.', '')
}

export function formatarTempoRelativo(dataIso: string | null | undefined, agora: number): string {
  if (!dataIso) return '—'
  const diferencaDias = Math.floor((agora - new Date(dataIso).getTime()) / 86_400_000)
  if (diferencaDias <= 0) return 'hoje'
  if (diferencaDias === 1) return 'ontem'
  if (diferencaDias < 30) return `há ${diferencaDias} dias`
  if (diferencaDias < 365) return `há ${Math.round(diferencaDias / 30)} meses`
  const anos = Math.floor(diferencaDias / 365)
  return anos === 1 ? 'há 1 ano' : `há ${anos} anos`
}

export function formatarDuracaoMs(ms: number): string {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000))
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
}

export function preencherMesesEntre(pontos: PontoMensal[]): PontoMensal[] {
  const primeiro = pontos[0]
  if (!primeiro) return []
  const agora = new Date()
  const porChave = new Map(pontos.map((ponto) => [`${ponto.ano}-${ponto.mes}`, ponto]))
  const resultado: PontoMensal[] = []
  let ano = primeiro.ano
  let mes = primeiro.mes

  while (
    ano < agora.getFullYear() ||
    (ano === agora.getFullYear() && mes <= agora.getMonth() + 1)
  ) {
    resultado.push(porChave.get(`${ano}-${mes}`) ?? { ano, mes, streams: 0, minutos: 0 })
    mes = mes === 12 ? 1 : mes + 1
    ano = mes === 1 ? ano + 1 : ano
  }

  return resultado
}

export function descreverPerfilGosto(
  percentualTopArtistas: number,
  percentualUmaVez: number
): {
  titulo: string
  descricao: string
} {
  if (percentualTopArtistas >= 50) {
    return {
      titulo: 'Fiel aos favoritos',
      descricao: 'Metade ou mais do seu tempo vai para os 5 artistas do topo.',
    }
  }
  if (percentualUmaVez >= 55) {
    return {
      titulo: 'Explorador',
      descricao: 'A maior parte das músicas você ouviu uma única vez: sempre atrás de algo novo.',
    }
  }
  return {
    titulo: 'Equilibrado',
    descricao: 'Você divide o tempo entre favoritos de sempre e coisas novas.',
  }
}

export const CORES_GRAFICO_SPOTIFY = {
  verde: '#1ED760',
  azul: '#539DF5',
  amarelo: '#FEE44F',
  grade: '#252525',
  eixo: '#B3B3B3',
  apagado: '#3E3E3E',
  cartao: '#1F1F1F',
}
