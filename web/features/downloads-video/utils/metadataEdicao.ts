import type { MediaItem } from '../types'

export interface DataHoraExtraida {
  data: string
  hora: string
}

export interface MinutosSegundos {
  minutos: string
  segundos: string
}

export function extrairDataHoraInicial(item: MediaItem | null): DataHoraExtraida {
  if (!item) return { data: '', hora: '12:00' }

  const valorData = item.metadata?.data || item.criadoEm
  if (!valorData) {
    const hoje = new Date().toISOString().split('T')[0] ?? ''
    return { data: hoje, hora: '12:00' }
  }

  if (/^\d{8}$/.test(valorData)) {
    const ano = valorData.substring(0, 4)
    const mes = valorData.substring(4, 6)
    const dia = valorData.substring(6, 8)
    return { data: `${ano}-${mes}-${dia}`, hora: '12:00' }
  }

  if (valorData.includes('T')) {
    const [d = '', h = '12:00'] = valorData.split('T')
    return { data: d, hora: h.substring(0, 5) || '12:00' }
  }

  if (valorData.includes(' ')) {
    const [d = '', h = '12:00'] = valorData.split(' ')
    return { data: d, hora: h.substring(0, 5) || '12:00' }
  }

  return { data: valorData, hora: '12:00' }
}

export function calcularDataComOffset(diasOffset: number): string {
  const dataAlvo = new Date()
  dataAlvo.setDate(dataAlvo.getDate() + diasOffset)
  return dataAlvo.toISOString().split('T')[0] ?? ''
}

export function obterDataHoraAtual(): DataHoraExtraida {
  const agora = new Date()
  const data = agora.toISOString().split('T')[0] ?? ''
  const hh = String(agora.getHours()).padStart(2, '0')
  const mm = String(agora.getMinutes()).padStart(2, '0')
  return { data, hora: `${hh}:${mm}` }
}

export function extrairMinutosSegundos(duracaoTotal?: number): MinutosSegundos {
  const total = Number(duracaoTotal) || 0
  const minutos = Math.floor(total / 60)
  const segundos = total % 60
  return {
    minutos: String(minutos),
    segundos: String(segundos),
  }
}

export function calcularDuracaoTotalSegundos(
  minutos: string | number,
  segundos: string | number
): number | undefined {
  const m = Number(minutos) || 0
  const s = Number(segundos) || 0
  const total = m * 60 + s
  return total > 0 ? total : undefined
}

export function combinarDataHora(dataIso: string, hora: string): string | undefined {
  if (!dataIso.trim()) return undefined
  if (hora.trim()) {
    return `${dataIso.trim()} ${hora.trim()}:00`
  }
  return dataIso.trim()
}
