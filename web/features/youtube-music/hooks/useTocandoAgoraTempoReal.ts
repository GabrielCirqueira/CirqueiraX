import { useSyncExternalStore } from 'react'
import { assinarTempoRealExtensao, lerTempoRealExtensao } from '../utils/tempoRealExtensao'

export function useTocandoAgoraTempoReal() {
  return useSyncExternalStore(assinarTempoRealExtensao, lerTempoRealExtensao, () => null)
}
