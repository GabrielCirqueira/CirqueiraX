import { useCallback, useEffect, useState } from 'react'
import {
  localStorageService,
  type OpcoesLeituraStorage,
} from '@/shared/utils/localStorageService'

export type AtualizarEstadoStorage<T> = T | ((valorAnterior: T) => T)

/**
 * Hook reutilizável para sincronizar estado React com o localStorage de forma tipada e validada.
 * Suporta validação por lista de valores permitidos (`valoresPermitidos`) ou predicado customizado (`validar`),
 * além de sincronização automática entre múltiplas abas abertas.
 */
export function useLocalStorageState<T>(
  chave: string,
  valorPadrao: T,
  opcoes?: OpcoesLeituraStorage<T>
): readonly [T, (novoValor: AtualizarEstadoStorage<T>) => void, () => void] {
  const [estado, setEstado] = useState<T>(() =>
    localStorageService.obter<T>(chave, valorPadrao, opcoes)
  )

  const atualizarValor = useCallback(
    (novoValorOuFuncao: AtualizarEstadoStorage<T>) => {
      setEstado((anterior) => {
        const proximoValor =
          typeof novoValorOuFuncao === 'function'
            ? (novoValorOuFuncao as (prev: T) => T)(anterior)
            : novoValorOuFuncao

        localStorageService.salvar<T>(chave, proximoValor)
        return proximoValor
      })
    },
    [chave]
  )

  const resetarValor = useCallback(() => {
    localStorageService.salvar<T>(chave, valorPadrao)
    setEstado(valorPadrao)
  }, [chave, valorPadrao])

  useEffect(() => {
    const chaveCompleta = localStorageService.resolverChave(chave)

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === chaveCompleta) {
        setEstado(localStorageService.obter<T>(chave, valorPadrao, opcoes))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [chave, valorPadrao, opcoes])

  return [estado, atualizarValor, resetarValor] as const
}
