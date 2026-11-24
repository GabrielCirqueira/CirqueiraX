import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  HStack,
  IconButton,
  Input,
  Portal,
  Separator,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Shield, UserPlus, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { FormularioUsuarioValores, FuncionalidadeOpcao, UsuarioSistema } from '../types'
import {
  formularioValido,
  valoresIniciaisCadastro,
  valoresIniciaisEdicao,
} from '../utils/formularioUsuario'
import { GradePermissoes } from './GradePermissoes'

export interface ModalFormularioUsuarioProps {
  aberto: boolean
  usuario?: UsuarioSistema | null
  funcionalidades: FuncionalidadeOpcao[]
  salvando?: boolean
  onFechar: () => void
  onSalvar: (valores: FormularioUsuarioValores) => void
}

function ConteudoFormularioUsuario({
  usuario,
  funcionalidades,
  salvando,
  onFechar,
  onSalvar,
}: Omit<ModalFormularioUsuarioProps, 'aberto'>) {
  const modo = usuario ? 'edicao' : 'cadastro'
  const [valores, setValores] = useState<FormularioUsuarioValores>(() =>
    usuario ? valoresIniciaisEdicao(usuario) : valoresIniciaisCadastro()
  )
  const valido = formularioValido(valores, modo)

  function atualizarCampo<K extends keyof FormularioUsuarioValores>(
    campo: K,
    valor: FormularioUsuarioValores[K]
  ) {
    setValores((atual) => ({ ...atual, [campo]: valor }))
  }

  return (
    <>
      <Dialog.Header
        px={5}
        py={4}
        borderBottomWidth="1px"
        borderColor="border.subtle"
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap={3}
      >
        <HStack gap={3} minW={0}>
          <Box
            p={2}
            borderRadius="lg"
            bg="cirqueira.brand.500/15"
            color="cirqueira.brand.300"
            display="inline-flex"
          >
            {usuario ? <Shield size={18} /> : <UserPlus size={18} />}
          </Box>
          <VStack align="start" gap={0} minW={0}>
            <Dialog.Title fontSize="md" fontWeight="bold" color="fg">
              {usuario ? 'Editar usuário' : 'Novo usuário'}
            </Dialog.Title>
            <Text fontSize="xs" color="fg.muted">
              {usuario ? `Conta @${usuario.username}` : 'Preencha os dados e defina o acesso'}
            </Text>
          </VStack>
        </HStack>
        <Dialog.CloseTrigger asChild>
          <IconButton
            aria-label="Fechar"
            size="sm"
            variant="ghost"
            borderRadius="full"
            disabled={salvando}
          >
            <X size={16} />
          </IconButton>
        </Dialog.CloseTrigger>
      </Dialog.Header>

      <Dialog.Body px={5} py={5} maxH="70vh" overflowY="auto">
        <VStack align="stretch" gap={5}>
          <VStack align="stretch" gap={3}>
            <Text fontSize="xs" fontWeight="bold" color="fg.subtle" textTransform="uppercase">
              Dados da conta
            </Text>

            <Field.Root required>
              <Field.Label fontSize="sm">Nome completo</Field.Label>
              <Input
                value={valores.nomeCompleto}
                onChange={(e) => atualizarCampo('nomeCompleto', e.target.value)}
                placeholder="Nome e sobrenome"
                borderRadius="lg"
              />
            </Field.Root>

            <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
              {modo === 'cadastro' && (
                <Field.Root required flex={1}>
                  <Field.Label fontSize="sm">Usuário</Field.Label>
                  <Input
                    value={valores.username}
                    onChange={(e) => atualizarCampo('username', e.target.value)}
                    placeholder="login"
                    autoComplete="off"
                    borderRadius="lg"
                  />
                </Field.Root>
              )}
              <Field.Root required flex={1.4}>
                <Field.Label fontSize="sm">E-mail</Field.Label>
                <Input
                  type="email"
                  value={valores.email}
                  onChange={(e) => atualizarCampo('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  borderRadius="lg"
                />
              </Field.Root>
            </Flex>

            <Field.Root required={modo === 'cadastro'}>
              <Field.Label fontSize="sm">
                {modo === 'cadastro' ? 'Senha' : 'Nova senha (opcional)'}
              </Field.Label>
              <Input
                type="password"
                value={valores.senha}
                onChange={(e) => atualizarCampo('senha', e.target.value)}
                placeholder={
                  modo === 'cadastro' ? 'Mínimo 6 caracteres' : 'Deixe em branco para manter'
                }
                autoComplete="new-password"
                borderRadius="lg"
              />
            </Field.Root>
          </VStack>

          <Separator borderColor="border.subtle" />

          <VStack align="stretch" gap={3}>
            <Text fontSize="xs" fontWeight="bold" color="fg.subtle" textTransform="uppercase">
              Controle de acesso
            </Text>

            <HStack
              justify="space-between"
              align="center"
              px={3}
              py={3}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={valores.administrador ? 'cirqueira.brand.500/40' : 'border.subtle'}
              bg={valores.administrador ? 'cirqueira.brand.500/8' : 'bg.muted'}
            >
              <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  Administrador
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  Ignora a lista e libera todas as telas
                </Text>
              </VStack>
              <Switch.Root
                colorPalette="brand"
                checked={valores.administrador}
                onCheckedChange={(evento) =>
                  atualizarCampo('administrador', Boolean(evento.checked))
                }
              >
                <Switch.HiddenInput />
                <Switch.Control />
              </Switch.Root>
            </HStack>

            <GradePermissoes
              funcionalidades={funcionalidades}
              selecionadas={valores.permissoes}
              desabilitado={valores.administrador}
              onChange={(permissoes) => atualizarCampo('permissoes', permissoes)}
            />
          </VStack>
        </VStack>
      </Dialog.Body>

      <Dialog.Footer
        px={5}
        py={4}
        borderTopWidth="1px"
        borderColor="border.subtle"
        gap={2}
        justifyContent="flex-end"
      >
        <Button variant="ghost" borderRadius="lg" onClick={onFechar} disabled={salvando}>
          Cancelar
        </Button>
        <Button
          colorPalette="brand"
          borderRadius="lg"
          disabled={!valido || salvando}
          loading={salvando}
          onClick={() => onSalvar(valores)}
        >
          {usuario ? 'Salvar' : 'Criar usuário'}
        </Button>
      </Dialog.Footer>
    </>
  )
}

export const ModalFormularioUsuario = memo(function ModalFormularioUsuario({
  aberto,
  usuario,
  funcionalidades,
  salvando = false,
  onFechar,
  onSalvar,
}: ModalFormularioUsuarioProps) {
  const chaveFormulario = usuario ? `edicao-${usuario.id}` : 'cadastro'

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={aberto}
      onOpenChange={(detalhes) => {
        if (!detalhes.open && !salvando) onFechar()
      }}
      size="xl"
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="xl"
            maxW="640px"
            w="full"
            mx={4}
            p={0}
            overflow="hidden"
            shadow="2xl"
          >
            {aberto && (
              <ConteudoFormularioUsuario
                key={chaveFormulario}
                usuario={usuario}
                funcionalidades={funcionalidades}
                salvando={salvando}
                onFechar={onFechar}
                onSalvar={onSalvar}
              />
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
