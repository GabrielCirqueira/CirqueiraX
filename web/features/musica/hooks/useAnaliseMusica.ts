import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  obterDescobertasMusica,
  obterDetalheArtistaMusica,
  obterDetalheMusica,
  obterEvolucaoMensalMusica,
  obterHabitosMusica,
  obterRecordesMusica,
  obterRetrospectivaMusica,
} from '../api'
import type { FiltroPeriodoAnalise } from '../types'
import { MUSICA_QUERY_KEYS } from './chavesQueryMusica'
import { useFonteMusica } from './useFonteMusica'

const TEMPO_DADOS_FRESCOS = 5 * 60_000

export function useDetalheArtistaMusica(artista: string) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.detalheArtista(fonte, artista),
    queryFn: () => obterDetalheArtistaMusica(artista, fonte),
    enabled: artista.trim().length > 0,
    staleTime: TEMPO_DADOS_FRESCOS,
    retry: false,
  })
}

export function useDetalheMusica(nome: string, artista: string) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: MUSICA_QUERY_KEYS.detalheMusica(fonte, nome, artista),
    queryFn: () => obterDetalheMusica(nome, artista, fonte),
    enabled: nome.trim().length > 0 && artista.trim().length > 0,
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
