import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { Box, HStack, Text, VStack } from '@/shared/ui/layout'
import { useAuthStore } from '@/stores'
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalHeading,
  TextField,
  toast,
} from '@heroui/react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Code2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
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
      toast.success('Autenticado com sucesso!')
      onClose()
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.danger('E-mail ou senha incorretos.')
      } else {
        toast.danger('Falha ao entrar. Tente novamente.')
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
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <ModalBackdrop isDismissable>
        <ModalContainer placement="center" size="sm">
          <ModalDialog className="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden p-0">
            <ModalHeader className="flex items-center gap-3 p-6 border-b border-white/5">
              <Box className="size-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Code2 className="size-5 text-white" strokeWidth={2.5} />
              </Box>
              <VStack className="gap-0.5">
                <ModalHeading className="text-lg font-bold text-white font-sans">
                  CirqueiraX Media
                </ModalHeading>
                <Text className="text-xs text-white/50">Entre com seu e-mail e senha</Text>
              </VStack>
            </ModalHeader>

            <ModalBody className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <TextField isInvalid={Boolean(erros.emailOuUsuario)}>
                  <Label className="text-xs font-semibold text-white/80">E-mail ou Usuário</Label>
                  <Input
                    placeholder="usuario@cirqueira.com ou usuario"
                    value={form.emailOuUsuario}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, emailOuUsuario: e.target.value }))
                      setErros((p) => ({ ...p, emailOuUsuario: '' }))
                    }}
                    autoFocus
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10"
                  />
                  <FieldError className="text-xs text-rose-400">{erros.emailOuUsuario}</FieldError>
                </TextField>

                <TextField isInvalid={Boolean(erros.senha)}>
                  <Label className="text-xs font-semibold text-white/80">Senha</Label>
                  <HStack className="relative w-full">
                    <Input
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.senha}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, senha: e.target.value }))
                        setErros((p) => ({ ...p, senha: '' }))
                      }}
                      className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 pr-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      onPress={() => setMostrarSenha((v) => !v)}
                      className="absolute right-1.5 text-white/40 hover:text-white/80 h-7 w-7"
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {mostrarSenha ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </Button>
                  </HStack>
                  <FieldError className="text-xs text-rose-400">{erros.senha}</FieldError>
                </TextField>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isPending={loginMutation.isPending}
                  isDisabled={loginMutation.isPending}
                  className="mt-2 h-10 font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                >
                  <Lock className="size-4 mr-1.5" />
                  <span>Entrar</span>
                </Button>
              </form>
            </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  )
}
