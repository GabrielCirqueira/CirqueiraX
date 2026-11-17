import { useSincronizarUsuarioAuth } from '@/features/auth/hooks'
import { useAuthStore } from '@/stores'
import {
  funcionalidadeDaRota,
  primeiraRotaPermitida,
  usuarioPossuiPermissao,
} from '@/shared/utils/funcionalidadesSistema'
import { Center, Spinner, Text, VStack } from '@chakra-ui/react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export function RotaComPermissao() {
  const usuario = useAuthStore((s) => s.usuario)
  const location = useLocation()
  const { isLoading } = useSincronizarUsuarioAuth()
  const permissoesCarregadas =
    usuario?.administrador === true || Array.isArray(usuario?.permissoes)

  if (isLoading && !permissoesCarregadas) {
    return (
      <Center minH="50vh">
        <VStack gap={3}>
          <Spinner color="cirqueira.brand.400" />
          <Text fontSize="sm" color="fg.muted">
            Verificando permissões…
          </Text>
        </VStack>
      </Center>
    )
  }

  const funcionalidade = funcionalidadeDaRota(location.pathname)
  if (funcionalidade && !usuarioPossuiPermissao(usuario, funcionalidade)) {
    const destino = primeiraRotaPermitida(usuario)
    if (destino === location.pathname || destino === `${location.pathname}${location.search}`) {
      return <Outlet />
    }
    return <Navigate to={destino} replace />
  }

  return <Outlet />
}
