import { useSEO } from '@/shared/hooks'
import { Box, Button, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { UserPlus } from 'lucide-react'
import { memo, useState } from 'react'
import { ListaUsuarios, ModalFormularioUsuario, ModalResumoUsuario } from './components'
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
  const [usuarioResumo, setUsuarioResumo] = useState<UsuarioSistema | null>(null)

  const { data: usuarios = [], isLoading, isError, refetch } = useListarUsuarios()
  const funcionalidades = catalogoFuncionalidadesSistema()
  const cadastrar = useCadastrarUsuario()
  const atualizar = useAtualizarUsuario()

  const salvando = cadastrar.isPending || atualizar.isPending
  const totalAdmins = usuarios.filter((u) => u.administrador).length

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
        <HStack
          justify="space-between"
          align={{ base: 'flex-start', sm: 'center' }}
          flexWrap="wrap"
          gap={4}
        >
          <HStack gap={3} align="center" flexWrap="wrap">
            <Text
              as="h1"
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="black"
              color="fg"
              letterSpacing="tight"
            >
              Usuários
            </Text>
            {!isLoading && !isError && (
              <HStack
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                px={2.5}
                py={1}
                borderRadius="full"
                fontSize="xs"
                color="fg.muted"
                gap={1.5}
              >
                <Text as="span" fontSize="11px" fontWeight="medium">
                  {usuarios.length} {usuarios.length === 1 ? 'conta' : 'contas'}
                  {totalAdmins > 0 ? ` · ${totalAdmins} admin` : ''}
                </Text>
              </HStack>
            )}
          </HStack>

          <Button size="sm" colorPalette="brand" borderRadius="full" onClick={abrirCadastro}>
            <UserPlus size={15} />
            Novo usuário
          </Button>
        </HStack>

        {isLoading ? (
          <VStack gap={3} align="stretch">
            <Skeleton height="52px" borderRadius="xl" />
            <Skeleton height="220px" borderRadius="xl" />
          </VStack>
        ) : isError ? (
          <Box p={6} borderRadius="xl" borderWidth="1px" borderColor="border.subtle" bg="bg.panel">
            <VStack align="start" gap={3}>
              <Text fontWeight="semibold" color="fg">
                Não foi possível carregar os usuários
              </Text>
              <Button
                size="sm"
                colorPalette="brand"
                borderRadius="full"
                onClick={() => void refetch()}
              >
                Tentar de novo
              </Button>
            </VStack>
          </Box>
        ) : (
          <ListaUsuarios
            usuarios={usuarios}
            onEditar={abrirEdicao}
            onVerAtividade={setUsuarioResumo}
          />
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

      <ModalResumoUsuario usuario={usuarioResumo} onFechar={() => setUsuarioResumo(null)} />
    </Box>
  )
})
