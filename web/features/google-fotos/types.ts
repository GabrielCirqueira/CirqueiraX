export interface StatusGoogleFotos {
  conectado: boolean
  email: string | null
  conectadoEm: string | null
  tokenExpirado?: boolean
  expiraEm?: string | null
}

export interface CategoriaVinculo {
  uuid: string
  nome: string
  pastaLocal: string
}

export interface AlbumGoogleFotos {
  id: string
  titulo: string
  urlCapa: string | null
  totalItens: number
  vinculado: boolean
  categoria: CategoriaVinculo | null
}

export interface ResumoAlbunsGoogleFotos {
  totalAlbuns: number
  totalVinculados: number
  totalOrfaos: number
  totalCategoriasSemAlbum: number
}

export interface RespostaAlbunsGoogleFotos {
  albuns: AlbumGoogleFotos[]
  categoriasSemAlbum: CategoriaVinculo[]
  resumo: ResumoAlbunsGoogleFotos
}

export interface VincularAlbumPayload {
  googlePhotosAlbumId: string
}

export interface CategoriaComAlbumDetalhe {
  uuid: string
  nome: string
  pastaLocal: string
  googlePhotosAlbumId: string | null
  criadoEm?: string
  atualizadoEm?: string
}

export type StatusEnvioGoogleFotos = 'enviando' | 'enviado' | 'reaproveitado' | 'falha'

export type OrigemEnvioGoogleFotos = 'automatico' | 'retentativa' | 'reenvio_manual' | 'forcado'

export interface RegistroEnvioGoogleFotos {
  uuid: string
  mediaItemUuid: string
  origemMidia: string
  origemMidiaDescricao: string
  nomeArquivo: string | null
  tipoArquivo: string | null
  tamanhoBytes: number | null
  dataMidia: string
  categoriaNome: string | null
  albumId: string | null
  contaEmail: string | null
  status: StatusEnvioGoogleFotos
  statusDescricao: string
  origemEnvio: OrigemEnvioGoogleFotos
  origemEnvioDescricao: string
  tentativa: number
  googlePhotosMediaId: string | null
  googlePhotosUrl: string | null
  erroMotivo: string | null
  iniciadoEm: string
  finalizadoEm: string | null
  duracaoMs: number | null
}

export interface ResumoEnviosGoogleFotos {
  enviados: number
  reaproveitados: number
  falhas: number
  enviando: number
  ultimaFalhaEm: string | null
  ultimaFalhaMotivo: string | null
}
