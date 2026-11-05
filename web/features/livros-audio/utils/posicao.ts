import type { SalvarPosicaoLivro } from '../types'

const ultimaPosicaoPorLivro = new Map<string, { assinatura: string; registradaEm: number }>()

export function carimbarPosicao(
  livroUuid: string,
  posicao: Omit<SalvarPosicaoLivro, 'registradaEm'>
): SalvarPosicaoLivro {
  const assinatura = `${posicao.paginaAtual}|${posicao.blocoAtual ?? ''}|${posicao.segundosNoBloco ?? 0}`
  const anterior = ultimaPosicaoPorLivro.get(livroUuid)
  const registradaEm = anterior?.assinatura === assinatura ? anterior.registradaEm : Date.now()
  ultimaPosicaoPorLivro.set(livroUuid, { assinatura, registradaEm })
  return { ...posicao, registradaEm }
}
