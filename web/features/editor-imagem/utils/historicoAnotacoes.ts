import type { AcaoHistorico, Anotacao, HistoricoAnotacoes } from '../types'

const LIMITE_PASSOS_HISTORICO = 100

export const HISTORICO_VAZIO: HistoricoAnotacoes = { anotacoes: [], passado: [], futuro: [] }

function registrar(historico: HistoricoAnotacoes, anotacoes: Anotacao[]): HistoricoAnotacoes {
  return {
    anotacoes,
    passado: [...historico.passado, historico.anotacoes].slice(-LIMITE_PASSOS_HISTORICO),
    futuro: [],
  }
}

function trazerParaFrente(anotacoes: Anotacao[], id: string): Anotacao[] {
  const alvo = anotacoes.find((anotacao) => anotacao.id === id)
  if (!alvo) return anotacoes
  return [...anotacoes.filter((anotacao) => anotacao.id !== id), alvo]
}

export function aplicarAcaoHistorico(
  historico: HistoricoAnotacoes,
  acao: AcaoHistorico
): HistoricoAnotacoes {
  switch (acao.tipo) {
    case 'adicionar':
      return registrar(historico, [...historico.anotacoes, acao.anotacao])
    case 'atualizar':
      return registrar(
        historico,
        historico.anotacoes.map((anotacao) =>
          anotacao.id === acao.anotacao.id ? acao.anotacao : anotacao
        )
      )
    case 'remover':
      return registrar(
        historico,
        historico.anotacoes.filter((anotacao) => anotacao.id !== acao.id)
      )
    case 'trazerParaFrente':
      return registrar(historico, trazerParaFrente(historico.anotacoes, acao.id))
    case 'desfazer': {
      const anterior = historico.passado.at(-1)
      if (!anterior) return historico
      return {
        anotacoes: anterior,
        passado: historico.passado.slice(0, -1),
        futuro: [...historico.futuro, historico.anotacoes],
      }
    }
    case 'refazer': {
      const proximo = historico.futuro.at(-1)
      if (!proximo) return historico
      return {
        anotacoes: proximo,
        passado: [...historico.passado, historico.anotacoes],
        futuro: historico.futuro.slice(0, -1),
      }
    }
    case 'limpar':
      if (historico.anotacoes.length === 0) return historico
      return registrar(historico, [])
    case 'reiniciar':
      return HISTORICO_VAZIO
  }
}

export function proximoNumeroMarcador(anotacoes: Anotacao[]): number {
  const numeros = anotacoes.flatMap((anotacao) =>
    anotacao.tipo === 'numero' ? [anotacao.numero] : []
  )
  return numeros.length === 0 ? 1 : Math.max(...numeros) + 1
}
