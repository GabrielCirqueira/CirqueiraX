export interface StatusGoogleFotos {
  conectado: boolean
  email: string | null
  conectadoEm: string | null
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
