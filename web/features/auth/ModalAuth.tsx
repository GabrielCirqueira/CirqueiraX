import { api } from '@/config/api'
import { addToast } from '@/shared/components/ui/toaster'
import type { RespostaApi } from '@/shared/types/api'
import { useAuthStore } from '@/stores'
import { Box, Button, Dialog, Field, HStack, Input, Text, VStack } from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Code2, Eye, EyeOff, Lock } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { z } from 'zod'
import type { LoginInput, RespostaLogin, RespostaMe } from './types'

const loginSchema = z.object({
  emailOuUsuario: z.string().min(1, 'Informe seu e-mail ou nome de usuário.'),
  senha: z.string().min(1, 'Informe a senha.'),
})

interface ModalAuthProps {
  isOpen: boolean
  onClose: () => void
}

export function ModalAuth({ isOpen, onClose }: ModalAuthProps) {
  const { setAutenticado } = useAuthStore()

  const [form, setForm] = useState<LoginInput>({ emailOuUsuario: '', senha: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data: loginData } = await api.post<RespostaLogin>('/api/v1/auth/login', {
        username: input.emailOuUsuario.trim(),
        senha: input.senha,
      })

      const { data: meResposta } = await api.get<RespostaApi<RespostaMe>>('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${loginData.token}` },
      })
      const meData = meResposta.data

      setAutenticado(
        {
          id: meData.id,
          nomeCompleto: meData.nomeCompleto,
          username: meData.username,
          email: meData.email,
          roles: meData.roles,
          criadoEm: meData.criadoEm,
        },
        loginData.token,
        loginData.refresh_token
      )
    },
    onSuccess: () => {
      addToast({ title: 'Autenticado com sucesso!', color: 'success' })
      onClose()
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        addToast({ title: 'E-mail ou senha incorretos.', color: 'danger' })
      } else {
        addToast({ title: 'Falha ao entrar. Tente novamente.', color: 'danger' })
      }
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const resultado = loginSchema.safeParse(form)
    if (!resultado.success) {
      const errosCampos: Record<string, string> = {}
      for (const erro of resultado.error.issues) {
        errosCampos[erro.path[0] as string] = erro.message
      }
      setErros(errosCampos)
      return
    }
    loginMutation.mutate(resultado.data)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onClose() }}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content bg="zinc.950" border="1px solid" borderColor="whiteAlpha.200" color="white" borderRadius="2xl" p={0} maxW="md">
          <Dialog.Header p={6} borderBottom="1px solid" borderColor="whiteAlpha.100" display="flex" alignItems="center" gap={3}>
            <Box w={9} h={9} borderRadius="xl" bg="brand.500" display="flex" alignItems="center" justifyContent="center" shadow="lg">
              <Code2 size={20} color="white" strokeWidth={2.5} />
            </Box>
            <VStack alignItems="flex-start" gap={0.5}>
              <Dialog.Title fontSize="lg" fontWeight="bold">
                CirqueiraX Media
              </Dialog.Title>
              <Text fontSize="xs" color="whiteAlpha.500">Entre com seu e-mail e senha</Text>
            </VStack>
          </Dialog.Header>

          <Dialog.Body p={6}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
              <Field.Root invalid={Boolean(erros.emailOuUsuario)}>
                <Field.Label fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">E-mail ou Usuário</Field.Label>
                <Input
                  placeholder="usuario@cirqueira.com ou usuario"
                  value={form.emailOuUsuario}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, emailOuUsuario: e.target.value }))
                    setErros((p) => ({ ...p, emailOuUsuario: '' }))
                  }}
                  autoFocus
                  w="full"
                  bg="whiteAlpha.50"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: 'whiteAlpha.400' }}
                  h={10}
                />
                <Field.ErrorText fontSize="xs" color="rose.400">{erros.emailOuUsuario}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={Boolean(erros.senha)}>
                <Field.Label fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">Senha</Field.Label>
                <HStack position="relative" w="full">
                  <Input
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.senha}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, senha: e.target.value }))
                      setErros((p) => ({ ...p, senha: '' }))
                    }}
                    w="full"
                    bg="whiteAlpha.50"
                    borderColor="whiteAlpha.200"
                    color="white"
                    _placeholder={{ color: 'whiteAlpha.400' }}
                    h={10}
                    pr={9}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setMostrarSenha((v) => !v)}
                    position="absolute"
                    right={1.5}
                    color="whiteAlpha.400"
                    _hover={{ color: 'whiteAlpha.800' }}
                    h={7}
                    w={7}
                    p={0}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {mostrarSenha ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                  </Button>
                </HStack>
                <Field.ErrorText fontSize="xs" color="rose.400">{erros.senha}</Field.ErrorText>
              </Field.Root>

              <Button
                type="submit"
                loading={loginMutation.isPending}
                disabled={loginMutation.isPending}
                mt={2}
                h={10}
                fontWeight="bold"
                bg="brand.500"
                _hover={{ bg: 'brand.600' }}
                color="white"
                w="full"
                borderRadius="xl"
                shadow="lg"
              >
                <Lock size={16} style={{ marginRight: '6px' }} />
                <span>Entrar</span>
              </Button>
            </form>
          </Dialog.Body>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
