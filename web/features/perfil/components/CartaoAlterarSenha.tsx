import { Box, Button, Field, HStack, Input, Text, VStack } from '@chakra-ui/react'
import { memo, useState } from 'react'

export interface CartaoAlterarSenhaProps {
  salvando?: boolean
  onSalvar: (
    valores: {
      senhaAtual: string
      novaSenha: string
      confirmacaoSenha: string
    },
    aoSucesso?: () => void
  ) => void
}

export const CartaoAlterarSenha = memo(function CartaoAlterarSenha({
  salvando = false,
  onSalvar,
}: CartaoAlterarSenhaProps) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')

  const coincidem = novaSenha === confirmacaoSenha
  const valido =
    senhaAtual.length > 0 &&
    novaSenha.length >= 6 &&
    confirmacaoSenha.length >= 6 &&
    coincidem &&
    novaSenha !== senhaAtual

  function limpar() {
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmacaoSenha('')
  }

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={{ base: 4, md: 5 }}
    >
      <VStack align="stretch" gap={4}>
        <VStack align="start" gap={0}>
          <Text fontWeight="bold" color="fg">
            Alterar senha
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Informe a senha atual e escolha uma nova com no mínimo 6 caracteres
          </Text>
        </VStack>

        <Field.Root required>
          <Field.Label fontSize="sm">Senha atual</Field.Label>
          <Input
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            autoComplete="current-password"
            borderRadius="lg"
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label fontSize="sm">Nova senha</Field.Label>
          <Input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            autoComplete="new-password"
            borderRadius="lg"
          />
        </Field.Root>

        <Field.Root required invalid={confirmacaoSenha.length > 0 && !coincidem}>
          <Field.Label fontSize="sm">Confirmar nova senha</Field.Label>
          <Input
            type="password"
            value={confirmacaoSenha}
            onChange={(e) => setConfirmacaoSenha(e.target.value)}
            autoComplete="new-password"
            borderRadius="lg"
          />
          {confirmacaoSenha.length > 0 && !coincidem && (
            <Field.ErrorText fontSize="xs">As senhas não coincidem.</Field.ErrorText>
          )}
        </Field.Root>

        <HStack justify="flex-end">
          <Button
            colorPalette="brand"
            borderRadius="lg"
            disabled={!valido || salvando}
            loading={salvando}
            onClick={() => {
              onSalvar(
                { senhaAtual, novaSenha, confirmacaoSenha },
                limpar
              )
            }}
          >
            Atualizar senha
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
})
