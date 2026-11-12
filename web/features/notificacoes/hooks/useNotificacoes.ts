import { addToast } from '@/shared/components/ui/toaster'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarNotificacoes, marcarNotificacoesLidas } from '../api'
import type { ListaNotificacoes } from '../types'
import { marcarComoLidasNaLista } from '../utils'
import { NOTIFICACOES_QUERY_KEYS } from './chavesQueryNotificacoes'

const INTERVALO_VERIFICACAO_MS = 60_000

export function useNotificacoesNaoLidas() {
  const autenticado = useAuthStore((s) => s.autenticado)

  return useQuery({
    queryKey: NOTIFICACOES_QUERY_KEYS.naoLidas,
    queryFn: () => listarNotificacoes(true),
    enabled: autenticado,
    refetchInterval: INTERVALO_VERIFICACAO_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useHistoricoNotificacoes(habilitado: boolean) {
  return useQuery({
    queryKey: NOTIFICACOES_QUERY_KEYS.historico,
    queryFn: () => listarNotificacoes(false),
    enabled: habilitado,
    staleTime: 0,
  })
}

export function useMarcarNotificacoesLidas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuids: string[]) => marcarNotificacoesLidas(uuids),
    onMutate: async (uuids) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICACOES_QUERY_KEYS.todas })
      const anteriorNaoLidas = queryClient.getQueryData<ListaNotificacoes>(
        NOTIFICACOES_QUERY_KEYS.naoLidas
      )
      const anteriorHistorico = queryClient.getQueryData<ListaNotificacoes>(
        NOTIFICACOES_QUERY_KEYS.historico
      )
      const agora = new Date().toISOString()
      queryClient.setQueryData<ListaNotificacoes>(NOTIFICACOES_QUERY_KEYS.naoLidas, (lista) =>
        lista ? marcarComoLidasNaLista(lista, uuids, agora, true) : lista
      )
      queryClient.setQueryData<ListaNotificacoes>(NOTIFICACOES_QUERY_KEYS.historico, (lista) =>
        lista ? marcarComoLidasNaLista(lista, uuids, agora, false) : lista
      )
      return { anteriorNaoLidas, anteriorHistorico }
    },
    onError: (_erro, _uuids, contexto) => {
      queryClient.setQueryData(NOTIFICACOES_QUERY_KEYS.naoLidas, contexto?.anteriorNaoLidas)
      queryClient.setQueryData(NOTIFICACOES_QUERY_KEYS.historico, contexto?.anteriorHistorico)
      addToast({ title: 'Não foi possível marcar as notificações como lidas.', type: 'error' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICACOES_QUERY_KEYS.todas })
    },
  })
}
