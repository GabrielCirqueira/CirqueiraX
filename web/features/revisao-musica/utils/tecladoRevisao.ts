import type { KeyboardEvent } from 'react'

export interface AcoesTecladoRevisao {
  aceitar?: () => void
  naoMusica?: () => void
  buscar?: () => void
  selecionar?: () => void
}

const TAGS_DIGITACAO = ['INPUT', 'TEXTAREA', 'SELECT']

function focarVizinho(atual: HTMLElement, direcao: 'proximo' | 'anterior') {
  const vizinho = direcao === 'proximo' ? atual.nextElementSibling : atual.previousElementSibling
  if (vizinho instanceof HTMLElement) vizinho.focus()
}

function focarDepoisDeResolver(atual: HTMLElement) {
  const vizinho = atual.nextElementSibling ?? atual.previousElementSibling
  if (vizinho instanceof HTMLElement) vizinho.focus()
}

export function tratarTecladoRevisao(
  evento: KeyboardEvent<HTMLElement>,
  acoes: AcoesTecladoRevisao
) {
  const alvo = evento.target as HTMLElement
  if (TAGS_DIGITACAO.includes(alvo.tagName) || evento.ctrlKey || evento.metaKey || evento.altKey)
    return
  const atual = evento.currentTarget
  const tecla = evento.key.toLowerCase()
  const resolver = (acao: (() => void) | undefined) => {
    if (!acao) return
    evento.preventDefault()
    focarDepoisDeResolver(atual)
    acao()
  }
  if (tecla === 'j' || tecla === 'arrowdown') {
    evento.preventDefault()
    focarVizinho(atual, 'proximo')
    return
  }
  if (tecla === 'k' || tecla === 'arrowup') {
    evento.preventDefault()
    focarVizinho(atual, 'anterior')
    return
  }
  if (tecla === 'a') return resolver(acoes.aceitar)
  if (tecla === 'n') return resolver(acoes.naoMusica)
  if (tecla === 'b' && acoes.buscar) {
    evento.preventDefault()
    acoes.buscar()
    return
  }
  if (tecla === 'x' && acoes.selecionar) {
    evento.preventDefault()
    acoes.selecionar()
  }
}
