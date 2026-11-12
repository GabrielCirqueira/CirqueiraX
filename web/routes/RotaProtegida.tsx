import { useAuthStore } from '@/stores'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

/**
 * Guarda de rota totalmente protegida.
 *
 * Redireciona para /login se o usuário não estiver autenticado.
 * Use no App.tsx envolvendo rotas privadas.
 *
 * @example
 * <Route element={<RotaProtegida />}>
 *   <Route path="/dashboard" lazy={() => import('@pages/Dashboard/Dashboard')} />
 * </Route>
 */
export function RotaProtegida() {
  const { autenticado } = useAuthStore()
  const location = useLocation()

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ voltarPara: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
