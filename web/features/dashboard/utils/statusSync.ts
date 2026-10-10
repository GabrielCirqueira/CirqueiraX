import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CheckCircle2, Loader2, PauseCircle, WifiOff } from 'lucide-react'

export interface EstadoBadgeConfig {
  label: string
  icon: LucideIcon
  animate: boolean
  colorPalette: string
}

const ESTADOS_MAPEADOS: Record<string, EstadoBadgeConfig> = {
  syncing: {
    label: 'Sincronizando...',
    icon: Loader2,
    animate: true,
    colorPalette: 'blue',
  },
  scanning: {
    label: 'Sincronizando...',
    icon: Loader2,
    animate: true,
    colorPalette: 'blue',
  },
  idle: {
    label: 'Sincronizado',
    icon: CheckCircle2,
    animate: false,
    colorPalette: 'green',
  },
  ok: {
    label: 'Sincronizado',
    icon: CheckCircle2,
    animate: false,
    colorPalette: 'green',
  },
  paused: {
    label: 'Pausado',
    icon: PauseCircle,
    animate: false,
    colorPalette: 'amber',
  },
  offline: {
    label: 'Daemon Offline',
    icon: WifiOff,
    animate: false,
    colorPalette: 'gray',
  },
}

export function obterEstadoBadge(estado: string, emSincronizacao: boolean): EstadoBadgeConfig {
  if (emSincronizacao) {
    return {
      label: 'Sincronizando...',
      icon: Loader2,
      animate: true,
      colorPalette: 'blue',
    }
  }

  const config = ESTADOS_MAPEADOS[estado]
  if (config) {
    return config
  }

  return {
    label: estado || 'Ocioso',
    icon: AlertTriangle,
    animate: false,
    colorPalette: 'purple',
  }
}
