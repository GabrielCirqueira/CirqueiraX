const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_DOLAR = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})
const UNIDADES_BYTES = ['B', 'KB', 'MB', 'GB', 'TB']
const BYTES_POR_UNIDADE = 1024
const MINUTOS_POR_HORA = 60
const HORAS_POR_DIA = 24
const MICRODOLARES_POR_DOLAR = 1_000_000

export function formatarNumeroResumo(valor: number): string {
  return FORMATO_NUMERO.format(valor)
}

export function formatarBytesResumo(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const indice = Math.min(
    Math.floor(Math.log(bytes) / Math.log(BYTES_POR_UNIDADE)),
    UNIDADES_BYTES.length - 1
  )
  const valor = bytes / BYTES_POR_UNIDADE ** indice
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: indice === 0 ? 0 : 1 })} ${UNIDADES_BYTES[indice]}`
}

export function formatarMinutosResumo(minutos: number): string {
  if (minutos < MINUTOS_POR_HORA) return `${minutos} min`
  const horas = Math.floor(minutos / MINUTOS_POR_HORA)
  if (horas < HORAS_POR_DIA) return `${horas} h ${minutos % MINUTOS_POR_HORA} min`
  return `${formatarNumeroResumo(horas)} h`
}

export function formatarDolarResumo(microdolares: number): string {
  return FORMATO_DOLAR.format(microdolares / MICRODOLARES_POR_DOLAR)
}
