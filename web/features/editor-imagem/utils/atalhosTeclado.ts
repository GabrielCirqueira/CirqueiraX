import type { ComandoAtalho } from '../types'
import { isCampoDeTexto } from './areaTransferencia'
import {
  ATALHOS_FERRAMENTA,
  DESLOCAMENTO_SETAS_TECLADO,
  DESLOCAMENTO_SETAS_TECLADO_RAPIDO,
} from './constantesEditor'

const TECLA_ESCAPE = 'Escape'
const TECLAS_EXCLUSAO = ['Delete', 'Backspace']
const DIRECAO_POR_SETA: Record<string, { x: number; y: number }> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
}

function isTextoSelecionadoNaPagina(): boolean {
  return Boolean(window.getSelection()?.toString())
}

function interpretarAtalhoComModificador(evento: KeyboardEvent): ComandoAtalho | null {
  const tecla = evento.key.toLowerCase()
  if (tecla === 'z' && evento.shiftKey) return { tipo: 'refazer' }
  if (tecla === 'z') return { tipo: 'desfazer' }
  if (tecla === 'y') return { tipo: 'refazer' }
  if (tecla === 's') return { tipo: 'salvar' }
  if (tecla === 'd') return { tipo: 'duplicar' }
  // Ctrl + C, X e V ficam com os eventos nativos de copiar/recortar/colar (copiam o item selecionado).
  if (tecla === 'c' && evento.shiftKey && !isTextoSelecionadoNaPagina()) return { tipo: 'copiar' }
  if (tecla === '0') return { tipo: 'zoom', acao: 'ajustar' }
  if (tecla === '1') return { tipo: 'zoom', acao: 'real' }
  if (evento.key === '=' || evento.key === '+') return { tipo: 'zoom', acao: 'mais' }
  if (evento.key === '-') return { tipo: 'zoom', acao: 'menos' }
  if (evento.key === ']') return { tipo: 'camada', direcao: evento.shiftKey ? 'frente' : 'subir' }
  if (evento.key === '[') return { tipo: 'camada', direcao: evento.shiftKey ? 'tras' : 'descer' }
  if (evento.code === 'BracketRight') return { tipo: 'camada', direcao: 'frente' }
  if (evento.code === 'BracketLeft') return { tipo: 'camada', direcao: 'tras' }
  return null
}

export function interpretarAtalho(evento: KeyboardEvent): ComandoAtalho | null {
  if (isCampoDeTexto(evento.target)) return null
  if (evento.ctrlKey || evento.metaKey) return interpretarAtalhoComModificador(evento)
  if (evento.altKey) return null
  if (evento.key === TECLA_ESCAPE) return { tipo: 'cancelar' }
  if (TECLAS_EXCLUSAO.includes(evento.key)) return { tipo: 'excluir' }
  if (evento.key.toLowerCase() === 'q') return { tipo: 'travarFerramenta' }
  if (evento.key === ']' || evento.key === '+') return { tipo: 'ajustarTamanho', passo: 1 }
  if (evento.key === '[' || evento.key === '-') return { tipo: 'ajustarTamanho', passo: -1 }

  const direcao = DIRECAO_POR_SETA[evento.key]
  if (direcao) {
    const passo = evento.shiftKey ? DESLOCAMENTO_SETAS_TECLADO_RAPIDO : DESLOCAMENTO_SETAS_TECLADO
    return { tipo: 'deslocar', dx: direcao.x * passo, dy: direcao.y * passo }
  }

  const ferramenta = ATALHOS_FERRAMENTA[evento.key.toLowerCase()]
  return ferramenta ? { tipo: 'ferramenta', ferramenta } : null
}

export function atalhoDaFerramenta(ferramentaProcurada: string): string | null {
  const encontrado = Object.entries(ATALHOS_FERRAMENTA).find(
    ([, ferramenta]) => ferramenta === ferramentaProcurada
  )
  return encontrado ? encontrado[0].toUpperCase() : null
}
