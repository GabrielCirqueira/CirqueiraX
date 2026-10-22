export type FerramentaEditor =
  | 'pincel'
  | 'marcaTexto'
  | 'seta'
  | 'linha'
  | 'retangulo'
  | 'elipse'
  | 'texto'
  | 'numero'
  | 'desfoque'
  | 'recorte'

export type FerramentaDeArraste = 'seta' | 'linha' | 'retangulo' | 'elipse' | 'desfoque' | 'recorte'

export type FerramentaDeTraco = 'pincel' | 'marcaTexto'

export type NivelEspessura = 'fina' | 'media' | 'grossa'

export interface Ponto {
  x: number
  y: number
}

export interface Retangulo {
  x: number
  y: number
  largura: number
  altura: number
}

interface AnotacaoBase {
  id: string
  cor: string
  espessura: number
}

export interface AnotacaoTraco extends AnotacaoBase {
  tipo: FerramentaDeTraco
  pontos: Ponto[]
}

export interface AnotacaoArraste extends AnotacaoBase {
  tipo: FerramentaDeArraste
  inicio: Ponto
  fim: Ponto
}

export interface AnotacaoTexto extends AnotacaoBase {
  tipo: 'texto'
  posicao: Ponto
  texto: string
  tamanhoFonte: number
}

export interface AnotacaoNumero extends AnotacaoBase {
  tipo: 'numero'
  posicao: Ponto
  numero: number
  raio: number
}

export type Anotacao = AnotacaoTraco | AnotacaoArraste | AnotacaoTexto | AnotacaoNumero

export interface ImagemEditor {
  id: string
  bitmap: ImageBitmap
  largura: number
  altura: number
  nome: string
  mediaItemOrigemUuid: string | null
}

export interface HistoricoAnotacoes {
  anotacoes: Anotacao[]
  desfeitas: Anotacao[]
}

export type AcaoHistorico =
  | { tipo: 'adicionar'; anotacao: Anotacao }
  | { tipo: 'desfazer' }
  | { tipo: 'refazer' }
  | { tipo: 'limpar' }
  | { tipo: 'reiniciar' }

export interface EstiloAnotacao {
  cor: string
  nivelEspessura: NivelEspessura
}

export interface TextoEmEdicao {
  posicao: Ponto
  posicaoTela: Ponto
  escalaTela: number
  valor: string
}

export type ComandoAtalho =
  | { tipo: 'desfazer' }
  | { tipo: 'refazer' }
  | { tipo: 'copiar' }
  | { tipo: 'salvar' }
  | { tipo: 'cancelar' }
  | { tipo: 'ferramenta'; ferramenta: FerramentaEditor }

export interface SalvarEdicaoInput {
  arquivo: Blob
  nomeArquivo: string
  categoriaId: string | null
  mediaItemOrigemUuid: string | null
}
