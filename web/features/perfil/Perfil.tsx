import { useSEO } from '@/shared/hooks'
import { iniciaisNome } from '@/shared/utils/iniciaisNome'
import {
  ROTULOS_FUNCIONALIDADE,
  usuarioEhAdministrador,
} from '@/shared/utils/funcionalidadesSistema'
import { useAuthStore } from '@/stores'
import {
  Badge,
  Box,
  Center,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { memo } from 'react'
import { Navigate } from 'react-router-dom'
import { CartaoAlterarSenha, CartaoDadosPerfil } from './components'
import { useAlterarSenha, useAtualizarPerfil } from './hooks/usePerfil'

export function Component() {
  return <PerfilView />
}

export const Perfil = Component

const PerfilView = memo(function PerfilView() {
  useSEO({
    title: 'Meu perfil',
    description: 'Veja seus dados e altere a senha no CirqueiraX.',
    keywords: 'perfil, senha, conta, cirqueirax',
  })

  const usuario = useAuthStore((s) => s.usuario)
  const atualizar = useAtualizarPerfil()
  const senha = useAlterarSenha()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  const admin = usuarioEhAdministrador(usuario)

  return (
    <Box w="full" maxW="4xl" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
      <VStack w="full" gap={6} alignItems="stretch">
        <HStack gap={4} align="center">
          <Center
            boxSize={14}
            borderRadius="xl"
            bg={admin ? 'cirqueira.brand.500/20' : 'bg.muted'}
            color={admin ? 'cirqueira.brand.300' : 'fg.muted'}
            fontSize="md"
            fontWeight="bold"
            flexShrink={0}
          >
            {iniciaisNome(usuario.nomeCompleto)}
          </Center>
          <VStack align="start" gap={1} minW={0}>
            <Text
              as="h1"
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="black"
              color="fg"
              letterSpacing="tight"
              truncate
            >
              {usuario.nomeCompleto}
            </Text>
            <Text fontSize="sm" color="fg.muted" truncate>
              @{usuario.username} · {usuario.email}
            </Text>
          </VStack>
        </HStack>

        <Box
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="xl"
          bg="bg.panel"
          p={{ base: 4, md: 5 }}
        >
          <VStack align="stretch" gap={3}>
            <Text fontWeight="bold" color="fg">
              Acesso
            </Text>
            {admin ? (
              <Text fontSize="sm" color="fg.muted">
                Conta administradora com acesso a todas as funcionalidades.
              </Text>
            ) : (
              <Wrap gap={2}>
                {usuario.permissoes.length === 0 ? (
                  <Text fontSize="sm" color="cirqueira.orange.400">
                    Nenhuma permissão atribuída.
                  </Text>
                ) : (
                  usuario.permissoes.map((codigo) => (
                    <WrapItem key={codigo}>
                      <Badge variant="outline" borderRadius="md">
                        {ROTULOS_FUNCIONALIDADE[codigo] ?? codigo}
                      </Badge>
                    </WrapItem>
                  ))
                )}
              </Wrap>
            )}
          </VStack>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 1 }} gap={4}>
          <CartaoDadosPerfil
            key={`dados-${usuario.id}-${usuario.atualizadoEm ?? usuario.criadoEm}`}
            usuario={usuario}
            salvando={atualizar.isPending}
            onSalvar={(valores) => atualizar.mutate(valores)}
          />
          <CartaoAlterarSenha
            salvando={senha.isPending}
            onSalvar={(valores, aoSucesso) =>
              senha.mutate(valores, { onSuccess: aoSucesso })
            }
          />
        </SimpleGrid>
      </VStack>
    </Box>
  )
})
