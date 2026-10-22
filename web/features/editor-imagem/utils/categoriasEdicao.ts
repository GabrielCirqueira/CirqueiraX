import type { CategoriaOpcao } from '@/features/downloads-video/types'

function pesoAlbumGoogleFotos(categoria: CategoriaOpcao): number {
  return categoria.googlePhotosAlbumId ? 0 : 1
}

export function ordenarCategoriasParaEdicao(categorias: CategoriaOpcao[]): CategoriaOpcao[] {
  return [...categorias].sort(
    (primeira, segunda) =>
      pesoAlbumGoogleFotos(primeira) - pesoAlbumGoogleFotos(segunda) ||
      primeira.nome.localeCompare(segunda.nome, 'pt-BR')
  )
}
