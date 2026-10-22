import type { ComandoAtalho } from '../types'
import { isCampoDeTexto } from './areaTransferencia'
import { ATALHOS_FERRAMENTA } from './constantesEditor'

const TECLA_ESCAPE = 'Escape'

function isTextoSelecionadoNaPagina(): boolean {
  return Boolean(window.getSelection()?.toString())
}

function interpretarAtalhoComModificador(evento: KeyboardEvent): ComandoAtalho | null {
  const tecla = evento.key.toLowerCase()
  if (tecla === 'z' && evento.shiftKey) return { tipo: 'refazer' }
  if (tecla === 'z') return { tipo: 'desfazer' }
  if (tecla === 'y') return { tipo: 'refazer' }
  if (tecla === 's') return { tipo: 'salvar' }
  if (tecla === 'c' && !isTextoSelecionadoNaPagina()) return { tipo: 'copiar' }
  return null
}

export function interpretarAtalho(evento: KeyboardEvent): ComandoAtalho | null {
  if (isCampoDeTexto(evento.target)) return null
  if (evento.ctrlKey || evento.metaKey) return interpretarAtalhoComModificador(evento)
  if (evento.altKey) return null
  if (evento.key === TECLA_ESCAPE) return { tipo: 'cancelar' }

  const ferramenta = ATALHOS_FERRAMENTA[evento.key.toLowerCase()]
  return ferramenta ? { tipo: 'ferramenta', ferramenta } : null
}

export function atalhoDaFerramenta(ferramentaProcurada: string): string | null {
  const encontrado = Object.entries(ATALHOS_FERRAMENTA).find(
    ([, ferramenta]) => ferramenta === ferramentaProcurada
  )
  return encontrado ? encontrado[0].toUpperCase() : null
}
