function chaveVozLivro(livroUuid: string): string {
  return `livros-audio:voz:${livroUuid}`
}

export function lerVozSalva(livroUuid: string): string | null {
  try {
    return localStorage.getItem(chaveVozLivro(livroUuid))
  } catch {
    return null
  }
}

export function salvarVozEscolhida(livroUuid: string, voz: string | null) {
  try {
    if (voz) {
      localStorage.setItem(chaveVozLivro(livroUuid), voz)
    } else {
      localStorage.removeItem(chaveVozLivro(livroUuid))
    }
  } catch {}
}
