import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  obterDescobertasSpotify,
  obterDetalheArtistaSpotify,
  obterDetalheMusicaSpotify,
  obterEvolucaoMensalSpotify,
  obterHabitosSpotify,
  obterRecordesSpotify,
  obterRetrospectivaSpotify,
} from '../api'
import type { FiltroPeriodoAnalise } from '../types'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

const TEMPO_DADOS_FRESCOS = 5 * 60_000

export function useDetalheArtistaSpotify(artista: string) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.detalheArtista(artista),
    queryFn: () => obterDetalheArtistaSpotify(artista),
    enabled: artista.trim().length > 0,
    staleTime: TEMPO_DADOS_FRESCOS,
    retry: false,
  })
}

export function useDetalheMusicaSpotify(nome: string, artista: string) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.detalheMusica(nome, artista),
    queryFn: () => obterDetalheMusicaSpotify(nome, artista),
    enabled: nome.trim().length > 0 && artista.trim().length > 0,
    staleTime: TEMPO_DADOS_FRESCOS,
    retry: false,
  })
}

export function useHabitosSpotify(filtro: FiltroPeriodoAnalise, habilitado = true) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.habitos(filtro),
    queryFn: () => obterHabitosSpotify(filtro),
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
    placeholderData: keepPreviousData,
  })
}

export function useRecordesSpotify(habilitado = true) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.recordes,
    queryFn: obterRecordesSpotify,
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
  })
}

export function useEvolucaoMensalSpotify(meses: number, habilitado = true) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.evolucao(meses),
    queryFn: () => obterEvolucaoMensalSpotify(meses),
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
    placeholderData: keepPreviousData,
  })
}

export function useDescobertasSpotify(filtro: FiltroPeriodoAnalise, habilitado = true) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.descobertas(filtro),
    queryFn: () => obterDescobertasSpotify(filtro),
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
    placeholderData: keepPreviousData,
  })
}

export function useRetrospectivaSpotify(ano: number, habilitado = true) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.retrospectiva(ano),
    queryFn: () => obterRetrospectivaSpotify(ano),
    enabled: habilitado,
    staleTime: TEMPO_DADOS_FRESCOS,
    placeholderData: keepPreviousData,
  })
}
