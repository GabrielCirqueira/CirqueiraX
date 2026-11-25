import type { FerramentaEditor, FerramentaForma, FonteTexto, NivelEspessura } from '../types'

export interface CorAnotacao {
  nome: string
  valor: string
}

export const COR_PADRAO = '#FF3B30'

export const CORES_RAPIDAS: CorAnotacao[] = [
  { nome: 'Vermelho', valor: COR_PADRAO },
  { nome: 'Laranja', valor: '#FF9500' },
  { nome: 'Amarelo', valor: '#FFD60A' },
  { nome: 'Verde', valor: '#30D158' },
  { nome: 'Azul', valor: '#0A84FF' },
  { nome: 'Roxo', valor: '#BF5AF2' },
  { nome: 'Branco', valor: '#FFFFFF' },
  { nome: 'Preto', valor: '#111111' },
]

export const PALETA_CORES: string[] = [
  '#FFFFFF',
  '#F2F2F7',
  '#D1D1D6',
  '#8E8E93',
  '#48484A',
  '#111111',
  '#FFCDD2',
  '#FF8A80',
  '#FF3B30',
  '#D32F2F',
  '#8E0000',
  '#FF2D55',
  '#FFE0B2',
  '#FFB74D',
  '#FF9500',
  '#E65100',
  '#8D6E63',
  '#5D4037',
  '#FFF9C4',
  '#FFEB3B',
  '#FFD60A',
  '#F9A825',
  '#C0CA33',
  '#827717',
  '#C8E6C9',
  '#81C784',
  '#30D158',
  '#2E7D32',
  '#00977D',
  '#004D40',
  '#B3E5FC',
  '#64D2FF',
  '#0A84FF',
  '#1565C0',
  '#283593',
  '#0D1B4C',
  '#E1BEE7',
  '#CE93D8',
  '#BF5AF2',
  '#7B1FA2',
  '#4A148C',
  '#F48FB1',
]

export const LIMITE_CORES_RECENTES = 12

export const ESPESSURA_POR_NIVEL: Record<NivelEspessura, number> = {
  fina: 3,
  media: 6,
  grossa: 11,
}

export const NIVEIS_ESPESSURA: NivelEspessura[] = ['fina', 'media', 'grossa']

export const ROTULO_NIVEL_ESPESSURA: Record<NivelEspessura, string> = {
  fina: 'Fina',
  media: 'Média',
  grossa: 'Grossa',
}

export const FERRAMENTAS_FORMA: FerramentaForma[] = [
  'retangulo',
  'elipse',
  'triangulo',
  'losango',
  'estrela',
  'hexagono',
  'balao',
]

export const ATALHOS_FERRAMENTA: Record<string, FerramentaEditor> = {
  v: 'selecionar',
  b: 'pincel',
  h: 'marcaTexto',
  a: 'seta',
  l: 'linha',
  r: 'retangulo',
  e: 'elipse',
  g: 'triangulo',
  s: 'estrela',
  t: 'texto',
  n: 'numero',
  d: 'desfoque',
  c: 'recorte',
}

export interface OpcaoFonte {
  valor: FonteTexto
  rotulo: string
  familia: string
}

export const OPCOES_FONTE: OpcaoFonte[] = [
  { valor: 'lato', rotulo: 'Lato', familia: 'Lato, ui-sans-serif, system-ui, sans-serif' },
  { valor: 'poppins', rotulo: 'Poppins', familia: 'Poppins, ui-sans-serif, sans-serif' },
  { valor: 'montserrat', rotulo: 'Montserrat', familia: 'Montserrat, ui-sans-serif, sans-serif' },
  { valor: 'oswald', rotulo: 'Oswald', familia: 'Oswald, Impact, sans-serif' },
  { valor: 'bebas', rotulo: 'Bebas Neue', familia: '"Bebas Neue", Impact, sans-serif' },
  { valor: 'playfair', rotulo: 'Playfair', familia: '"Playfair Display", Georgia, serif' },
  { valor: 'mono', rotulo: 'Roboto Mono', familia: '"Roboto Mono", ui-monospace, monospace' },
  { valor: 'marcador', rotulo: 'Marcador', familia: '"Permanent Marker", cursive' },
  { valor: 'pacifico', rotulo: 'Pacifico', familia: 'Pacifico, cursive' },
]

export const FONTE_PADRAO: FonteTexto = 'lato'

export interface FormatoTela {
  id: string
  rotulo: string
  largura: number
  altura: number
}

export const FORMATOS_TELA: FormatoTela[] = [
  { id: 'quadrado', rotulo: 'Quadrado 1:1', largura: 1080, altura: 1080 },
  { id: 'paisagem', rotulo: 'Paisagem 16:9', largura: 1920, altura: 1080 },
  { id: 'retrato', rotulo: 'Retrato 4:5', largura: 1080, altura: 1350 },
  { id: 'story', rotulo: 'Story 9:16', largura: 1080, altura: 1920 },
  { id: 'classico', rotulo: 'Clássico 4:3', largura: 1600, altura: 1200 },
  { id: 'capa', rotulo: 'Capa YouTube', largura: 1280, altura: 720 },
  { id: 'a4', rotulo: 'A4 em pé', largura: 1240, altura: 1754 },
  { id: 'banner', rotulo: 'Banner 3:1', largura: 1500, altura: 500 },
]

export const FORMATO_TELA_INICIAL = FORMATOS_TELA[1] ?? {
  id: 'paisagem',
  rotulo: 'Paisagem 16:9',
  largura: 1920,
  altura: 1080,
}

export const COR_FUNDO_TELA_PADRAO = '#FFFFFF'
export const LADO_MINIMO_TELA = 16
export const LADO_MAXIMO_TELA = 6000

export const LADO_REFERENCIA_ESCALA = 1200
export const TAMANHO_MINIMO_ARRASTE = 4
export const TAMANHO_FONTE_PADRAO = 27
export const TAMANHO_RAIO_NUMERO_PADRAO = 16
export const MULTIPLICADOR_MARCA_TEXTO = 4
export const OPACIDADE_MARCA_TEXTO = 0.4
export const TAMANHO_BLOCO_DESFOQUE = 12
export const TIPO_IMAGEM_EXPORTADA = 'image/png'
export const TIPO_IMAGEM_JPG = 'image/jpeg'
export const EXTENSAO_IMAGEM_EXPORTADA = 'png'
export const QUALIDADE_JPG = 0.92
export const RAIO_CANTO_PADRAO = 8
export const DESLOCAMENTO_DUPLICADO = 24
export const DESLOCAMENTO_SETAS_TECLADO = 1
export const DESLOCAMENTO_SETAS_TECLADO_RAPIDO = 10
export const TOLERANCIA_ACERTO_TELA = 8
export const TAMANHO_ALCA_ACERTO_TELA = 12
export const TOLERANCIA_ENCAIXE_TELA = 6
export const OPACIDADE_PADRAO = 100

export interface LimitePropriedade {
  minimo: number
  maximo: number
}

export const LIMITES_PROPRIEDADE = {
  espessura: { minimo: 1, maximo: 60 },
  espessuraForma: { minimo: 0, maximo: 60 },
  tamanhoFonte: { minimo: 6, maximo: 400 },
  raio: { minimo: 6, maximo: 120 },
  opacidade: { minimo: 5, maximo: 100 },
} satisfies Record<string, LimitePropriedade>
