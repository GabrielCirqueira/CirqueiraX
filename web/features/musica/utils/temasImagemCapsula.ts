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
  | 'aurora'
  | 'pastel'
  | 'cafe'
  | 'meia_noite'
  | 'cereja'
  | 'limao'
  | 'personalizado'

export type IdFormatoImagemCapsula =
  | 'stories'
  | 'feed'
  | 'quadrado'
  | 'retrato'
  | 'paisagem'
  | 'papel_parede'

export type IdModeloImagemCapsula =
  | 'classico'
  | 'poster'
  | 'grade'
  | 'recibo'
  | 'podio'
  | 'grafico'
  | 'numeros'
  | 'vinil'
  | 'revista'
  | 'ingresso'
  | 'player'

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

export type FundoImagemCapsula = 'gradiente' | 'solido' | 'capa'

export type CantosImagemCapsula = 'retos' | 'arredondados' | 'redondos'

export type TipografiaImagemCapsula = 'moderna' | 'classica' | 'maquina'

export interface CoresPersonalizadasCapsula {
  fundo: string
  fundoDois: string
  destaque: string
  texto: string
}

export interface OpcoesImagemCapsula {
  fonte: FonteMusica
  modelo: IdModeloImagemCapsula
  tema: IdTemaImagemCapsula
  formato: IdFormatoImagemCapsula
  fundo: FundoImagemCapsula
  cantos: CantosImagemCapsula
  tipografia: TipografiaImagemCapsula
  brilho: boolean
  granulado: boolean
  assinatura: boolean
  titulo: string
  qualidade: 1 | 2
  cores: CoresPersonalizadasCapsula
}

export const TITULO_PADRAO_IMAGEM_CAPSULA = 'CÁPSULA SONORA'
export const TAMANHO_MAXIMO_TITULO_CAPSULA = 28

export const CORES_PERSONALIZADAS_PADRAO: CoresPersonalizadasCapsula = {
  fundo: '#14213D',
  fundoDois: '#3A0CA3',
  destaque: '#F72585',
  texto: '#FFFFFF',
}

export const OPCOES_FUNDO_IMAGEM_CAPSULA: {
  id: FundoImagemCapsula
  nome: string
  descricao: string
}[] = [
  { id: 'gradiente', nome: 'Gradiente', descricao: 'Degradê do tema' },
  { id: 'solido', nome: 'Cor sólida', descricao: 'Fundo liso' },
  { id: 'capa', nome: 'Capa desfocada', descricao: 'Capa da música do mês' },
]

export const OPCOES_CANTOS_IMAGEM_CAPSULA: { id: CantosImagemCapsula; nome: string }[] = [
  { id: 'retos', nome: 'Retos' },
  { id: 'arredondados', nome: 'Arredondados' },
  { id: 'redondos', nome: 'Redondos' },
]

export const OPCOES_TIPOGRAFIA_IMAGEM_CAPSULA: {
  id: TipografiaImagemCapsula
  nome: string
  familia: string
}[] = [
  { id: 'moderna', nome: 'Moderna', familia: 'Inter, "Segoe UI", Arial, sans-serif' },
  { id: 'classica', nome: 'Clássica', familia: 'Georgia, "Times New Roman", serif' },
  { id: 'maquina', nome: 'Máquina', familia: '"JetBrains Mono", "Courier New", monospace' },
]

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
  {
    id: 'aurora',
    nome: 'Aurora',
    fundo: ['#061A2B', '#0B4F4A', '#3B1F6B'],
    brilho: 'rgba(94, 234, 212, 0.3)',
    cartao: 'rgba(255, 255, 255, 0.09)',
    texto: '#F0FDFA',
    textoSecundario: '#B5E3DC',
    apagado: '#7FA8A2',
    destaque: '#5EEAD4',
    destaqueDois: '#C4B5FD',
    destaqueTres: '#F0FDFA',
    sobreDestaque: '#061A2B',
  },
  {
    id: 'pastel',
    nome: 'Pastel',
    fundo: ['#FDE2E4', '#E2ECE9', '#DFE7FD'],
    brilho: null,
    cartao: 'rgba(255, 255, 255, 0.6)',
    texto: '#2D2A32',
    textoSecundario: '#5E5A66',
    apagado: '#9A95A3',
    destaque: '#7C5CBF',
    destaqueDois: '#E07A9B',
    destaqueTres: '#3E8E7E',
    sobreDestaque: '#FFFFFF',
  },
  {
    id: 'cafe',
    nome: 'Café',
    fundo: ['#2B1D14', '#4A3222'],
    brilho: 'rgba(212, 163, 115, 0.22)',
    cartao: 'rgba(255, 255, 255, 0.08)',
    texto: '#F5EBDD',
    textoSecundario: '#D4BFA6',
    apagado: '#9C8670',
    destaque: '#D4A373',
    destaqueDois: '#E9C46A',
    destaqueTres: '#F5EBDD',
    sobreDestaque: '#2B1D14',
  },
  {
    id: 'meia_noite',
    nome: 'Meia-noite',
    fundo: ['#000000', '#0A0F24'],
    brilho: 'rgba(99, 102, 241, 0.28)',
    cartao: '#11162E',
    texto: '#FFFFFF',
    textoSecundario: '#A5ACD1',
    apagado: '#5D648A',
    destaque: '#818CF8',
    destaqueDois: '#F472B6',
    destaqueTres: '#FFFFFF',
    sobreDestaque: '#000000',
  },
  {
    id: 'cereja',
    nome: 'Cereja',
    fundo: ['#FFF1F2', '#FFE4E6'],
    brilho: null,
    cartao: '#FECDD3',
    texto: '#4C0519',
    textoSecundario: '#881337',
    apagado: '#BE7A8A',
    destaque: '#E11D48',
    destaqueDois: '#9F1239',
    destaqueTres: '#4C0519',
    sobreDestaque: '#FFF1F2',
  },
  {
    id: 'limao',
    nome: 'Limão',
    fundo: ['#0C0C0C', '#1A1A1A'],
    brilho: 'rgba(212, 255, 0, 0.22)',
    cartao: '#242424',
    texto: '#FFFFFF',
    textoSecundario: '#BDBDBD',
    apagado: '#6E6E6E',
    destaque: '#D4FF00',
    destaqueDois: '#FFFFFF',
    destaqueTres: '#D4FF00',
    sobreDestaque: '#0C0C0C',
  },
]

function canalHex(hex: string, inicio: number): number {
  return Number.parseInt(hex.slice(inicio, inicio + 2), 16)
}

function corComAlfa(hex: string, alfa: number): string {
  const limpo = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#FFFFFF'
  return `rgba(${canalHex(limpo, 1)}, ${canalHex(limpo, 3)}, ${canalHex(limpo, 5)}, ${alfa})`
}

function corClara(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return false
  const luminancia = 0.299 * canalHex(hex, 1) + 0.587 * canalHex(hex, 3) + 0.114 * canalHex(hex, 5)
  return luminancia > 160
}

export function montarTemaPersonalizado(cores: CoresPersonalizadasCapsula): TemaImagemCapsula {
  return {
    id: 'personalizado',
    nome: 'Suas cores',
    fundo: [cores.fundo, cores.fundoDois],
    brilho: corComAlfa(cores.destaque, 0.3),
    cartao: corComAlfa(cores.texto, 0.1),
    texto: cores.texto,
    textoSecundario: corComAlfa(cores.texto, 0.72),
    apagado: corComAlfa(cores.texto, 0.45),
    destaque: cores.destaque,
    destaqueDois: cores.texto,
    destaqueTres: cores.destaque,
    sobreDestaque: corClara(cores.destaque) ? '#111111' : '#FFFFFF',
  }
}

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
  { id: 'retrato', nome: 'Retrato', descricao: '3:4 · 1080×1440', largura: 1080, altura: 1440 },
  { id: 'paisagem', nome: 'Paisagem', descricao: '16:9 · 1920×1080', largura: 1920, altura: 1080 },
  {
    id: 'papel_parede',
    nome: 'Papel de parede',
    descricao: 'Celular · 1080×2340',
    largura: 1080,
    altura: 2340,
  },
]

export const MODELOS_IMAGEM_CAPSULA: ModeloImagemCapsula[] = [
  { id: 'classico', nome: 'Clássico', descricao: 'Números do mês, artista e top músicas' },
  { id: 'poster', nome: 'Pôster', descricao: 'Capa gigante da música do mês' },
  { id: 'grade', nome: 'Grade', descricao: 'Mosaico com as capas mais ouvidas' },
  { id: 'podio', nome: 'Pódio', descricao: 'Top 3 artistas e músicas em destaque' },
  { id: 'recibo', nome: 'Recibo', descricao: 'Cupom fiscal do que você ouviu' },
  { id: 'grafico', nome: 'Gráfico', descricao: 'Minutos de cada dia do mês em barras' },
  { id: 'numeros', nome: 'Números', descricao: 'Painel com as estatísticas do mês' },
  { id: 'vinil', nome: 'Vinil', descricao: 'Disco saindo da capa e o lado A' },
  { id: 'revista', nome: 'Revista', descricao: 'Capa de revista com manchetes' },
  { id: 'ingresso', nome: 'Ingresso', descricao: 'Ingresso de show do artista do mês' },
  { id: 'player', nome: 'Player', descricao: 'Tocando agora com a fila a seguir' },
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
  return {
    fonte,
    modelo: 'classico',
    tema: TEMA_PADRAO_POR_FONTE[fonte],
    formato: 'stories',
    fundo: 'gradiente',
    cantos: 'arredondados',
    tipografia: 'moderna',
    brilho: true,
    granulado: false,
    assinatura: true,
    titulo: TITULO_PADRAO_IMAGEM_CAPSULA,
    qualidade: 1,
    cores: CORES_PERSONALIZADAS_PADRAO,
  }
}

export function buscarTemaImagemCapsula(
  id: IdTemaImagemCapsula,
  cores: CoresPersonalizadasCapsula = CORES_PERSONALIZADAS_PADRAO
): TemaImagemCapsula {
  if (id === 'personalizado') return montarTemaPersonalizado(cores)
  return TEMAS_IMAGEM_CAPSULA.find((tema) => tema.id === id) ?? TEMA_RESERVA
}

export function buscarFormatoImagemCapsula(id: IdFormatoImagemCapsula): FormatoImagemCapsula {
  return FORMATOS_IMAGEM_CAPSULA.find((formato) => formato.id === id) ?? FORMATO_RESERVA
}

export function familiaTipografiaCapsula(id: TipografiaImagemCapsula): string {
  return (
    OPCOES_TIPOGRAFIA_IMAGEM_CAPSULA.find((opcao) => opcao.id === id)?.familia ??
    'Inter, "Segoe UI", Arial, sans-serif'
  )
}

export function nomeArquivoImagemCapsula(
  ano: number,
  mes: number,
  opcoes: OpcoesImagemCapsula
): string {
  return `capsula-sonora-${ano}-${String(mes).padStart(2, '0')}-${opcoes.modelo}-${opcoes.formato}.png`
}
