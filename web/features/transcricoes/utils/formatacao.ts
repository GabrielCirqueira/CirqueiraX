const SEGUNDOS_POR_MINUTO = 60
const SEGUNDOS_POR_HORA = 3600
const BYTES_POR_KB = 1024
const BYTES_POR_MB = 1024 * 1024
const PALAVRAS_LIDAS_POR_MINUTO = 200
const MILISSEGUNDOS_POR_SEGUNDO = 1000

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0')
}

export function formatarDuracao(segundos: number | null): string | null {
  if (segundos === null || !Number.isFinite(segundos)) return null
  const total = Math.max(0, Math.round(segundos))
  const horas = Math.floor(total / SEGUNDOS_POR_HORA)
  const minutos = Math.floor((total % SEGUNDOS_POR_HORA) / SEGUNDOS_POR_MINUTO)
  const resto = total % SEGUNDOS_POR_MINUTO
  if (horas > 0) return `${horas}:${doisDigitos(minutos)}:${doisDigitos(resto)}`
  return `${minutos}:${doisDigitos(resto)}`
}

export function formatarDuracaoExtensa(segundos: number): string {
  const total = Math.max(0, Math.round(segundos))
  if (total < SEGUNDOS_POR_MINUTO) return `${total} s`
  const horas = Math.floor(total / SEGUNDOS_POR_HORA)
  const minutos = Math.round((total % SEGUNDOS_POR_HORA) / SEGUNDOS_POR_MINUTO)
  if (horas === 0) return `${minutos} min`
  return minutos > 0 ? `${horas} h ${minutos} min` : `${horas} h`
}

export function formatarTempoRestante(segundos: number | null): string | null {
  if (segundos === null) return null
  if (segundos < SEGUNDOS_POR_MINUTO) return 'menos de 1 min'
  return `~${formatarDuracaoExtensa(segundos)}`
}

export function formatarTamanho(bytes: number | null): string | null {
  if (bytes === null) return null
  if (bytes >= BYTES_POR_MB) return `${(bytes / BYTES_POR_MB).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / BYTES_POR_KB))} KB`
}

export function formatarNumero(valor: number): string {
  return valor.toLocaleString('pt-BR')
}

export function formatarTempoLeitura(totalPalavras: number): string {
  const minutos = Math.max(1, Math.round(totalPalavras / PALAVRAS_LIDAS_POR_MINUTO))
  return `${minutos} min de leitura`
}

export function formatarCarimboTempo(segundos: number, separadorDecimal: ',' | '.'): string {
  const totalMs = Math.max(0, Math.round(segundos * MILISSEGUNDOS_POR_SEGUNDO))
  const horas = Math.floor(totalMs / (SEGUNDOS_POR_HORA * MILISSEGUNDOS_POR_SEGUNDO))
  const minutos = Math.floor((totalMs / (SEGUNDOS_POR_MINUTO * MILISSEGUNDOS_POR_SEGUNDO)) % 60)
  const segs = Math.floor((totalMs / MILISSEGUNDOS_POR_SEGUNDO) % 60)
  const ms = totalMs % MILISSEGUNDOS_POR_SEGUNDO
  return `${doisDigitos(horas)}:${doisDigitos(minutos)}:${doisDigitos(segs)}${separadorDecimal}${String(ms).padStart(3, '0')}`
}
