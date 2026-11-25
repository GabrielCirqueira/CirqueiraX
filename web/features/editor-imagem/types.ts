export type FerramentaForma =
  | 'retangulo'
  | 'elipse'
  | 'triangulo'
  | 'losango'
  | 'estrela'
  | 'hexagono'
  | 'balao'

export type FerramentaEditor =
  | 'selecionar'
  | 'pincel'
  | 'marcaTexto'
  | 'seta'
  | 'linha'
  | FerramentaForma
  | 'texto'
  | 'numero'
  | 'desfoque'
  | 'recorte'

export type FerramentaDeArraste = 'seta' | 'linha' | FerramentaForma | 'desfoque' | 'recorte'

export type FerramentaDeTraco = 'pincel' | 'marcaTexto'

export type NivelEspessura = 'fina' | 'media' | 'grossa'

export type EstiloBorda = 'solida' | 'tracejada' | 'pontilhada'

export type TipoPreenchimento = 'nenhum' | 'translucido' | 'solido'

export type EstiloTexto = 'simples' | 'contorno' | 'etiqueta'

export type AlinhamentoTexto = 'esquerda' | 'centro' | 'direita'

export type FonteTexto =
  | 'lato'
  | 'poppins'
  | 'montserrat'
  | 'oswald'
  | 'bebas'
  | 'playfair'
  | 'mono'
  | 'marcador'
  | 'pacifico'

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
  opacidade: number
  sombra: boolean
  oculta?: boolean
  bloqueada?: boolean
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
  corPreenchimento: string
}

export interface FormatoTexto {
  fonte: FonteTexto
  negrito: boolean
  italico: boolean
  alinhamento: AlinhamentoTexto
}

export interface AnotacaoTexto extends AnotacaoBase, FormatoTexto {
  tipo: 'texto'
  posicao: Ponto
  texto: string
  tamanhoFonte: number
  estiloTexto: EstiloTexto
}

export interface AnotacaoNumero extends AnotacaoBase {
  tipo: 'numero'
  posicao: Ponto
  numero: number
  raio: number
}

export type Anotacao = AnotacaoTraco | AnotacaoArraste | AnotacaoTexto | AnotacaoNumero

export interface ConfiguracaoTela {
  largura: number
  altura: number
  corFundo: string | null
}

export interface ImagemEditor {
  id: string
  bitmap: ImageBitmap
  largura: number
  altura: number
  nome: string
  mediaItemOrigemUuid: string | null
  tela: ConfiguracaoTela | null
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
  | { tipo: 'enviarParaTras'; id: string }
  | { tipo: 'subirCamada'; id: string }
  | { tipo: 'descerCamada'; id: string }
  | { tipo: 'desfazer' }
  | { tipo: 'refazer' }
  | { tipo: 'limpar' }
  | { tipo: 'reiniciar' }

export type FerramentaComPreferencias = Exclude<FerramentaEditor, 'selecionar' | 'recorte'>

export interface PreferenciasFerramenta extends FormatoTexto {
  cor: string
  corPreenchimento: string
  espessura: number
  raioCanto: number
  estiloBorda: EstiloBorda
  preenchimento: TipoPreenchimento
  tamanhoFonte: number
  estiloTexto: EstiloTexto
  raio: number
  opacidade: number
  sombra: boolean
}

export type PropriedadeEditavel = keyof PreferenciasFerramenta

export type PreferenciasEditor = Partial<
  Record<FerramentaComPreferencias, Partial<PreferenciasFerramenta>>
>

export interface EstiloExibido {
  cor: string
  nivelEspessura: NivelEspessura | null
}

export type AlteracaoAnotacao = Partial<PreferenciasFerramenta>

export interface AlvoPainel {
  tipo: Anotacao['tipo']
  valores: PreferenciasFerramenta
  anotacaoId: string | null
  limiteRaioCanto: number | null
}

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
  formato: FormatoTexto
}

export type DirecaoCamada = 'frente' | 'tras' | 'subir' | 'descer'

export type EixoAlinhamento =
  | 'esquerda'
  | 'centroHorizontal'
  | 'direita'
  | 'topo'
  | 'centroVertical'
  | 'base'

export interface GuiaAlinhamento {
  orientacao: 'vertical' | 'horizontal'
  posicao: number
}

export type AcaoZoom = 'mais' | 'menos' | 'ajustar' | 'real'

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
  | { tipo: 'camada'; direcao: DirecaoCamada }
  | { tipo: 'ajustarTamanho'; passo: number }
  | { tipo: 'zoom'; acao: AcaoZoom }
  | { tipo: 'travarFerramenta' }

export interface SalvarEdicaoInput {
  arquivo: Blob
  nomeArquivo: string
  categoriaId: string | null
  mediaItemOrigemUuid: string | null
}
