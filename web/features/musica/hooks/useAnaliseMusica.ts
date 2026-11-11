import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  type AlvoDetalheMusica,
  type PeriodoMusicasItem,
  obterDescobertasMusica,
  obterDetalheArtistaMusica,
  obterDetalheMusica,
  obterEvolucaoMensalMusica,
  obterHabitosMusica,
  obterRecordesMusica,
  obterRetrospectivaMusica,
  obterVersoesMusica,
} from '../api'
import type { FiltroPeriodoAnalise } from '../types'
import { MUSICA_QUERY_KEYS } from './chavesQueryMusica'
import { useFonteMusica } from './useFonteMusica'

const TEMPO_DADOS_FRESCOS = 5 * 60_000

export function useDetalheArtistaMusica(alvo: AlvoDetalheMusica) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.detalheArtista(fonte, alvo),
    queryFn: () => obterDetalheArtistaMusica(alvo, fonte),
    enabled: Boolean(alvo.uuid) || alvo.nome.trim().length > 0,
    staleTime: TEMPO_DADOS_FRESCOS,
    retry: false,
  })
}

export function useDetalheMusica(alvo: AlvoDetalheMusica) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.detalheMusica(fonte, alvo),
    queryFn: () => obterDetalheMusica(alvo, fonte),
    enabled: Boolean(alvo.uuid) || alvo.nome.trim().length > 0,
    staleTime: TEMPO_DADOS_FRESCOS,
    retry: false,
  })
}

export function useHabitosMusica(filtro: FiltroPeriodoAnalise, habilitado = true) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.habitos(fonte, filtro),
    queryFn: () => obterHabitosMusica(filtro, fonte),
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
    placeholderData: keepPreviousData,
  })
}

export function useRecordesMusica(habilitado = true) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.recordes(fonte),
    queryFn: () => obterRecordesMusica(fonte),
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
  })
}

export function useEvolucaoMensalMusica(meses: number, habilitado = true) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.evolucao(fonte, meses),
    queryFn: () => obterEvolucaoMensalMusica(meses, fonte),
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
    placeholderData: keepPreviousData,
  })
}

export function useDescobertasMusica(filtro: FiltroPeriodoAnalise, habilitado = true) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.descobertas(fonte, filtro),
    queryFn: () => obterDescobertasMusica(filtro, fonte),
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
    placeholderData: keepPreviousData,
  })
}

export function useRetrospectivaMusica(ano: number, habilitado = true) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.retrospectiva(fonte, ano),
    queryFn: () => obterRetrospectivaMusica(ano, fonte),
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
    placeholderData: keepPreviousData,
  })
}

export function useVersoesMusica(
  musicaUuid: string | null | undefined,
  periodo: PeriodoMusicasItem | null,
  habilitado: boolean
) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.versoes(fonte, musicaUuid ?? '', periodo ?? {}),
    queryFn: () => obterVersoesMusica(musicaUuid ?? '', periodo, fonte),
    enabled: habilitado && Boolean(musicaUuid),
    staleTime: TEMPO_DADOS_FRESCOS,
  })
}
