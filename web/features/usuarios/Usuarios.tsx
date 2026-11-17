import { useSEO } from '@/shared/hooks'
import { Box, Button, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { UserPlus, Users } from 'lucide-react'
import { memo, useState } from 'react'
import { ListaUsuarios, ModalFormularioUsuario } from './components'
import { useAtualizarUsuario, useCadastrarUsuario, useListarUsuarios } from './hooks'
import type { FormularioUsuarioValores, UsuarioSistema } from './types'
import { catalogoFuncionalidadesSistema } from './utils'

export function Component() {
  return <UsuariosView />
}

export const Usuarios = Component

const UsuariosView = memo(function UsuariosView() {
  useSEO({
    title: 'Gerenciar Usuários',
    description: 'Crie usuários e defina permissões por funcionalidade no CirqueiraX.',
    keywords: 'usuarios, permissoes, administracao, cirqueirax',
  })

  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEdicao, setUsuarioEdicao] = useState<UsuarioSistema | null>(null)

  const { data: usuarios = [], isLoading, isError, refetch } = useListarUsuarios()
  const funcionalidades = catalogoFuncionalidadesSistema()
  const cadastrar = useCadastrarUsuario()
  const atualizar = useAtualizarUsuario()

  const salvando = cadastrar.isPending || atualizar.isPending

  function abrirCadastro() {
    setUsuarioEdicao(null)
    setModalAberto(true)
  }

  function abrirEdicao(usuario: UsuarioSistema) {
    setUsuarioEdicao(usuario)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setUsuarioEdicao(null)
  }

  function salvar(valores: FormularioUsuarioValores) {
    if (usuarioEdicao) {
      atualizar.mutate(
        {
          id: usuarioEdicao.id,
          input: {
            nomeCompleto: valores.nomeCompleto.trim(),
            email: valores.email.trim(),
            administrador: valores.administrador,
            permissoes: valores.administrador ? [] : valores.permissoes,
            senha: valores.senha.trim() || undefined,
          },
        },
        { onSuccess: fecharModal }
      )
      return
    }

    cadastrar.mutate(
      {
        nomeCompleto: valores.nomeCompleto.trim(),
        username: valores.username.trim(),
        email: valores.email.trim(),
        senha: valores.senha,
        administrador: valores.administrador,
        permissoes: valores.administrador ? [] : valores.permissoes,
      },
      { onSuccess: fecharModal }
    )
  }

  return (
    <Box w="full" maxW="7xl" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
      <VStack w="full" gap={6} alignItems="stretch">
        <HStack justify="space-between" align="start" gap={4} flexWrap="wrap">
          <HStack gap={3} align="start">
            <Box
              boxSize={11}
              borderRadius="12px"
              bg="brand.subtle"
              color="cirqueira.brand.300"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Users size={22} />
            </Box>
            <VStack align="start" gap={1}>
              <Text as="h1" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="fg">
                Gerenciar usuários
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Crie contas e controle o acesso por funcionalidade.
              </Text>
            </VStack>
          </HStack>

          <Button colorPalette="brand" onClick={abrirCadastro}>
            <UserPlus size={16} />
            Novo usuário
          </Button>
        </HStack>

        {isLoading ? (
          <VStack gap={3} align="stretch">
            <Skeleton height="112px" borderRadius="12px" />
            <Skeleton height="112px" borderRadius="12px" />
          </VStack>
        ) : isError ? (
          <Box
            p={6}
            borderRadius="12px"
            border="1px solid"
            borderColor="border.subtle"
            bg="bg.panel"
          >
            <VStack align="start" gap={3}>
              <Text color="fg">Não foi possível carregar os usuários.</Text>
              <Button size="sm" colorPalette="brand" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            </VStack>
          </Box>
        ) : (
          <ListaUsuarios usuarios={usuarios} onEditar={abrirEdicao} />
        )}
      </VStack>

      <ModalFormularioUsuario
        aberto={modalAberto}
        usuario={usuarioEdicao}
        funcionalidades={funcionalidades}
        salvando={salvando}
        onFechar={fecharModal}
        onSalvar={salvar}
      />
    </Box>
  )
})
