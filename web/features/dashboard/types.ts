export type StatusMediaItem =
  | 'baixando'
  | 'recebido'
  | 'em_fila'
  | 'sem_categoria'
  | 'classificado'
  | 'distribuindo'
  | 'distribuido_local'
  | 'enviando_google_fotos'
  | 'concluido'
  | 'erro'
  | 'arquivo_removido'
  | 'arquivo_expurgado'

export type OrigemMedia = 'print_empresa' | 'print_pessoal' | 'bot_telegram' | 'download' | 'manual'

export interface DetalheOrigemEspaco {
  totalItens: number
  tamanhoBytes: number
  tamanhoFormatado: string
}

export interface MidiaRecenteDashboard {
  uuid: string
  hash: string
  origem: OrigemMedia
  origemDescricao?: string
  status: StatusMediaItem
  statusDescricao?: string
  caminhoLocal: string | null
  googlePhotosMediaId?: string | null
  categoriaId: string | null
  categoria?: { uuid: string; nome?: string; pastaLocal?: string } | null
  thumbnailUrl?: string | null
  metadata?: Record<string, unknown>
  criadoEm: string
  atualizadoEm?: string
}

export interface MetricasVideosDashboard {
  totalBaixados: number
  permanecemSistema: number
  removidosHoje: number
  totalRemovidos: number
  tamanhoPermanecemBytes: number
  tamanhoPermanecemFormatado: string
  espacoLiberadoBytes: number
  espacoLiberadoFormatado: string
}

export interface ResumoSpotifyDashboard {
  conectado: boolean
  status: 'conectada' | 'reconectar' | 'desconectada'
  nomeExibicao: string | null
  conectadoEm: string | null
  ultimaColetaEm: string | null
  coletaParada: boolean
  motivoErro: string | null
}

export interface ResumoDashboard {
  status?: Record<StatusMediaItem, number>
  porStatus?: Record<StatusMediaItem, number>
  origem?: Record<OrigemMedia, number>
  porOrigem?: Record<OrigemMedia, number>
  totalGeral: number
  totalErros: number
  tamanhoTotalBytes: number
  tamanhoTotalFormatado: string
  origemEspaco?: Record<OrigemMedia, DetalheOrigemEspaco>
  porOrigemEspaco?: Record<OrigemMedia, DetalheOrigemEspaco>
  ultimasMidias?: MidiaRecenteDashboard[]
  metricasVideos?: MetricasVideosDashboard
  spotify?: ResumoSpotifyDashboard
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

export interface StatusSyncthing {
  online: boolean
  versao: string | null
  pastas: PastaSync[]
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

export interface LivroParaContinuar {
  uuid: string
  titulo: string
  paginaAtual: number
  totalPaginas: number
  progresso: number
  blocoAtual: number | null
  ultimaEscutaEm: string | null
  status: string
}

export interface EstatisticasEscutaLivros {
  metaMinutos: number
  hojeSegundos: number
  semanaSegundos: number
  totalSegundos: number
  sequenciaDias: number
  dias: { dia: string; segundos: number }[]
  continuar: LivroParaContinuar[]
}

export interface PainelSistemaLivros {
  disco: {
    livreBytes: number
    totalBytes: number
    usadoBytes: number
    nivel: 'ok' | 'atencao' | 'critico'
    bytesParaFila: number
    mensagem: string | null
  }
  memoria: {
    containerUsadoBytes: number | null
    containerLimiteBytes: number | null
    servidorTotalBytes: number | null
    servidorDisponivelBytes: number | null
    workerBytes: number | null
    workerAtivo: boolean
  }
  livros: { total: number; porStatus: Record<string, number>; pdfs: number; bytesPdfs: number }
  audios: {
    partes: number
    partesProntas: number
    bytes: number
    segundos: number
    bytesPorParte: number
  }
  vozesExtras: {
    partes: number
    bytes: number
    porVoz: { voz: string; nome: string; partes: number; bytes: number; segundos: number }[]
  }
  bytesNoBanco: number
  bytesNaPasta: number | null
  fila: {
    partesNaFila: number
    segundosRestantes: number
    segundosPorParte: number
    livros: number
  }
}
