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

function moverParaPosicao(
  anotacoes: Anotacao[],
  id: string,
  destino: (atual: number, total: number) => number
): Anotacao[] {
  const atual = anotacoes.findIndex((anotacao) => anotacao.id === id)
  const alvo = anotacoes[atual]
  if (!alvo) return anotacoes
  const posicao = Math.min(Math.max(destino(atual, anotacoes.length), 0), anotacoes.length - 1)
  if (posicao === atual) return anotacoes
  const restantes = anotacoes.filter((anotacao) => anotacao.id !== id)
  return [...restantes.slice(0, posicao), alvo, ...restantes.slice(posicao)]
}

function registrarSeMudou(
  historico: HistoricoAnotacoes,
  anotacoes: Anotacao[]
): HistoricoAnotacoes {
  return anotacoes === historico.anotacoes ? historico : registrar(historico, anotacoes)
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
      return registrarSeMudou(
        historico,
        moverParaPosicao(historico.anotacoes, acao.id, (_, total) => total - 1)
      )
    case 'enviarParaTras':
      return registrarSeMudou(
        historico,
        moverParaPosicao(historico.anotacoes, acao.id, () => 0)
      )
    case 'subirCamada':
      return registrarSeMudou(
        historico,
        moverParaPosicao(historico.anotacoes, acao.id, (atual) => atual + 1)
      )
    case 'descerCamada':
      return registrarSeMudou(
        historico,
        moverParaPosicao(historico.anotacoes, acao.id, (atual) => atual - 1)
      )
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
