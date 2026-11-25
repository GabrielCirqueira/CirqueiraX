import { addToast } from '@/shared/components/ui/toaster'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apagarConsultaPronuncia,
  favoritarConsultaPronuncia,
  listarHistoricoPronuncia,
  obterConsultaPronuncia,
  obterPainelPronuncia,
  reportarErroPronuncia,
  traduzirTexto,
} from '../api'
import type { DirecaoTraducao, FiltrosHistorico, ReportarErroPayload } from '../types'
import { extrairMensagemErroApi } from '../utils'
import { PRONUNCIA_QUERY_KEYS } from './chavesQueryPronuncia'

const LIMITE_HISTORICO = 40
const TEMPO_PAINEL_FRESCO_MS = 60_000

export function usePainelPronuncia() {
  return useQuery({
    queryKey: PRONUNCIA_QUERY_KEYS.painel,
    queryFn: obterPainelPronuncia,
    staleTime: TEMPO_PAINEL_FRESCO_MS,
  })
}

export function useHistoricoPronuncia(filtros: FiltrosHistorico) {
  return useQuery({
    queryKey: PRONUNCIA_QUERY_KEYS.historico(filtros),
    queryFn: () => listarHistoricoPronuncia(filtros, LIMITE_HISTORICO),
    placeholderData: keepPreviousData,
  })
}

export function useConsultaPronuncia(uuid: string | null) {
  return useQuery({
    queryKey: PRONUNCIA_QUERY_KEYS.consulta(uuid ?? ''),
    queryFn: () => obterConsultaPronuncia(uuid ?? ''),
    enabled: uuid !== null,
  })
}

export function useTraduzirTexto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ texto, direcao }: { texto: string; direcao: DirecaoTraducao }) =>
      traduzirTexto(texto, direcao),
    onSuccess: (consulta) => {
      queryClient.setQueryData(PRONUNCIA_QUERY_KEYS.consulta(consulta.uuid), consulta)
      queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.historicoTodos })
      queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.painel })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível traduzir',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useFavoritarConsulta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, favorita }: { uuid: string; favorita: boolean }) =>
      favoritarConsultaPronuncia(uuid, favorita),
    onSuccess: (consulta) => {
      queryClient.setQueryData(PRONUNCIA_QUERY_KEYS.consulta(consulta.uuid), consulta)
      queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.historicoTodos })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível favoritar',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useApagarConsulta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apagarConsultaPronuncia,
    onSuccess: (_, uuid) => {
      queryClient.removeQueries({ queryKey: PRONUNCIA_QUERY_KEYS.consulta(uuid) })
      queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.historicoTodos })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível apagar',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useReportarErroPronuncia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: ReportarErroPayload }) =>
      reportarErroPronuncia(uuid, payload),
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.consulta(uuid) })
      queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.relatosTodos })
      queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.painel })
      addToast({
        title: 'Obrigado! Erro reportado',
        description: 'A frase foi para a fila de correções e a próxima versão sai melhor.',
        type: 'success',
      })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível reportar',
        description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}
