import type { MediaItem, StatusMediaItem } from '../types'

export interface StatusConfig {
  label: string
  colorPalette: string
  animado: boolean
}

export function formatarDataMidia(valorData?: string, fallbackIso?: string): string {
  const candidato = valorData || fallbackIso
  if (!candidato) return 'Data não inf.'

  if (/^\d{8}$/.test(candidato)) {
    const ano = candidato.substring(0, 4)
    const mes = candidato.substring(4, 6)
    const dia = candidato.substring(6, 8)
    return `${dia}/${mes}/${ano}`
  }

  const dataApenas = candidato.split(/[T ]/)[0] ?? ''
  if (dataApenas.includes('-')) {
    const partes = dataApenas.split('-')
    if (partes.length === 3 && partes[0] && partes[1] && partes[2]) {
      const [ano, mes, dia] = partes
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
    }
  }

  try {
    const parsed = new Date(candidato)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR')
    }
  } catch {}

  return 'Data não inf.'
}

export function formatarHorarioMidia(item: MediaItem): string {
  if (item.metadata?.horario && typeof item.metadata.horario === 'string') {
    const limpo = item.metadata.horario.trim()
    const partes = limpo.split(':')
    const h = partes[0]
    const m = partes[1]
    if (h !== undefined && m !== undefined) {
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
    }
  }

  const valorData = item.metadata?.data
  if (valorData && typeof valorData === 'string') {
    const partesEspaco = valorData.split(/[T ]/)
    const horaRaw = partesEspaco[1]
    if (horaRaw) {
      const partesHora = horaRaw.split(':')
      const hh = partesHora[0]
      const mm = partesHora[1]
      if (hh !== undefined && mm !== undefined) {
        return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
      }
    }
  }

  if (item.criadoEm) {
    try {
      const dataCriacao = new Date(item.criadoEm)
      if (!Number.isNaN(dataCriacao.getTime())) {
        return dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    } catch {}
  }

  return '--:--'
}

export function formatarDuracao(segundos?: number): string | null {
  if (segundos === undefined || segundos === null || Number.isNaN(segundos) || segundos <= 0) {
    return null
  }
  const horas = Math.floor(segundos / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)
  const segRestantes = Math.floor(segundos % 60)
  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, '0')}:${String(segRestantes).padStart(2, '0')}`
  }
  return `${minutos}:${String(segRestantes).padStart(2, '0')}`
}

export function formatarTamanhoBytes(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

export function tempoRelativoNativo(dataIso: string): string {
  try {
    const data = new Date(dataIso)
    if (Number.isNaN(data.getTime())) return dataIso
    const agora = new Date()
    const diffSegundos = Math.floor((agora.getTime() - data.getTime()) / 1000)
    if (diffSegundos < 60) return 'agora há pouco'
    const diffMinutos = Math.floor(diffSegundos / 60)
    if (diffMinutos < 60) return `há ${diffMinutos} min`
    const diffHoras = Math.floor(diffMinutos / 60)
    if (diffHoras < 24) return `há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
    const diffDias = Math.floor(diffHoras / 24)
    if (diffDias < 30) return `há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`
    return data.toLocaleDateString('pt-BR')
  } catch {
    return dataIso
  }
}

export function obterStatusConfig(status: StatusMediaItem): StatusConfig {
  switch (status) {
    case 'baixando':
      return { label: 'Baixando', colorPalette: 'amber', animado: true }
    case 'recebido':
      return { label: 'Recebido', colorPalette: 'gray', animado: false }
    case 'em_fila':
      return { label: 'Em Fila', colorPalette: 'blue', animado: false }
    case 'sem_categoria':
      return { label: 'Sem Categoria', colorPalette: 'gray', animado: false }
    case 'classificado':
      return { label: 'Classificado', colorPalette: 'purple', animado: false }
    case 'distribuindo':
      return { label: 'Distribuindo', colorPalette: 'cyan', animado: true }
    case 'distribuido_local':
      return { label: 'Distribuído', colorPalette: 'teal', animado: false }
    case 'enviando_google_fotos':
      return { label: 'Google Fotos', colorPalette: 'purple', animado: true }
    case 'concluido':
      return { label: 'Concluído', colorPalette: 'green', animado: false }
    case 'erro':
      return { label: 'Erro', colorPalette: 'red', animado: false }
    default:
      return { label: status, colorPalette: 'gray', animado: false }
  }
}
