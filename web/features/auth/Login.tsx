import { useLogin } from '@/features/auth'
import { Box, Container, HStack, Text, VStack } from '@/shared/ui/layout'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FieldError,
  Input,
  Label,
  TextField,
} from '@heroui/react'
import { Code2, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { z } from 'zod'

const loginSchema = z.object({
  emailOuUsuario: z.string().min(1, 'Informe seu e-mail ou nome de usuário.'),
  senha: z.string().min(1, 'Informe sua senha de acesso.'),
})

export function Component() {
  const login = useLogin()
  const [form, setForm] = useState({ emailOuUsuario: '', senha: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  function handleChange(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErros((prev) => ({ ...prev, [campo]: '' }))
  }

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

    login.mutate(resultado.data)
  }

  return (
    <Container size="sm" className="min-h-[80vh] flex items-center justify-center py-12">
      <Box className="w-full max-w-md relative">
        {/* Glow de fundo */}
        <Box className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-500/30 via-purple-600/20 to-blue-600/30 blur-xl opacity-70 pointer-events-none" />

        <Card className="relative border border-white/10 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-col items-center gap-3 pb-2 pt-8 px-8 text-center">
            {/* Logo Badge */}
            <HStack className="gap-2.5 items-center justify-center">
              <Box className="size-10 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Code2 className="size-5 text-white" strokeWidth={2.5} />
              </Box>
              <Text as="span" className="font-black font-sans text-xl tracking-tight text-white">
                Cirqueira
                <Text as="span" className="text-brand-500">
                  X
                </Text>{' '}
                <Text
                  as="span"
                  className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 ml-1"
                >
                  Media
                </Text>
              </Text>
            </HStack>

            <VStack className="gap-1 items-center">
              <Text as="h1" className="text-2xl font-bold font-sans text-white">
                Acesso ao Sistema
              </Text>
              <Text className="text-xs text-white/50 max-w-xs">
                Informe suas credenciais para gerenciar pipelines e downloads
              </Text>
            </VStack>

            <Chip
              variant="soft"
              size="sm"
              className="border border-white/10 bg-white/5 text-white/70 text-[11px] font-medium"
            >
              <ShieldCheck className="size-3.5 mr-1 text-brand-400" />
              Autenticação Segura JWT RS256
            </Chip>
          </CardHeader>

          <CardContent className="px-8 py-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <TextField isInvalid={Boolean(erros.emailOuUsuario)}>
                <Label className="text-xs font-semibold text-white/80">E-mail ou Usuário</Label>
                <Input
                  placeholder="usuario@cirqueira.com ou usuario"
                  value={form.emailOuUsuario}
                  onChange={(e) => handleChange('emailOuUsuario', e.target.value)}
                  autoComplete="username"
                  autoFocus
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11"
                />
                <FieldError className="text-xs text-rose-400">{erros.emailOuUsuario}</FieldError>
              </TextField>

              <TextField isInvalid={Boolean(erros.senha)}>
                <Label className="text-xs font-semibold text-white/80">Senha de Acesso</Label>
                <HStack className="relative w-full">
                  <Input
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.senha}
                    onChange={(e) => handleChange('senha', e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    onPress={() => setMostrarSenha((v) => !v)}
                    className="absolute right-2 text-white/40 hover:text-white/80 h-7 w-7"
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </HStack>
                <FieldError className="text-xs text-rose-400">{erros.senha}</FieldError>
              </TextField>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isPending={login.isPending}
                isDisabled={login.isPending}
                className="mt-2 h-11 font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 transition-all"
              >
                <Lock className="size-4 mr-1.5" />
                <span>Entrar no Hub</span>
              </Button>
            </form>

            <Box className="mt-6 pt-4 border-t border-white/5 text-center">
              <Text className="text-[11px] text-white/40">
                Acesso restrito. Novos usuários são provisionados via CLI administrativa (
                <Text as="span" className="font-mono text-brand-400">
                  app:usuario:criar
                </Text>
                ).
              </Text>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
