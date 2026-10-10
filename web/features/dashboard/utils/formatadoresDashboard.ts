import type { ItemFilaErro } from '../types'

export function extrairTituloErro(item: ItemFilaErro): string {
  if (item.metadata?.titulo && typeof item.metadata.titulo === 'string') {
    return item.metadata.titulo
  }

  if (item.metadata?.nome_original && typeof item.metadata.nome_original === 'string') {
    return item.metadata.nome_original
  }

  if (item.caminhoLocal && typeof item.caminhoLocal === 'string') {
    const partes = item.caminhoLocal.split('/')
    const ultimo = partes[partes.length - 1]
    if (ultimo) return ultimo
  }

  return `Mídia ${item.hash.substring(0, 8)}`
}

export function formatarDataHoraErro(dataIso?: string | null): string {
  if (!dataIso) return '--:--'
  try {
    const parsed = new Date(dataIso)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('pt-BR')
    }
  } catch {}
  return dataIso
}
