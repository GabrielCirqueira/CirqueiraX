import { addToast } from '@/shared/components/ui/toaster'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { baixarAudioBloco, listarTrechosBlocoDaRede } from '../api'
import type { LivroAudioBloco } from '../types'
import {
  chaveParteOffline,
  listarPartesOffline,
  medirTamanhoOffline,
  offlineDisponivel,
  pedirArmazenamentoPersistente,
  removerOfflineDoLivro,
  salvarParteOffline,
} from '../utils/offline'
import { LIVROS_AUDIO_QUERY_KEY } from './useLivrosAudio'

export interface ProgressoDownloadOffline {
  atual: number
  total: number
  fracaoParte: number
}

export function useOfflineLivro(livroUuid: string) {
  const queryClient = useQueryClient()
  const chave = useMemo(() => [...LIVROS_AUDIO_QUERY_KEY, livroUuid, 'offline'], [livroUuid])
  const [progresso, setProgresso] = useState<ProgressoDownloadOffline | null>(null)

  const { data } = useQuery({
    queryKey: chave,
    queryFn: async () => {
      const partes = await listarPartesOffline(livroUuid)
      return {
        chaves: new Set(partes.map((parte) => parte.chave)),
        numeros: new Set(partes.map((parte) => parte.numeroBloco)),
        tamanho: partes.length > 0 ? await medirTamanhoOffline(livroUuid) : 0,
      }
    },
    enabled: Boolean(livroUuid) && offlineDisponivel(),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const baixar = useCallback(
    async (blocos: LivroAudioBloco[], vozDoBloco: (numeroBloco: number) => string | null) => {
      const pendentes = blocos.filter(
        (bloco) =>
          bloco.isPronto &&
          !data?.chaves.has(
            chaveParteOffline(bloco.numeroBloco, vozDoBloco(bloco.numeroBloco), bloco.atualizadoEm)
          )
      )
      if (pendentes.length === 0) return

      await pedirArmazenamentoPersistente()
      try {
        for (const [indice, bloco] of pendentes.entries()) {
          setProgresso({ atual: indice + 1, total: pendentes.length, fracaoParte: 0 })
          const voz = vozDoBloco(bloco.numeroBloco)
          const [audio, trechos] = await Promise.all([
            baixarAudioBloco(livroUuid, bloco.numeroBloco, voz, (fracaoParte) =>
              setProgresso({ atual: indice + 1, total: pendentes.length, fracaoParte })
            ),
            bloco.possuiTrechos || voz
              ? listarTrechosBlocoDaRede(livroUuid, bloco.numeroBloco, voz)
              : Promise.resolve([]),
          ])
          await salvarParteOffline(
            livroUuid,
            bloco.numeroBloco,
            voz,
            bloco.atualizadoEm,
            audio,
            trechos
          )
        }
        addToast({
          title: 'Pronto para ouvir offline',
          description: `${pendentes.length} parte(s) guardada(s) neste aparelho.`,
          type: 'success',
        })
      } catch (erro) {
        addToast({
          title: 'O download parou',
          description:
            erro instanceof Error && erro.name === 'QuotaExceededError'
              ? 'Acabou o espaço que o navegador libera para este site.'
              : 'Verifique a conexão e tente de novo. O que já baixou fica guardado.',
          type: 'error',
        })
      } finally {
        setProgresso(null)
        queryClient.invalidateQueries({ queryKey: chave })
      }
    },
    [data, livroUuid, queryClient, chave]
  )

  const remover = useCallback(async () => {
    await removerOfflineDoLivro(livroUuid)
    queryClient.invalidateQueries({ queryKey: chave })
  }, [livroUuid, queryClient, chave])

  return {
    suportado: offlineDisponivel(),
    carregado: !offlineDisponivel() || data !== undefined,
    chaves: data?.chaves ?? new Set<string>(),
    numeros: data?.numeros ?? new Set<number>(),
    tamanho: data?.tamanho ?? 0,
    progresso,
    baixar,
    remover,
  }
}
