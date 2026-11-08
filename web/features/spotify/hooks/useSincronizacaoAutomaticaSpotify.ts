import { useUpdateEffect } from '@/shared/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { sincronizarSpotifyAgora } from '../api'
import type { TocandoAgora } from '../types'

const ESPERA_APOS_TROCA_MS = 20_000
const CHAVES_SEM_INVALIDAR = new Set(['tocando-agora', 'importacao'])

function chaveDaFaixa(tocando: TocandoAgora | undefined): string | null {
  if (!tocando?.temItem) return null
  return tocando.codigoFaixa ?? tocando.nome
}

export function useSincronizacaoAutomaticaSpotify(tocando: TocandoAgora | undefined) {
  const queryClient = useQueryClient()
  const chave = chaveDaFaixa(tocando)

  useUpdateEffect(() => {
    const temporizador = window.setTimeout(async () => {
      try {
        const resultado = await sincronizarSpotifyAgora()
        if (resultado.totalNovas === 0) return
        queryClient.invalidateQueries({
          queryKey: ['spotify'],
          predicate: (consulta) => !CHAVES_SEM_INVALIDAR.has(String(consulta.queryKey[1])),
        })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      } catch {
        return
      }
    }, ESPERA_APOS_TROCA_MS)

    return () => window.clearTimeout(temporizador)
  }, [chave])
}
