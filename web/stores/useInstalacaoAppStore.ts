import { create } from 'zustand'

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstalacaoAppStore {
  evento: EventoInstalacao | null
  instalado: boolean
}

export const useInstalacaoAppStore = create<InstalacaoAppStore>()(() => ({
  evento: null,
  instalado:
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true),
}))

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault()
    useInstalacaoAppStore.setState({ evento: evento as EventoInstalacao })
  })
  window.addEventListener('appinstalled', () => {
    useInstalacaoAppStore.setState({ evento: null, instalado: true })
  })
}

export async function instalarApp(): Promise<boolean> {
  const { evento } = useInstalacaoAppStore.getState()
  if (!evento) return false
  await evento.prompt()
  const escolha = await evento.userChoice
  useInstalacaoAppStore.setState({ evento: null })
  return escolha.outcome === 'accepted'
}
