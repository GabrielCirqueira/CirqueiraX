/**
 * Extrai todas as URLs válidas de um bloco de texto livre.
 * Suporta quebras de linha, vírgulas, espaços e pontuações no fim de links.
 */
export function extrairUrlsTexto(texto: string): string[] {
  if (!texto || !texto.trim()) {
    return []
  }

  // Captura qualquer URL http:// ou https://
  const regex = /https?:\/\/[^\s,;"'<>()]+/gi
  const matches = texto.match(regex) || []

  const urlsUnicas = new Set<string>()

  for (const match of matches) {
    // Remove pontuações acidentais no fim da URL (. , ; ! : )
    const urlLimpa = match.replace(/[.,;!:)]+$/, '').trim()
    if (!urlLimpa) continue

    try {
      const parsed = new URL(urlLimpa)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        urlsUnicas.add(urlLimpa)
      }
    } catch {
      // Ignora URLs malformadas
    }
  }

  return Array.from(urlsUnicas)
}
