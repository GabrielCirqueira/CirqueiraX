import type { LivroAudioBloco } from '../types'

export function encontrarBlocoPorPagina(
  blocos: LivroAudioBloco[],
  pagina: number
): LivroAudioBloco | null {
  if (blocos.length === 0) {
    return null
  }

  const blocoExato = blocos.find((b) => pagina >= b.paginaInicio && pagina <= b.paginaFim)
  if (blocoExato) {
    return blocoExato
  }

  const primeiro = blocos[0]
  if (primeiro && pagina < primeiro.paginaInicio) {
    return primeiro
  }

  return blocos[blocos.length - 1] ?? null
}

export function calcularPaginaPorTempoBloco(
  bloco: LivroAudioBloco,
  segundosAtuais: number
): number {
  if (bloco.paginaInicio >= bloco.paginaFim) {
    return bloco.paginaInicio
  }

  const duracao = bloco.duracaoSegundos && bloco.duracaoSegundos > 0 ? bloco.duracaoSegundos : 1
  const fracao = Math.min(1, Math.max(0, segundosAtuais / duracao))
  const totalPaginasBloco = bloco.paginaFim - bloco.paginaInicio + 1
  const offset = Math.min(totalPaginasBloco - 1, Math.floor(fracao * totalPaginasBloco))

  return bloco.paginaInicio + offset
}

export function formatarTempoAudio(segundosTotais: number): string {
  if (!Number.isFinite(segundosTotais) || segundosTotais < 0) {
    return '00:00'
  }

  const horas = Math.floor(segundosTotais / 3600)
  const minutos = Math.floor((segundosTotais % 3600) / 60)
  const segundos = Math.floor(segundosTotais % 60)

  if (horas > 0) {
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
  }

  return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
}
