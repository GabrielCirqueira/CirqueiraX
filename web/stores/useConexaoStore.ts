import { create } from 'zustand'

interface ConexaoStore {
  navegadorOnline: boolean
  falhaDeRede: boolean
  usandoCopiaGuardada: boolean
  definirNavegadorOnline: (online: boolean) => void
  registrarFalhaDeRede: () => void
  registrarRespostaDaRede: (copiaGuardada: boolean) => void
}

export const useConexaoStore = create<ConexaoStore>()((set) => ({
  navegadorOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  falhaDeRede: false,
  usandoCopiaGuardada: false,
  definirNavegadorOnline: (online) =>
    set(online ? { navegadorOnline: true, falhaDeRede: false } : { navegadorOnline: false }),
  registrarFalhaDeRede: () => set({ falhaDeRede: true }),
  registrarRespostaDaRede: (copiaGuardada) =>
    set({ falhaDeRede: copiaGuardada, usandoCopiaGuardada: copiaGuardada }),
}))

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useConexaoStore.getState().definirNavegadorOnline(true))
  window.addEventListener('offline', () => useConexaoStore.getState().definirNavegadorOnline(false))
}

export function useSemConexao(): boolean {
  return useConexaoStore((estado) => !estado.navegadorOnline || estado.falhaDeRede)
}
