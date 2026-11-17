import {
  Box,
  Button,
  Dialog,
  Field,
  HStack,
  Input,
  Portal,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react'
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
      <Dialog.Header>
        <Dialog.Title>{usuario ? 'Editar usuário' : 'Novo usuário'}</Dialog.Title>
        <Dialog.CloseTrigger />
      </Dialog.Header>
      <Dialog.Body>
        <VStack align="stretch" gap={4}>
          <Field.Root required>
            <Field.Label>Nome completo</Field.Label>
            <Input
              value={valores.nomeCompleto}
              onChange={(e) => atualizarCampo('nomeCompleto', e.target.value)}
              placeholder="Nome e sobrenome"
            />
          </Field.Root>

          {modo === 'cadastro' && (
            <Field.Root required>
              <Field.Label>Usuário</Field.Label>
              <Input
                value={valores.username}
                onChange={(e) => atualizarCampo('username', e.target.value)}
                placeholder="usuario.login"
                autoComplete="off"
              />
            </Field.Root>
          )}

          <Field.Root required>
            <Field.Label>E-mail</Field.Label>
            <Input
              type="email"
              value={valores.email}
              onChange={(e) => atualizarCampo('email', e.target.value)}
              placeholder="email@exemplo.com"
            />
          </Field.Root>

          <Field.Root required={modo === 'cadastro'}>
            <Field.Label>{modo === 'cadastro' ? 'Senha' : 'Nova senha (opcional)'}</Field.Label>
            <Input
              type="password"
              value={valores.senha}
              onChange={(e) => atualizarCampo('senha', e.target.value)}
              placeholder={modo === 'cadastro' ? 'Mínimo 6 caracteres' : 'Deixe em branco'}
              autoComplete="new-password"
            />
          </Field.Root>

          <Box
            p={3}
            borderRadius="10px"
            border="1px solid"
            borderColor="border.subtle"
            bg="bg.muted"
          >
            <HStack justify="space-between">
              <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="semibold">
                  Administrador
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  Acesso total a todas as funcionalidades
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
          </Box>

          <GradePermissoes
            funcionalidades={funcionalidades}
            selecionadas={valores.permissoes}
            desabilitado={valores.administrador}
            onChange={(permissoes) => atualizarCampo('permissoes', permissoes)}
          />
        </VStack>
      </Dialog.Body>
      <Dialog.Footer>
        <HStack gap={2}>
          <Button variant="ghost" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            colorPalette="brand"
            disabled={!valido || salvando}
            loading={salvando}
            onClick={() => onSalvar(valores)}
          >
            {usuario ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </HStack>
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
      open={aberto}
      onOpenChange={(detalhes) => {
        if (!detalhes.open) onFechar()
      }}
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.panel" border="1px solid" borderColor="border.subtle">
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
