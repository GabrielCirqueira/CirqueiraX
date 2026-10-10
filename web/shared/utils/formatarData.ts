export function formatarData(data: string | Date): string {
  try {
    const d = typeof data === 'string' ? new Date(data) : data
    if (Number.isNaN(d.getTime())) return String(data)
    return d.toLocaleDateString('pt-BR')
  } catch {
    return String(data)
  }
}

export function formatarDataHora(data: string | Date): string {
  try {
    const d = typeof data === 'string' ? new Date(data) : data
    if (Number.isNaN(d.getTime())) return String(data)
    const dataFormatada = d.toLocaleDateString('pt-BR')
    const horaFormatada = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return `${dataFormatada} às ${horaFormatada}`
  } catch {
    return String(data)
  }
}

export function tempoRelativo(data: string | Date): string {
  try {
    const d = typeof data === 'string' ? new Date(data) : data
    if (Number.isNaN(d.getTime())) return String(data)
    const agora = new Date()
    const diffSegundos = Math.floor((agora.getTime() - d.getTime()) / 1000)
    if (diffSegundos < 60) return 'agora há pouco'
    const diffMinutos = Math.floor(diffSegundos / 60)
    if (diffMinutos < 60) return `há ${diffMinutos} min`
    const diffHoras = Math.floor(diffMinutos / 60)
    if (diffHoras < 24) return `há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
    const diffDias = Math.floor(diffHoras / 24)
    if (diffDias < 30) return `há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`
    return d.toLocaleDateString('pt-BR')
  } catch {
    return String(data)
  }
}
