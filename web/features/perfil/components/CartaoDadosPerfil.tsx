import { Badge, Box, Button, Field, HStack, Input, Text, VStack } from '@chakra-ui/react'
import { memo, useState } from 'react'
import type { Usuario } from '@/shared/types'
import { usuarioEhAdministrador } from '@/shared/utils/funcionalidadesSistema'

export interface CartaoDadosPerfilProps {
  usuario: Usuario
  salvando?: boolean
  onSalvar: (valores: { nomeCompleto: string; email: string }) => void
}

export const CartaoDadosPerfil = memo(function CartaoDadosPerfil({
  usuario,
  salvando = false,
  onSalvar,
}: CartaoDadosPerfilProps) {
  const [nomeCompleto, setNomeCompleto] = useState(usuario.nomeCompleto)
  const [email, setEmail] = useState(usuario.email)

  const valido = nomeCompleto.trim().length >= 3 && email.trim().includes('@')
  const alterado =
    nomeCompleto.trim() !== usuario.nomeCompleto || email.trim() !== usuario.email

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={{ base: 4, md: 5 }}
    >
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between" align="start" gap={3} flexWrap="wrap">
          <VStack align="start" gap={0}>
            <Text fontWeight="bold" color="fg">
              Dados da conta
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Nome e e-mail usados no login e nas listagens
            </Text>
          </VStack>
          <Badge
            colorPalette={usuarioEhAdministrador(usuario) ? 'brand' : 'gray'}
            variant="subtle"
            borderRadius="md"
          >
            {usuarioEhAdministrador(usuario) ? 'Administrador' : 'Operador'}
          </Badge>
        </HStack>

        <Field.Root>
          <Field.Label fontSize="sm">Usuário</Field.Label>
          <Input value={usuario.username} disabled borderRadius="lg" />
        </Field.Root>

        <Field.Root required>
          <Field.Label fontSize="sm">Nome completo</Field.Label>
          <Input
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            borderRadius="lg"
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label fontSize="sm">E-mail</Field.Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            borderRadius="lg"
          />
        </Field.Root>

        <HStack justify="flex-end">
          <Button
            colorPalette="brand"
            borderRadius="lg"
            disabled={!valido || !alterado || salvando}
            loading={salvando}
            onClick={() =>
              onSalvar({
                nomeCompleto: nomeCompleto.trim(),
                email: email.trim(),
              })
            }
          >
            Salvar dados
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
})
