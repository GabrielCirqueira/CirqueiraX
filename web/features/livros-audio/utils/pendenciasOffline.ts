import type { LivroAudio, SalvarPosicaoLivro } from '../types'

const CHAVE_POSICOES = 'livros-audio:posicoes-pendentes'
const CHAVE_ESCUTA = 'livros-audio:escuta-pendente'

type PosicoesPendentes = Record<string, SalvarPosicaoLivro>
type EscutaPendente = Record<string, number>

function ler<T>(chave: string): Partial<T> {
  try {
    const valor = localStorage.getItem(chave)
    return valor ? (JSON.parse(valor) as T) : {}
  } catch {
    return {}
  }
}

function gravar(chave: string, valor: object) {
  try {
    if (Object.keys(valor).length === 0) localStorage.removeItem(chave)
    else localStorage.setItem(chave, JSON.stringify(valor))
  } catch {}
  window.dispatchEvent(new Event('livros-audio:pendencias'))
}

export function guardarPosicaoPendente(livroUuid: string, posicao: SalvarPosicaoLivro) {
  const posicoes = ler<PosicoesPendentes>(CHAVE_POSICOES)
  const atual = posicoes[livroUuid]
  if (atual?.registradaEm && posicao.registradaEm && atual.registradaEm > posicao.registradaEm) {
    return
  }
  gravar(CHAVE_POSICOES, { ...posicoes, [livroUuid]: posicao })
}

export function lerPosicoesPendentes(): PosicoesPendentes {
  return ler<PosicoesPendentes>(CHAVE_POSICOES) as PosicoesPendentes
}

export function removerPosicaoPendente(livroUuid: string, registradaEm?: number | null) {
  const posicoes = ler<PosicoesPendentes>(CHAVE_POSICOES)
  const atual = posicoes[livroUuid]
  if (!atual) return
  if (registradaEm && atual.registradaEm && atual.registradaEm > registradaEm) return
  delete posicoes[livroUuid]
  gravar(CHAVE_POSICOES, posicoes)
}

export function aplicarPosicaoPendente(livro: LivroAudio): LivroAudio {
  const pendente = lerPosicoesPendentes()[livro.uuid]
  if (!pendente) return livro
  return {
    ...livro,
    paginaAtual: pendente.paginaAtual,
    blocoAtual: pendente.blocoAtual ?? livro.blocoAtual,
    segundosNoBloco: pendente.segundosNoBloco ?? 0,
  }
}

export function somarEscutaPendente(livroUuid: string, segundos: number) {
  if (segundos < 1) return
  const escuta = ler<EscutaPendente>(CHAVE_ESCUTA)
  gravar(CHAVE_ESCUTA, { ...escuta, [livroUuid]: Math.round((escuta[livroUuid] ?? 0) + segundos) })
}

export function lerEscutaPendente(): EscutaPendente {
  return ler<EscutaPendente>(CHAVE_ESCUTA) as EscutaPendente
}

export function descontarEscutaPendente(livroUuid: string, segundos: number) {
  const escuta = ler<EscutaPendente>(CHAVE_ESCUTA)
  const restante = (escuta[livroUuid] ?? 0) - segundos
  if (restante >= 1) escuta[livroUuid] = restante
  else delete escuta[livroUuid]
  gravar(CHAVE_ESCUTA, escuta)
}

export function contarPendencias(): number {
  return Object.keys(lerPosicoesPendentes()).length + Object.keys(lerEscutaPendente()).length
}
