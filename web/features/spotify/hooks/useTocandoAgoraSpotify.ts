import { useMountEffect } from '@/shared/hooks'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { obterTocandoAgoraSpotify } from '../api'
import type { TocandoAgora } from '../types'
import { SPOTIFY_QUERY_KEYS } from './chavesQuerySpotify'

const INTERVALO_TOCANDO = 10_000
const INTERVALO_PARADO = 30_000
const FOLGA_FIM_FAIXA = 1_500
const INTERVALO_RELOGIO = 1_000

function calcularProximaConsulta(dados: TocandoAgora | undefined): number {
  if (!dados?.temItem || !dados.emReproducao) {
    return INTERVALO_PARADO
  }
  const restante = dados.duracaoMs - dados.progressoMs + FOLGA_FIM_FAIXA
  return Math.max(2_000, Math.min(INTERVALO_TOCANDO, restante))
}

export function useTocandoAgoraSpotify(habilitado: boolean) {
  return useQuery({
    queryKey: SPOTIFY_QUERY_KEYS.tocandoAgora,
    queryFn: obterTocandoAgoraSpotify,
    enabled: habilitado,
    refetchInterval: (query) => calcularProximaConsulta(query.state.data),
    refetchIntervalInBackground: false,
    retry: false,
  })
}

export function useRelogioSpotify() {
  const [agora, setAgora] = useState(() => Date.now())

  useMountEffect(() => {
    const intervalo = window.setInterval(() => setAgora(Date.now()), INTERVALO_RELOGIO)
    return () => window.clearInterval(intervalo)
  })

  return agora
}
