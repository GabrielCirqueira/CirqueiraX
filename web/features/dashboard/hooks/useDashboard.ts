import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarMapeamentoCategoria,
  criarCategoria,
  obterCategoriasMetricas,
  obterFilaErros,
  obterPastasSync,
  obterResumoDashboard,
  obterStatusSync,
  reclassificarMediaItem,
  retentarErroIndividual,
  retentarTodosErros,
  sincronizarPasta,
} from '../api'

export const DASHBOARD_QUERY_KEYS = {
  resumo: ['dashboard', 'resumo'] as const,
  categorias: ['dashboard', 'categorias'] as const,
  erros: (pagina: number, limite: number) => ['dashboard', 'erros', pagina, limite] as const,
  syncPastas: ['sync', 'pastas'] as const,
  syncStatus: ['sync', 'status'] as const,
}

export function useResumoDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.resumo,
    queryFn: obterResumoDashboard,
    refetchInterval: 10_000,
  })
}

export function useCategoriasMetricas() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.categorias,
    queryFn: obterCategoriasMetricas,
    refetchInterval: 15_000,
  })
}

export function useFilaErros(pagina = 1, limite = 20) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.erros(pagina, limite),
    queryFn: () => obterFilaErros(pagina, limite),
    refetchInterval: 10_000,
  })
}

export function usePastasSync() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.syncPastas,
    queryFn: obterPastasSync,
    refetchInterval: 10_000,
  })
}

export function useStatusSync() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.syncStatus,
    queryFn: obterStatusSync,
    refetchInterval: 10_000,
  })
}

export function useSincronizarPasta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pastaId: string) => sincronizarPasta(pastaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.syncPastas })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.resumo })
    },
  })
}

export function useRetentarErros() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retentarTodosErros,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
  })
}

export function useRetentarErroIndividual() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => retentarErroIndividual(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
  })
}

export function useCriarCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: {
      nome: string
      pastaLocal: string
      googlePhotosAlbumId?: string | null
    }) => criarCategoria(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.categorias })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.resumo })
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['google-fotos'] })
    },
  })
}

export function useAtualizarMapeamentoCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uuid,
      dados,
    }: { uuid: string; dados: { nome?: string; pastaLocal?: string } }) =>
      atualizarMapeamentoCategoria(uuid, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.categorias })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.resumo })
    },
  })
}

export function useReclassificarMediaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, categoriaId }: { uuid: string; categoriaId: string }) =>
      reclassificarMediaItem(uuid, categoriaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
  })
}
