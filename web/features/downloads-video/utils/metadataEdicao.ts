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
  horaInicio = '08:00',
  horaFim = '22:00'
): string[] {
  if (total <= 0) return []

  const [hIni = 8, mIni = 0] = horaInicio.split(':').map(Number)
  const [hFim = 22, mFim = 0] = horaFim.split(':').map(Number)

  const minIni = hIni * 60 + mIni
  const minFim = hFim * 60 + mFim
  const espacoTotal = Math.max(0, minFim - minIni)

  if (total === 1) {
    const minMeio = Math.round((minIni + minFim) / 2)
    const h = Math.floor(minMeio / 60) % 24
    const m = minMeio % 60
    return [`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`]
  }

  // Divisão centrada em slots para posts realistas (ex: 2 vídeos viram 11:30 e 18:30)
  const slotDuracao = espacoTotal / total
  const horarios: string[] = []

  for (let i = 0; i < total; i++) {
    const minBruto = minIni + (i + 0.5) * slotDuracao
    let minAtual = Math.round(minBruto / 5) * 5
    minAtual = Math.max(minIni, Math.min(minFim, minAtual))

    const h = Math.floor(minAtual / 60) % 24
    const m = minAtual % 60
    horarios.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return horarios
}

export function calcularDistribuicaoRetroativa(
  horaBase = '22:00',
  passoMinutos = 120,
  total = 8
): string[] {
  if (total <= 0) return []
  const [h = 22, m = 0] = horaBase.split(':').map(Number)
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

export function gerarIntervaloDias(inicioIso: string, fimIso: string): string[] {
  if (!inicioIso && !fimIso) return [formatarDataIsoLocal(new Date())]
  if (!inicioIso) return [fimIso]
  if (!fimIso) return [inicioIso]

  if (inicioIso > fimIso) return [inicioIso]

  const partesIni = inicioIso.split('-').map(Number)
  const partesFim = fimIso.split('-').map(Number)
  const aAno = partesIni[0]
  const aMes = partesIni[1]
  const aDia = partesIni[2]
  const bAno = partesFim[0]
  const bMes = partesFim[1]
  const bDia = partesFim[2]

  if (!aAno || !aMes || !aDia || !bAno || !bMes || !bDia) {
    return [inicioIso]
  }

  const dias: string[] = []
  const cur = new Date(aAno, aMes - 1, aDia, 12, 0, 0)
  const end = new Date(bAno, bMes - 1, bDia, 12, 0, 0)

  let iter = 0
  while (cur.getTime() <= end.getTime() && iter < 120) {
    dias.push(formatarDataIsoLocal(cur))
    cur.setDate(cur.getDate() + 1)
    iter++
  }

  return dias.length > 0 ? dias : [inicioIso]
}

export interface DistribuicaoItemCalculado {
  item: MediaItem
  data: string
  hora: string
}

export function calcularDistribuicaoMultiplosDias(
  itens: MediaItem[],
  dias: string[],
  obterHorasDoDia: (qtdNoDia: number) => string[]
): DistribuicaoItemCalculado[] {
  const total = itens.length
  const qtdDias = Math.max(1, dias.length)
  if (total === 0) return []

  const basePorDia = Math.floor(total / qtdDias)
  const resto = total % qtdDias

  const resultado: DistribuicaoItemCalculado[] = []
  let cursor = 0

  for (let d = 0; d < qtdDias; d++) {
    const dataDia = dias[d] ?? dias[0] ?? ''
    const qtdEsteDia = basePorDia + (d < resto ? 1 : 0)

    if (qtdEsteDia <= 0) continue

    const itensDesteDia = itens.slice(cursor, cursor + qtdEsteDia)
    const horasDesteDia = obterHorasDoDia(qtdEsteDia)

    itensDesteDia.forEach((item, idx) => {
      resultado.push({
        item,
        data: dataDia,
        hora: horasDesteDia[idx] ?? '12:00',
      })
    })

    cursor += qtdEsteDia
  }

  return resultado
}

