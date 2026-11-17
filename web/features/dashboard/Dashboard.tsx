import { usuarioEhAdministrador } from '@/shared/utils/funcionalidadesSistema'
import { useAuthStore } from '@/stores'
import { memo } from 'react'
import { DashboardAdmin } from './DashboardAdmin'
import { DashboardOperador } from './DashboardOperador'

export function Component() {
  return <DashboardView />
}

export const Dashboard = Component

const DashboardView = memo(function DashboardView() {
  const usuario = useAuthStore((s) => s.usuario)

  if (usuarioEhAdministrador(usuario)) {
    return <DashboardAdmin />
  }

  return <DashboardOperador />
})
