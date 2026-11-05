import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import type { LivroAudioBloco } from '../types'
import {
  type ParteParaBaixar,
  baixarParaOffline,
  cancelarDownloadOffline,
  useDownloadsOffline,
} from '../utils/gerenciadorOffline'
import {
  chaveParteOffline,
  listarLivrosComOffline,
  listarPartesOffline,
  medirTamanhoOffline,
  offlineDisponivel,
  removerOfflineDoLivro,
  removerPartesOffline,
  temPdfOffline,
} from '../utils/offline'
import { LIVROS_AUDIO_QUERY_KEY } from './useLivrosAudio'

export type { ProgressoDownloadOffline } from '../utils/gerenciadorOffline'

export function chaveOfflineLivro(livroUuid: string) {
  return [...LIVROS_AUDIO_QUERY_KEY, livroUuid, 'offline']
}

export const CHAVE_LIVROS_COM_OFFLINE = ['livros-audio', 'com-offline']

export function useLivrosComOffline() {
  return useQuery({
    queryKey: CHAVE_LIVROS_COM_OFFLINE,
    queryFn: () => listarLivrosComOffline().catch(() => new Map<string, number>()),
    enabled: offlineDisponivel(),
    staleTime: 30_000,
    networkMode: 'always',
  })
}

export function useOfflineLivro(livroUuid: string) {
  const queryClient = useQueryClient()
  const chave = useMemo(() => chaveOfflineLivro(livroUuid), [livroUuid])
  const progresso = useDownloadsOffline((estado) => estado.progresso[livroUuid] ?? null)
  const versao = useDownloadsOffline((estado) => estado.versao)

  const { data } = useQuery({
    queryKey: chave,
    queryFn: async () => {
      const partes = await listarPartesOffline(livroUuid)
      const pdf = await temPdfOffline(livroUuid)
      return {
        partes,
        chaves: new Set(partes.map((parte) => parte.chave)),
        numeros: new Set(partes.map((parte) => parte.numeroBloco)),
        temPdf: pdf,
        tamanho: partes.length > 0 || pdf ? await medirTamanhoOffline(livroUuid) : 0,
      }
    },
    enabled: Boolean(livroUuid) && offlineDisponivel(),
    staleTime: Number.POSITIVE_INFINITY,
    networkMode: 'always',
  })

  useEffect(() => {
    if (versao > 0) {
      queryClient.invalidateQueries({ queryKey: chave })
      queryClient.invalidateQueries({ queryKey: CHAVE_LIVROS_COM_OFFLINE })
    }
  }, [versao, queryClient, chave])

  const baixar = useCallback(
    async (
      blocos: LivroAudioBloco[],
      vozDoBloco: (numeroBloco: number) => string | null,
      opcoes: { incluirPdf?: boolean; silencioso?: boolean } = {}
    ) => {
      const partes: ParteParaBaixar[] = blocos
        .filter((bloco) => bloco.isPronto)
        .map((bloco) => ({ bloco, voz: vozDoBloco(bloco.numeroBloco) }))
        .filter(
          ({ bloco, voz }) =>
            !data?.chaves.has(chaveParteOffline(bloco.numeroBloco, voz, bloco.atualizadoEm))
        )
      return baixarParaOffline(livroUuid, partes, opcoes)
    },
    [data, livroUuid]
  )

  const remover = useCallback(async () => {
    await removerOfflineDoLivro(livroUuid)
    queryClient.invalidateQueries({ queryKey: chave })
    queryClient.invalidateQueries({ queryKey: CHAVE_LIVROS_COM_OFFLINE })
  }, [livroUuid, queryClient, chave])

  const removerPartes = useCallback(
    async (numeros: number[]) => {
      await removerPartesOffline(livroUuid, numeros)
      queryClient.invalidateQueries({ queryKey: chave })
      queryClient.invalidateQueries({ queryKey: CHAVE_LIVROS_COM_OFFLINE })
    },
    [livroUuid, queryClient, chave]
  )

  return {
    suportado: offlineDisponivel(),
    carregado: !offlineDisponivel() || data !== undefined,
    partes: data?.partes ?? [],
    chaves: data?.chaves ?? new Set<string>(),
    numeros: data?.numeros ?? new Set<number>(),
    temPdf: data?.temPdf ?? false,
    tamanho: data?.tamanho ?? 0,
    progresso,
    baixar,
    cancelar: () => cancelarDownloadOffline(livroUuid),
    remover,
    removerPartes,
  }
}
