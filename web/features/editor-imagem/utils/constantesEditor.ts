import type { FerramentaEditor, NivelEspessura } from '../types'

export interface CorAnotacao {
  nome: string
  valor: string
}

export const COR_PADRAO = '#FF3B30'

export const CORES_ANOTACAO: CorAnotacao[] = [
  { nome: 'Vermelho', valor: COR_PADRAO },
  { nome: 'Laranja', valor: '#FF9500' },
  { nome: 'Amarelo', valor: '#FFD60A' },
  { nome: 'Verde', valor: '#30D158' },
  { nome: 'Azul', valor: '#0A84FF' },
  { nome: 'Roxo', valor: '#BF5AF2' },
  { nome: 'Branco', valor: '#FFFFFF' },
  { nome: 'Preto', valor: '#111111' },
]

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

export const ATALHOS_FERRAMENTA: Record<string, FerramentaEditor> = {
  v: 'selecionar',
  b: 'pincel',
  h: 'marcaTexto',
  a: 'seta',
  l: 'linha',
  r: 'retangulo',
  e: 'elipse',
  t: 'texto',
  n: 'numero',
  d: 'desfoque',
  c: 'recorte',
}

export const LADO_REFERENCIA_ESCALA = 1200
export const TAMANHO_MINIMO_ARRASTE = 4
export const MULTIPLICADOR_FONTE = 4.5
export const TAMANHO_MINIMO_FONTE = 18
export const MULTIPLICADOR_RAIO_NUMERO = 2.6
export const RAIO_MINIMO_NUMERO = 14
export const MULTIPLICADOR_MARCA_TEXTO = 4
export const OPACIDADE_MARCA_TEXTO = 0.4
export const TAMANHO_BLOCO_DESFOQUE = 12
export const TIPO_IMAGEM_EXPORTADA = 'image/png'
export const EXTENSAO_IMAGEM_EXPORTADA = 'png'
export const RAIO_CANTO_PADRAO = 8
export const DESLOCAMENTO_DUPLICADO = 24
export const DESLOCAMENTO_SETAS_TECLADO = 1
export const DESLOCAMENTO_SETAS_TECLADO_RAPIDO = 10
export const TOLERANCIA_ACERTO_TELA = 8
export const TAMANHO_ALCA_ACERTO_TELA = 12

export interface LimitePropriedade {
  minimo: number
  maximo: number
}

export const LIMITES_PROPRIEDADE = {
  espessura: { minimo: 1, maximo: 40 },
  tamanhoFonte: { minimo: 10, maximo: 160 },
  raio: { minimo: 8, maximo: 90 },
} satisfies Record<string, LimitePropriedade>
