export type StatusMediaItem =
  | 'baixando'
  | 'recebido'
  | 'em_fila'
  | 'classificado'
  | 'distribuindo'
  | 'distribuido_local'
  | 'enviando_google_fotos'
  | 'concluido'
  | 'erro'

export type OrigemMedia = 'print_empresa' | 'print_pessoal' | 'bot_telegram' | 'download' | 'manual'

export interface DetalheOrigemEspaco {
  totalItens: number
  tamanhoBytes: number
  tamanhoFormatado: string
}

export interface ResumoDashboard {
  porStatus: Record<StatusMediaItem, number>
  porOrigem: Record<OrigemMedia, number>
  totalGeral: number
  totalErros: number
  tamanhoTotalBytes: number
  tamanhoTotalFormatado: string
  porOrigemEspaco: Record<OrigemMedia, DetalheOrigemEspaco>
}

export interface CategoriaMetrica {
  uuid: string
  nome: string
  pastaLocal: string
  googlePhotosAlbumId?: string | null
  totalItens: number
  tamanhoBytes: number
  tamanhoFormatado: string
}

export interface PastaSync {
  id: string
  label: string
  caminho: string
  estado: string
  emSincronizacao: boolean
  tamanhoBytes: number
  tamanhoFormatado: string
}

export interface ItemFilaErro {
  uuid: string
  hash: string
  origem: OrigemMedia
  origemDescricao: string
  status: StatusMediaItem
  statusDescricao: string
  caminhoLocal: string | null
  googlePhotosMediaId: string | null
  categoriaId: string | null
  categoria: { uuid: string; nome?: string; pastaLocal?: string } | null
  metadata: Record<string, unknown>
  erroMotivo: string | null
  historicoStatus: Array<{ de?: string; para: string; em: string }>
  criadoEm: string
  atualizadoEm: string
}

export interface ResultadoSincronizacao {
  sucesso: boolean
  pastaId: string
  mensagem: string
}
