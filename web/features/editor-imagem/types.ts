export type FerramentaEditor =
  | 'selecionar'
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

export type EstiloBorda = 'solida' | 'tracejada'

export type TipoPreenchimento = 'nenhum' | 'translucido' | 'solido'

export type AlcaTransformacao = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'inicio' | 'fim'

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
  raioCanto: number
  estiloBorda: EstiloBorda
  preenchimento: TipoPreenchimento
}

export interface AnotacaoTexto extends AnotacaoBase {
  tipo: 'texto'
  posicao: Ponto
  texto: string
  tamanhoFonte: number
  comFundo: boolean
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
  passado: Anotacao[][]
  futuro: Anotacao[][]
}

export type AcaoHistorico =
  | { tipo: 'adicionar'; anotacao: Anotacao }
  | { tipo: 'atualizar'; anotacao: Anotacao }
  | { tipo: 'remover'; id: string }
  | { tipo: 'trazerParaFrente'; id: string }
  | { tipo: 'desfazer' }
  | { tipo: 'refazer' }
  | { tipo: 'limpar' }
  | { tipo: 'reiniciar' }

export type FerramentaComPreferencias = Exclude<FerramentaEditor, 'selecionar' | 'recorte'>

export interface PreferenciasFerramenta {
  cor: string
  espessura: number
  raioCanto: number
  estiloBorda: EstiloBorda
  preenchimento: TipoPreenchimento
  tamanhoFonte: number
  comFundo: boolean
  raio: number
}

export type PreferenciasEditor = Partial<
  Record<FerramentaComPreferencias, Partial<PreferenciasFerramenta>>
>

export interface EstiloExibido {
  cor: string
  nivelEspessura: NivelEspessura | null
}

export type AlteracaoAnotacao = Partial<{
  cor: string
  espessura: number
  raioCanto: number
  estiloBorda: EstiloBorda
  preenchimento: TipoPreenchimento
  tamanhoFonte: number
  comFundo: boolean
  raio: number
}>

export type InteracaoPonteiro =
  | { tipo: 'desenhando'; anotacao: Anotacao }
  | { tipo: 'movendo'; original: Anotacao; origem: Ponto; atual: Anotacao }
  | {
      tipo: 'redimensionando'
      original: Anotacao
      alca: AlcaTransformacao
      atual: Anotacao
    }

export interface TextoEmEdicao {
  anotacaoId: string | null
  posicao: Ponto
  posicaoTela: Ponto
  escalaTela: number
  valor: string
  tamanhoFonte: number
  cor: string
}

export type ComandoAtalho =
  | { tipo: 'desfazer' }
  | { tipo: 'refazer' }
  | { tipo: 'copiar' }
  | { tipo: 'salvar' }
  | { tipo: 'cancelar' }
  | { tipo: 'excluir' }
  | { tipo: 'duplicar' }
  | { tipo: 'deslocar'; dx: number; dy: number }
  | { tipo: 'ferramenta'; ferramenta: FerramentaEditor }

export interface SalvarEdicaoInput {
  arquivo: Blob
  nomeArquivo: string
  categoriaId: string | null
  mediaItemOrigemUuid: string | null
}
