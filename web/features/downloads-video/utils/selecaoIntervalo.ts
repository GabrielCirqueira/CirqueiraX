import type { MouseEvent } from 'react'

export function alternarSelecao(selecionados: string[], uuid: string): string[] {
  return selecionados.includes(uuid)
    ? selecionados.filter((id) => id !== uuid)
    : [...selecionados, uuid]
}

export function aplicarSelecaoIntervalo(
  ordem: string[],
  selecionados: string[],
  ancora: string | null,
  alvo: string
): string[] {
  const indiceAncora = ancora ? ordem.indexOf(ancora) : -1
  const indiceAlvo = ordem.indexOf(alvo)
  if (!ancora || indiceAncora === -1 || indiceAlvo === -1) {
    return alternarSelecao(selecionados, alvo)
  }

  const inicio = Math.min(indiceAncora, indiceAlvo)
  const fim = Math.max(indiceAncora, indiceAlvo)
  const intervalo = ordem.slice(inicio, fim + 1)

  if (!selecionados.includes(ancora)) {
    return selecionados.filter((id) => !intervalo.includes(id))
  }

  return [...selecionados, ...intervalo.filter((id) => !selecionados.includes(id))]
}

export function interceptarCliqueComShift(evento: MouseEvent, acao: () => void): void {
  if (!evento.shiftKey) return
  evento.preventDefault()
  evento.stopPropagation()
  acao()
}

export function bloquearSelecaoDeTextoComShift(evento: MouseEvent): void {
  if (evento.shiftKey) evento.preventDefault()
}
