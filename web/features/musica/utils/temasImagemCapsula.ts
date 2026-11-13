import type { FonteMusica } from '../types'

export type IdTemaImagemCapsula =
  | 'spotify'
  | 'youtube_music'
  | 'misto'
  | 'grafite'
  | 'papel'
  | 'por_do_sol'
  | 'oceano'
  | 'neon'
  | 'floresta'
  | 'vinho'

export type IdFormatoImagemCapsula = 'stories' | 'feed' | 'quadrado'

export type IdModeloImagemCapsula = 'classico' | 'poster' | 'grade' | 'recibo' | 'podio'

export interface TemaImagemCapsula {
  id: IdTemaImagemCapsula
  nome: string
  fundo: string[]
  brilho: string | null
  cartao: string
  texto: string
  textoSecundario: string
  apagado: string
  destaque: string
  destaqueDois: string
  destaqueTres: string
  sobreDestaque: string
}

export interface FormatoImagemCapsula {
  id: IdFormatoImagemCapsula
  nome: string
  descricao: string
  largura: number
  altura: number
}

export interface ModeloImagemCapsula {
  id: IdModeloImagemCapsula
  nome: string
  descricao: string
}

export interface OpcaoFonteImagemCapsula {
  id: FonteMusica
  nome: string
  descricao: string
}

export interface OpcoesImagemCapsula {
  fonte: FonteMusica
  modelo: IdModeloImagemCapsula
  tema: IdTemaImagemCapsula
  formato: IdFormatoImagemCapsula
}

const TEMA_RESERVA: TemaImagemCapsula = {
  id: 'spotify',
  nome: 'Spotify',
  fundo: ['#121212', '#121212'],
  brilho: 'rgba(30, 215, 96, 0.35)',
  cartao: '#1F1F1F',
  texto: '#FFFFFF',
  textoSecundario: '#B3B3B3',
  apagado: '#6A6A6A',
  destaque: '#1ED760',
  destaqueDois: '#539DF5',
  destaqueTres: '#FEE44F',
  sobreDestaque: '#121212',
}

export const TEMAS_IMAGEM_CAPSULA: TemaImagemCapsula[] = [
  TEMA_RESERVA,
  {
    id: 'youtube_music',
    nome: 'YouTube Music',
    fundo: ['#0F0F0F', '#030303'],
    brilho: 'rgba(255, 0, 51, 0.32)',
    cartao: '#212121',
    texto: '#FFFFFF',
    textoSecundario: '#AAAAAA',
    apagado: '#717171',
    destaque: '#FF0033',
    destaqueDois: '#FF6E7F',
    destaqueTres: '#F1F1F1',
    sobreDestaque: '#FFFFFF',
  },
  {
    id: 'misto',
    nome: 'Misto',
    fundo: ['#101418', '#1A0F14'],
    brilho: 'rgba(30, 215, 96, 0.28)',
    cartao: '#22252A',
    texto: '#FFFFFF',
    textoSecundario: '#B8B8C0',
    apagado: '#70707A',
    destaque: '#1ED760',
    destaqueDois: '#FF0033',
    destaqueTres: '#FEE44F',
    sobreDestaque: '#101418',
  },
  {
    id: 'grafite',
    nome: 'Grafite',
    fundo: ['#1C1C1E', '#2C2C2E'],
    brilho: null,
    cartao: '#3A3A3C',
    texto: '#F5F5F7',
    textoSecundario: '#AEAEB2',
    apagado: '#7C7C80',
    destaque: '#F5F5F7',
    destaqueDois: '#D1D1D6',
    destaqueTres: '#AEAEB2',
    sobreDestaque: '#1C1C1E',
  },
  {
    id: 'papel',
    nome: 'Papel',
    fundo: ['#F4EFE6', '#EAE3D6'],
    brilho: null,
    cartao: '#E0D8C8',
    texto: '#1F1B16',
    textoSecundario: '#5C544A',
    apagado: '#9A9082',
    destaque: '#1F1B16',
    destaqueDois: '#8C5A3C',
    destaqueTres: '#5C544A',
    sobreDestaque: '#F4EFE6',
  },
  {
    id: 'por_do_sol',
    nome: 'Pôr do sol',
    fundo: ['#2B1055', '#D53A6A'],
    brilho: 'rgba(255, 183, 77, 0.35)',
    cartao: 'rgba(255, 255, 255, 0.12)',
    texto: '#FFFFFF',
    textoSecundario: '#F6D7E4',
    apagado: '#D9A7C0',
    destaque: '#FFB74D',
    destaqueDois: '#FFE082',
    destaqueTres: '#FFFFFF',
    sobreDestaque: '#2B1055',
  },
  {
    id: 'oceano',
    nome: 'Oceano',
    fundo: ['#03203C', '#0E6BA8'],
    brilho: 'rgba(110, 231, 255, 0.3)',
    cartao: 'rgba(255, 255, 255, 0.1)',
    texto: '#FFFFFF',
    textoSecundario: '#CDE8F6',
    apagado: '#8DB8D0',
    destaque: '#6EE7FF',
    destaqueDois: '#A5F3D0',
    destaqueTres: '#FFFFFF',
    sobreDestaque: '#03203C',
  },
  {
    id: 'neon',
    nome: 'Neon',
    fundo: ['#0B0118', '#14002E'],
    brilho: 'rgba(214, 0, 255, 0.35)',
    cartao: '#1E0B33',
    texto: '#FFFFFF',
    textoSecundario: '#C9B6E4',
    apagado: '#7D6A99',
    destaque: '#00F0FF',
    destaqueDois: '#FF2BD6',
    destaqueTres: '#F8FF4D',
    sobreDestaque: '#0B0118',
  },
  {
    id: 'floresta',
    nome: 'Floresta',
    fundo: ['#0F2418', '#1E3A2A'],
    brilho: 'rgba(163, 230, 53, 0.22)',
    cartao: 'rgba(255, 255, 255, 0.08)',
    texto: '#F0F7EE',
    textoSecundario: '#B9CDB8',
    apagado: '#7E957F',
    destaque: '#A3E635',
    destaqueDois: '#FCD34D',
    destaqueTres: '#F0F7EE',
    sobreDestaque: '#0F2418',
  },
  {
    id: 'vinho',
    nome: 'Vinho',
    fundo: ['#2A0A12', '#4A1020'],
    brilho: 'rgba(244, 114, 182, 0.25)',
    cartao: 'rgba(255, 255, 255, 0.08)',
    texto: '#FFF1F2',
    textoSecundario: '#F3C4CF',
    apagado: '#B0808C',
    destaque: '#F9A8D4',
    destaqueDois: '#FDE68A',
    destaqueTres: '#FFF1F2',
    sobreDestaque: '#2A0A12',
  },
]

const FORMATO_RESERVA: FormatoImagemCapsula = {
  id: 'stories',
  nome: 'Stories',
  descricao: '9:16 · 1080×1920',
  largura: 1080,
  altura: 1920,
}

export const FORMATOS_IMAGEM_CAPSULA: FormatoImagemCapsula[] = [
  FORMATO_RESERVA,
  { id: 'feed', nome: 'Feed', descricao: '4:5 · 1080×1350', largura: 1080, altura: 1350 },
  { id: 'quadrado', nome: 'Quadrado', descricao: '1:1 · 1080×1080', largura: 1080, altura: 1080 },
]

export const MODELOS_IMAGEM_CAPSULA: ModeloImagemCapsula[] = [
  { id: 'classico', nome: 'Clássico', descricao: 'Números do mês, artista e top músicas' },
  { id: 'poster', nome: 'Pôster', descricao: 'Capa gigante da música do mês' },
  { id: 'grade', nome: 'Grade', descricao: 'Mosaico com as capas mais ouvidas' },
  { id: 'podio', nome: 'Pódio', descricao: 'Top 3 artistas e músicas em destaque' },
  { id: 'recibo', nome: 'Recibo', descricao: 'Cupom fiscal do que você ouviu' },
]

export const FONTES_IMAGEM_CAPSULA: OpcaoFonteImagemCapsula[] = [
  { id: 'todas', nome: 'Spotify + YouTube Music', descricao: 'Junta as duas fontes' },
  { id: 'spotify', nome: 'Só Spotify', descricao: 'Apenas o que tocou no Spotify' },
  { id: 'youtube_music', nome: 'Só YouTube Music', descricao: 'Apenas o que tocou no YT Music' },
]

const TEMA_PADRAO_POR_FONTE: Record<FonteMusica, IdTemaImagemCapsula> = {
  todas: 'misto',
  spotify: 'spotify',
  youtube_music: 'youtube_music',
}

export function opcoesPadraoImagemCapsula(fonte: FonteMusica): OpcoesImagemCapsula {
  return { fonte, modelo: 'classico', tema: TEMA_PADRAO_POR_FONTE[fonte], formato: 'stories' }
}

export function buscarTemaImagemCapsula(id: IdTemaImagemCapsula): TemaImagemCapsula {
  return TEMAS_IMAGEM_CAPSULA.find((tema) => tema.id === id) ?? TEMA_RESERVA
}

export function buscarFormatoImagemCapsula(id: IdFormatoImagemCapsula): FormatoImagemCapsula {
  return FORMATOS_IMAGEM_CAPSULA.find((formato) => formato.id === id) ?? FORMATO_RESERVA
}

export function nomeArquivoImagemCapsula(
  ano: number,
  mes: number,
  opcoes: OpcoesImagemCapsula
): string {
  return `capsula-sonora-${ano}-${String(mes).padStart(2, '0')}-${opcoes.modelo}-${opcoes.formato}.png`
}
