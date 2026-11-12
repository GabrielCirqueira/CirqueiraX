import type { ListaNotificacoes, Notificacao, TipoNotificacao } from '../types'

interface EstiloTipoNotificacao {
  fundo: string
  texto: string
}

const ESTILOS_TIPO: Record<TipoNotificacao, EstiloTipoNotificacao> = {
  melhoria: { fundo: 'brand.subtle', texto: 'brand.fg' },
  correcao: { fundo: 'blue.subtle', texto: 'blue.fg' },
  novidade: { fundo: 'purple.subtle', texto: 'purple.fg' },
  aviso: { fundo: 'yellow.subtle', texto: 'yellow.fg' },
}

export function estiloTipoNotificacao(tipo: TipoNotificacao): EstiloTipoNotificacao {
  return ESTILOS_TIPO[tipo]
}

export function uuidsDasNotificacoes(notificacoes: Notificacao[]): string[] {
  return notificacoes.map((notificacao) => notificacao.uuid)
}

export function marcarComoLidasNaLista(
  lista: ListaNotificacoes,
  uuids: string[],
  lidaEm: string,
  removerLidas: boolean
): ListaNotificacoes {
  const alvo = new Set(uuids)
  const todas = uuids.length === 0
  const deveMarcar = (notificacao: Notificacao) =>
    !notificacao.lida && (todas || alvo.has(notificacao.uuid))
  const marcadas = lista.itens.filter(deveMarcar).length
  const itens = removerLidas
    ? lista.itens.filter((notificacao) => !deveMarcar(notificacao))
    : lista.itens.map((notificacao) =>
        deveMarcar(notificacao) ? { ...notificacao, lida: true, lidaEm } : notificacao
      )

  return { itens, naoLidas: todas ? 0 : Math.max(0, lista.naoLidas - marcadas) }
}

export function rotuloContagem(naoLidas: number): string {
  return naoLidas > 99 ? '99+' : String(naoLidas)
}
