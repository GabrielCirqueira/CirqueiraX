import type { AcaoHistorico, HistoricoAnotacoes } from '../types'

export const HISTORICO_VAZIO: HistoricoAnotacoes = { anotacoes: [], desfeitas: [] }

export function aplicarAcaoHistorico(
  historico: HistoricoAnotacoes,
  acao: AcaoHistorico
): HistoricoAnotacoes {
  switch (acao.tipo) {
    case 'adicionar':
      return { anotacoes: [...historico.anotacoes, acao.anotacao], desfeitas: [] }
    case 'desfazer': {
      const ultima = historico.anotacoes.at(-1)
      if (!ultima) return historico
      return {
        anotacoes: historico.anotacoes.slice(0, -1),
        desfeitas: [...historico.desfeitas, ultima],
      }
    }
    case 'refazer': {
      const ultimaDesfeita = historico.desfeitas.at(-1)
      if (!ultimaDesfeita) return historico
      return {
        anotacoes: [...historico.anotacoes, ultimaDesfeita],
        desfeitas: historico.desfeitas.slice(0, -1),
      }
    }
    case 'limpar':
      if (historico.anotacoes.length === 0) return historico
      return {
        anotacoes: [],
        desfeitas: [...historico.desfeitas, ...[...historico.anotacoes].reverse()],
      }
    case 'reiniciar':
      return HISTORICO_VAZIO
  }
}

export function proximoNumeroMarcador(historico: HistoricoAnotacoes): number {
  return historico.anotacoes.filter((anotacao) => anotacao.tipo === 'numero').length + 1
}
