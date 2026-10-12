import type { MediaItem, StatusMediaItem } from '../types'

export interface StatusConfig {
  label: string
  colorPalette: string
  animado: boolean
}

export function formatarDataMidia(valorData?: string, fallbackIso?: string): string {
  const candidato = valorData || fallbackIso
  if (!candidato) return 'Data não inf.'

  const str = String(candidato).trim()

  if (/^\d{8}$/.test(str)) {
    const ano = str.substring(0, 4)
    const mes = str.substring(4, 6)
    const dia = str.substring(6, 8)
    return `${dia}/${mes}/${ano}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [ano, mes, dia] = str.split('-')
    return `${dia}/${mes}/${ano}`
  }

  if (str.includes('T') || str.includes('Z') || /[+-]\d{2}:\d{2}$/.test(str)) {
    try {
      const parsed = new Date(str)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('pt-BR')
      }
    } catch {}
  }

  const dataApenas = str.split(/[T ]/)[0] ?? ''
  if (dataApenas.includes('-')) {
    const partes = dataApenas.split('-')
    if (partes.length === 3 && partes[0] && partes[1] && partes[2]) {
      const [ano, mes, dia] = partes
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
    }
  }

  try {
    const parsed = new Date(str)
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
    const strData = valorData.trim()
    if (strData.includes('T') && (strData.includes('Z') || /[+-]\d{2}:\d{2}$/.test(strData))) {
      try {
        const parsed = new Date(strData)
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      } catch {}
    }

    const partesEspaco = strData.split(/[T ]/)
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

export function verificarSeEhImagem(item: MediaItem): boolean {
  if (item.origem?.startsWith('print_')) return true
  if (item.metadata?.tipo === 'imagem' || item.metadata?.tipo_midia === 'imagem') return true
  const ext = String(item.metadata?.extensao ?? '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return true
  if (item.caminhoLocal && /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(item.caminhoLocal)) return true
  if (
    typeof item.metadata?.nome_original === 'string' &&
    /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(item.metadata.nome_original)
  ) {
    return true
  }
  return false
}

export function extrairTituloMedia(item: MediaItem): string {
  if (typeof item.metadata?.titulo === 'string' && item.metadata.titulo.trim()) {
    return item.metadata.titulo
  }
  if (typeof item.metadata?.nome_original === 'string' && item.metadata.nome_original.trim()) {
    return item.metadata.nome_original
  }
  if (item.caminhoLocal) {
    const partes = item.caminhoLocal.split('/')
    const ultimo = partes[partes.length - 1]
    if (ultimo) return ultimo
  }
  const ehImagem = verificarSeEhImagem(item)
  return ehImagem ? `Print ${item.hash.slice(0, 10)}` : `Vídeo ${item.hash.slice(0, 10)}`
}

export function extrairExtensaoMedia(item: MediaItem): string {
  if (typeof item.metadata?.extensao === 'string' && item.metadata.extensao.trim()) {
    return item.metadata.extensao.toLowerCase()
  }
  if (typeof item.metadata?.nome_original === 'string') {
    const ext = item.metadata.nome_original.split('.').pop()
    if (ext && ext !== item.metadata.nome_original) return ext.toLowerCase()
  }
  if (item.caminhoLocal) {
    const ext = item.caminhoLocal.split('.').pop()
    if (ext && ext !== item.caminhoLocal) return ext.toLowerCase()
  }
  return verificarSeEhImagem(item) ? 'png' : 'mp4'
}
