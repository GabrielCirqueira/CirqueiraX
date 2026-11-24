import { ROTULOS_FUNCIONALIDADE } from '@/shared/utils/funcionalidadesSistema'
import { iniciaisNome } from '@/shared/utils/iniciaisNome'
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  IconButton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ChartNoAxesColumn, Pencil, Shield, Users } from 'lucide-react'
import { memo } from 'react'
import type { UsuarioSistema } from '../types'
import { resumoPermissoes } from '../utils/formularioUsuario'

export interface ListaUsuariosProps {
  usuarios: UsuarioSistema[]
  onEditar: (usuario: UsuarioSistema) => void
  onVerAtividade: (usuario: UsuarioSistema) => void
}

export const ListaUsuarios = memo(function ListaUsuarios({
  usuarios,
  onEditar,
  onVerAtividade,
}: ListaUsuariosProps) {
  if (usuarios.length === 0) {
    return (
      <Center
        py={16}
        px={6}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
        flexDirection="column"
        gap={3}
      >
        <Center boxSize={12} borderRadius="full" bg="bg.muted" color="fg.subtle">
          <Users size={22} />
        </Center>
        <Text fontWeight="semibold" color="fg">
          Nenhum usuário cadastrado
        </Text>
        <Text fontSize="sm" color="fg.muted" textAlign="center" maxW="sm">
          Crie a primeira conta para começar a distribuir acessos por funcionalidade.
        </Text>
      </Center>
    )
  }

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      overflow="hidden"
    >
      <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
        <Table.Root size="sm" variant="line">
          <Table.Header bg="bg.muted">
            <Table.Row>
              <Table.ColumnHeader py={3} px={4}>
                Usuário
              </Table.ColumnHeader>
              <Table.ColumnHeader py={3} px={4}>
                Papel
              </Table.ColumnHeader>
              <Table.ColumnHeader py={3} px={4}>
                Acesso
              </Table.ColumnHeader>
              <Table.ColumnHeader py={3} px={4} textAlign="end" w="120px">
                Ações
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {usuarios.map((usuario) => (
              <Table.Row key={usuario.id} _hover={{ bg: 'bg.muted' }}>
                <Table.Cell py={3.5} px={4}>
                  <HStack gap={3} minW={0}>
                    <AvatarUsuario nome={usuario.nomeCompleto} admin={usuario.administrador} />
                    <VStack align="start" gap={0} minW={0}>
                      <Text fontWeight="semibold" color="fg" truncate>
                        {usuario.nomeCompleto}
                      </Text>
                      <Text fontSize="xs" color="fg.muted" truncate>
                        @{usuario.username} · {usuario.email}
                      </Text>
                    </VStack>
                  </HStack>
                </Table.Cell>
                <Table.Cell py={3.5} px={4}>
                  <Badge
                    colorPalette={usuario.administrador ? 'brand' : 'gray'}
                    variant="subtle"
                    borderRadius="md"
                  >
                    {usuario.administrador ? (
                      <HStack gap={1}>
                        <Shield size={11} />
                        <Text as="span">Admin</Text>
                      </HStack>
                    ) : (
                      'Operador'
                    )}
                  </Badge>
                </Table.Cell>
                <Table.Cell py={3.5} px={4} maxW="360px">
                  {usuario.administrador ? (
                    <Text fontSize="sm" color="fg.muted">
                      Acesso total
                    </Text>
                  ) : (
                    <HStack gap={1} flexWrap="wrap">
                      {usuario.permissoes.length === 0 ? (
                        <Text fontSize="sm" color="cirqueira.orange.400">
                          Sem permissões
                        </Text>
                      ) : (
                        usuario.permissoes.slice(0, 4).map((codigo) => (
                          <Badge key={codigo} size="sm" variant="outline" borderRadius="md">
                            {ROTULOS_FUNCIONALIDADE[codigo] ?? codigo}
                          </Badge>
                        ))
                      )}
                      {usuario.permissoes.length > 4 && (
                        <Badge size="sm" variant="subtle" borderRadius="md">
                          +{usuario.permissoes.length - 4}
                        </Badge>
                      )}
                    </HStack>
                  )}
                </Table.Cell>
                <Table.Cell py={3.5} px={4} textAlign="end">
                  <IconButton
                    aria-label={`Ver atividade de ${usuario.nomeCompleto}`}
                    size="sm"
                    variant="ghost"
                    borderRadius="lg"
                    onClick={() => onVerAtividade(usuario)}
                  >
                    <ChartNoAxesColumn size={15} />
                  </IconButton>
                  <IconButton
                    aria-label={`Editar ${usuario.nomeCompleto}`}
                    size="sm"
                    variant="ghost"
                    borderRadius="lg"
                    onClick={() => onEditar(usuario)}
                  >
                    <Pencil size={15} />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <VStack display={{ base: 'flex', md: 'none' }} align="stretch" gap={0}>
        {usuarios.map((usuario, indice) => (
          <HStack
            key={usuario.id}
            p={4}
            justify="space-between"
            align="start"
            gap={3}
            borderTopWidth={indice === 0 ? 0 : '1px'}
            borderColor="border.subtle"
          >
            <HStack align="start" gap={3} minW={0}>
              <AvatarUsuario nome={usuario.nomeCompleto} admin={usuario.administrador} />
              <VStack align="start" gap={1} minW={0}>
                <Text fontWeight="semibold" color="fg" truncate>
                  {usuario.nomeCompleto}
                </Text>
                <Text fontSize="xs" color="fg.muted" truncate>
                  @{usuario.username}
                </Text>
                <Badge
                  colorPalette={usuario.administrador ? 'brand' : 'gray'}
                  variant="subtle"
                  size="sm"
                >
                  {usuario.administrador ? 'Admin' : resumoPermissoes(usuario)}
                </Badge>
              </VStack>
            </HStack>
            <HStack gap={1.5} flexShrink={0}>
              <IconButton
                aria-label={`Ver atividade de ${usuario.nomeCompleto}`}
                size="sm"
                variant="outline"
                borderRadius="lg"
                onClick={() => onVerAtividade(usuario)}
              >
                <ChartNoAxesColumn size={15} />
              </IconButton>
              <Button
                size="sm"
                variant="outline"
                borderRadius="lg"
                onClick={() => onEditar(usuario)}
              >
                Editar
              </Button>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Box>
  )
})

function AvatarUsuario({ nome, admin }: { nome: string; admin: boolean }) {
  return (
    <Center
      boxSize={10}
      borderRadius="lg"
      bg={admin ? 'cirqueira.brand.500/20' : 'bg.muted'}
      color={admin ? 'cirqueira.brand.300' : 'fg.muted'}
      fontSize="xs"
      fontWeight="bold"
      flexShrink={0}
    >
      {iniciaisNome(nome)}
    </Center>
  )
}
