import { addToast } from '@/shared/components/ui/toaster'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarTranscricoes, obterResumoTranscricoes, obterTranscricao } from '../api'
import type { FiltrosTranscricoes, PaginaTranscricoes } from '../types'
import {
  INTERVALO_ATUALIZACAO_DETALHE_MS,
  INTERVALO_ATUALIZACAO_LISTA_MS,
  TRANSCRICOES_POR_PAGINA,
  encontrarTranscricoesConcluidasAgora,
  isPaginaComTranscricaoEmAndamento,
} from '../utils'
import { TRANSCRICOES_QUERY_KEYS } from './chavesQueryTranscricoes'

function avisarConclusoes(anterior: PaginaTranscricoes | undefined, atual: PaginaTranscricoes) {
  for (const transcricao of encontrarTranscricoesConcluidasAgora(anterior, atual)) {
    if (transcricao.status === 'concluida') {
      addToast({
        title: 'Transcrição pronta',
        description: `${transcricao.titulo} · ${transcricao.totalPalavras} palavras`,
        type: 'success',
      })
      continue
    }
    addToast({
      title: 'Falha na transcrição',
      description: transcricao.erroMotivo ?? transcricao.titulo,
      type: 'error',
    })
  }
}

export function useListaTranscricoes(filtros: FiltrosTranscricoes) {
  const queryClient = useQueryClient()
  const chave = TRANSCRICOES_QUERY_KEYS.lista(filtros)

  return useQuery({
    queryKey: chave,
    queryFn: async () => {
      const anterior = queryClient.getQueryData<PaginaTranscricoes>(chave)
      const atual = await listarTranscricoes(filtros, TRANSCRICOES_POR_PAGINA)
      const concluidas = encontrarTranscricoesConcluidasAgora(anterior, atual)
      if (concluidas.length > 0) {
        avisarConclusoes(anterior, atual)
        queryClient.invalidateQueries({ queryKey: TRANSCRICOES_QUERY_KEYS.resumo })
      }
      return atual
    },
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      isPaginaComTranscricaoEmAndamento(query.state.data) ? INTERVALO_ATUALIZACAO_LISTA_MS : false,
    refetchIntervalInBackground: true,
  })
}

export function useResumoTranscricoes() {
  return useQuery({
    queryKey: TRANSCRICOES_QUERY_KEYS.resumo,
    queryFn: obterResumoTranscricoes,
    refetchInterval: (query) => {
      const resumo = query.state.data
      return resumo && resumo.naFila + resumo.transcrevendo > 0
        ? INTERVALO_ATUALIZACAO_LISTA_MS
        : false
    },
  })
}

export function useDetalheTranscricao(uuid: string | null) {
  return useQuery({
    queryKey: TRANSCRICOES_QUERY_KEYS.detalhe(uuid ?? ''),
    queryFn: () => obterTranscricao(uuid ?? ''),
    enabled: uuid !== null,
    refetchInterval: (query) =>
      query.state.data?.isEmAndamento || query.state.data?.isCorrecaoEmAndamento
        ? INTERVALO_ATUALIZACAO_DETALHE_MS
        : false,
    refetchIntervalInBackground: true,
  })
}
