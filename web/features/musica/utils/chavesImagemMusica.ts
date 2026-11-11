export function gerarChaveFaixa(
  codigoFaixa: string | null | undefined,
  artista: string,
  nome: string
): string {
  if (codigoFaixa && codigoFaixa.trim().length > 0) {
    return `faixa:codigo:${codigoFaixa.trim()}`
  }
  return `faixa:nome:${artista.trim().toLowerCase()}|${nome.trim().toLowerCase()}`
}

export function gerarChaveArtista(
  codigoArtista: string | null | undefined,
  nomeArtista: string
): string {
  if (codigoArtista && codigoArtista.trim().length > 0) {
    return `artista:codigo:${codigoArtista.trim()}`
  }
  return `artista:nome:${nomeArtista.trim().toLowerCase()}`
}
