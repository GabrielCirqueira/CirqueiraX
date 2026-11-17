import { ROTULOS_FUNCIONALIDADE } from '@/shared/utils/funcionalidadesSistema'
import { Badge, Box, Button, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Pencil, Shield, UserRound } from 'lucide-react'
import { memo } from 'react'
import type { UsuarioSistema } from '../types'
import { resumoPermissoes } from '../utils/formularioUsuario'

export interface ListaUsuariosProps {
  usuarios: UsuarioSistema[]
  onEditar: (usuario: UsuarioSistema) => void
}

export const ListaUsuarios = memo(function ListaUsuarios({
  usuarios,
  onEditar,
}: ListaUsuariosProps) {
  if (usuarios.length === 0) {
    return (
      <Box
        p={8}
        borderRadius="12px"
        border="1px dashed"
        borderColor="border.subtle"
        textAlign="center"
      >
        <Text color="fg.muted">Nenhum usuário cadastrado ainda.</Text>
      </Box>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
      {usuarios.map((usuario) => (
        <Box
          key={usuario.id}
          p={4}
          borderRadius="12px"
          border="1px solid"
          borderColor="border.subtle"
          bg="bg.panel"
        >
          <HStack justify="space-between" align="start" gap={3}>
            <HStack align="start" gap={3} minW={0}>
              <Box
                boxSize={10}
                borderRadius="full"
                bg="brand.subtle"
                color="cirqueira.brand.300"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                {usuario.administrador ? <Shield size={18} /> : <UserRound size={18} />}
              </Box>
              <VStack align="start" gap={1} minW={0}>
                <Text fontWeight="semibold" color="fg" truncate>
                  {usuario.nomeCompleto}
                </Text>
                <Text fontSize="sm" color="fg.muted" truncate>
                  @{usuario.username} · {usuario.email}
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  <Badge colorPalette={usuario.administrador ? 'brand' : 'gray'} variant="subtle">
                    {usuario.administrador ? 'Administrador' : 'Usuário'}
                  </Badge>
                  <Badge variant="outline">{resumoPermissoes(usuario)}</Badge>
                </HStack>
                {!usuario.administrador && usuario.permissoes.length > 0 && (
                  <HStack gap={1} flexWrap="wrap" pt={1}>
                    {usuario.permissoes.map((codigo) => (
                      <Badge key={codigo} size="sm" variant="surface">
                        {ROTULOS_FUNCIONALIDADE[codigo] ?? codigo}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </VStack>
            </HStack>
            <Button
              size="sm"
              variant="ghost"
              colorPalette="brand"
              onClick={() => onEditar(usuario)}
            >
              <Pencil size={14} />
              Editar
            </Button>
          </HStack>
        </Box>
      ))}
    </SimpleGrid>
  )
})
