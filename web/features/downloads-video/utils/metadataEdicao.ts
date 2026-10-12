import type { MediaItem } from '../types'

import { formatarDataIsoLocal } from '@/shared/utils/formatarData'
export { formatarDataIsoLocal }

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
    const hoje = formatarDataIsoLocal(new Date())
    return { data: hoje, hora: '12:00' }
  }

  const str = String(valorData).trim()

  if (/^\d{8}$/.test(str)) {
    const ano = str.substring(0, 4)
    const mes = str.substring(4, 6)
    const dia = str.substring(6, 8)
    return { data: `${ano}-${mes}-${dia}`, hora: '12:00' }
  }

  if (str.includes('T') || str.includes('Z') || /[+-]\d{2}:\d{2}$/.test(str)) {
    const parsed = new Date(str)
    if (!Number.isNaN(parsed.getTime())) {
      const data = formatarDataIsoLocal(parsed)
      const hh = String(parsed.getHours()).padStart(2, '0')
      const mm = String(parsed.getMinutes()).padStart(2, '0')
      return { data, hora: `${hh}:${mm}` }
    }
  }

  if (str.includes(' ')) {
    const [d = '', h = '12:00'] = str.split(' ')
    return { data: d, hora: h.substring(0, 5) || '12:00' }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return { data: str, hora: '12:00' }
  }

  return { data: str, hora: '12:00' }
}

export function calcularDataComOffset(diasOffset: number): string {
  const dataAlvo = new Date()
  dataAlvo.setDate(dataAlvo.getDate() + diasOffset)
  return formatarDataIsoLocal(dataAlvo)
}

export function obterDataHoraAtual(): DataHoraExtraida {
  const agora = new Date()
  const data = formatarDataIsoLocal(agora)
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

export function deslocarDataHora(
  dataIso: string,
  hora: string,
  deltaHoras: number,
  deltaMinutos = 0
): { data: string; hora: string } {
  try {
    const partesData = dataIso.trim().split('-').map(Number)
    const ano = partesData[0]
    const mes = partesData[1]
    const dia = partesData[2]
    const partesHora = hora.trim().split(':').map(Number)
    const h = partesHora[0] ?? 0
    const m = partesHora[1] ?? 0

    if (ano && mes && dia) {
      const dataObj = new Date(ano, mes - 1, dia, h, m, 0)
      if (!Number.isNaN(dataObj.getTime())) {
        dataObj.setHours(dataObj.getHours() + deltaHoras)
        dataObj.setMinutes(dataObj.getMinutes() + deltaMinutos)
        const novaData = formatarDataIsoLocal(dataObj)
        const hh = String(dataObj.getHours()).padStart(2, '0')
        const mm = String(dataObj.getMinutes()).padStart(2, '0')
        return { data: novaData, hora: `${hh}:${mm}` }
      }
    }
  } catch {}
  return { data: dataIso, hora }
}

export function gerarHorarioAleatorio(inicioHora = 8, fimHora = 22): string {
  const h = Math.floor(Math.random() * (fimHora - inicioHora + 1)) + inicioHora
  const m = Math.floor(Math.random() * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function calcularDistribuicaoUniforme(
  total: number,
  horaInicio = '08:30',
  horaFim = '22:00'
): string[] {
  if (total <= 0) return []
  if (total === 1) return [horaInicio]

  const [hIni = 8, mIni = 30] = horaInicio.split(':').map(Number)
  const [hFim = 22, mFim = 0] = horaFim.split(':').map(Number)

  const minIni = hIni * 60 + mIni
  const minFim = hFim * 60 + mFim
  const espacoTotal = Math.max(0, minFim - minIni)
  const passo = espacoTotal / (total - 1)

  const horarios: string[] = []
  for (let i = 0; i < total; i++) {
    const minAtual = Math.round(minIni + i * passo)
    const h = Math.floor(minAtual / 60) % 24
    const m = minAtual % 60
    horarios.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return horarios
}

export function calcularDistribuicaoRetroativa(
  horaBase = '22:46',
  passoMinutos = 120,
  total = 8
): string[] {
  if (total <= 0) return []
  const [h = 22, m = 46] = horaBase.split(':').map(Number)
  const minBase = h * 60 + m

  const horarios: string[] = []
  for (let i = total - 1; i >= 0; i--) {
    let minAtual = minBase - (total - 1 - i) * passoMinutos
    while (minAtual < 0) minAtual += 1440
    minAtual = minAtual % 1440
    const hora = Math.floor(minAtual / 60)
    const minuto = minAtual % 60
    horarios.unshift(`${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`)
  }
  return horarios
}

export function calcularDistribuicaoOrganica(total: number): string[] {
  const blocosPadrao = [
    { min: 8 * 60 + 30, max: 9 * 60 + 45 },
    { min: 11 * 60 + 30, max: 12 * 60 + 45 },
    { min: 13 * 60 + 45, max: 15 * 60 },
    { min: 16 * 60 + 15, max: 17 * 60 + 30 },
    { min: 18 * 60 + 45, max: 20 * 60 },
    { min: 20 * 60 + 45, max: 22 * 60 },
    { min: 22 * 60 + 15, max: 23 * 60 + 30 },
    { min: 7 * 60 + 30, max: 8 * 60 + 15 },
  ]

  const horariosMin: number[] = []
  for (let i = 0; i < total; i++) {
    const bloco = blocosPadrao[i % blocosPadrao.length]
    if (bloco) {
      const aleatorio = Math.floor(Math.random() * (bloco.max - bloco.min + 1)) + bloco.min
      horariosMin.push(aleatorio)
    } else {
      horariosMin.push(8 * 60 + i * 90)
    }
  }

  horariosMin.sort((a, b) => a - b)

  return horariosMin.map((minutos) => {
    const h = Math.floor(minutos / 60) % 24
    const m = minutos % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })
}
