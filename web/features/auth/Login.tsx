import { useLogin } from '@/features/auth'
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Field,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Code2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
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
    <Container
      maxW="sm"
      minH="80vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
    >
      <Box w="full" maxW="md" position="relative">
        <Box
          position="absolute"
          inset={-1}
          borderRadius="3xl"
          bgGradient="to-r"
          gradientFrom="cirqueira.brand.500/30"
          gradientVia="cirqueira.purple.600/20"
          gradientTo="cirqueira.blue.600/30"
          filter="blur(16px)"
          opacity={0.7}
          pointerEvents="none"
        />

        <Card.Root
          bg="zinc.950"
          borderColor="whiteAlpha.200"
          border="1px solid"
          borderRadius="3xl"
          overflow="hidden"
          position="relative"
          shadow="2xl"
        >
          <Card.Header
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={3}
            pb={2}
            pt={8}
            px={8}
            textAlign="center"
          >
            <HStack gap={2.5} alignItems="center" justifyContent="center">
              <Center
                boxSize={10}
                rounded="2xl"
                bg="cirqueira.brand.500"
                color="cirqueira.grey.0"
                shadow="lg"
              >
                <Code2 size={20} color="currentColor" strokeWidth={2.5} />
              </Center>
              <Text
                as="span"
                fontWeight="900"
                fontSize="xl"
                letterSpacing="tight"
                color="white"
                fontFamily="heading"
              >
                Cirqueira
                <Text as="span" color="cirqueira.brand.700">
                  X
                </Text>{' '}
                <Text
                  as="span"
                  fontSize="xs"
                  fontWeight="semibold"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  bg="cirqueira.brand.500/10"
                  color="cirqueira.brand.400"
                  border="1px solid"
                  borderColor="cirqueira.brand.500/20"
                  ml={1}
                >
                  Media
                </Text>
              </Text>
            </HStack>

            <VStack gap={1} alignItems="center">
              <Text as="h1" fontSize="2xl" fontWeight="bold" color="white">
                Acesso ao Sistema
              </Text>
              <Text fontSize="xs" color="whiteAlpha.500" maxW="xs">
                Informe suas credenciais para gerenciar pipelines e downloads
              </Text>
            </VStack>

            <Badge
              variant="subtle"
              colorPalette="purple"
              border="1px solid"
              borderColor="whiteAlpha.100"
              color="whiteAlpha.700"
              fontSize="11px"
              fontWeight="medium"
              px={2.5}
              py={1}
              borderRadius="full"
            >
              <Box as="span" color="cirqueira.purple.400" display="inline-flex" alignItems="center">
                <ShieldCheck size={14} style={{ marginRight: '4px' }} color="currentColor" />
              </Box>
              Autenticação Segura JWT RS256
            </Badge>
          </Card.Header>

          <Card.Body px={8} py={6}>
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <Field.Root invalid={Boolean(erros.emailOuUsuario)}>
                <Field.Label fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">
                  E-mail ou Usuário
                </Field.Label>
                <Input
                  placeholder="usuario@cirqueira.com ou usuario"
                  value={form.emailOuUsuario}
                  onChange={(e) => handleChange('emailOuUsuario', e.target.value)}
                  autoComplete="username"
                  autoFocus
                  w="full"
                  bg="whiteAlpha.50"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: 'whiteAlpha.400' }}
                  h={11}
                />
                <Field.ErrorText fontSize="xs" color="rose.400">
                  {erros.emailOuUsuario}
                </Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={Boolean(erros.senha)}>
                <Field.Label fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">
                  Senha de Acesso
                </Field.Label>
                <HStack position="relative" w="full">
                  <Input
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.senha}
                    onChange={(e) => handleChange('senha', e.target.value)}
                    autoComplete="current-password"
                    w="full"
                    bg="whiteAlpha.50"
                    borderColor="whiteAlpha.200"
                    color="white"
                    _placeholder={{ color: 'whiteAlpha.400' }}
                    h={11}
                    pr={10}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setMostrarSenha((v) => !v)}
                    position="absolute"
                    right={2}
                    color="whiteAlpha.400"
                    _hover={{ color: 'whiteAlpha.800' }}
                    h={7}
                    w={7}
                    p={0}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </HStack>
                <Field.ErrorText fontSize="xs" color="rose.400">
                  {erros.senha}
                </Field.ErrorText>
              </Field.Root>

              <Button
                type="submit"
                loading={login.isPending}
                disabled={login.isPending}
                mt={2}
                h={11}
                fontWeight="bold"
                bg="cirqueira.brand.500"
                _hover={{ bg: 'cirqueira.brand.600' }}
                color="cirqueira.grey.0"
                w="full"
                borderRadius="xl"
                shadow="lg"
              >
                <Lock size={16} style={{ marginRight: '6px' }} />
                <Text as="span">Entrar no Hub</Text>
              </Button>
            </form>

            <Box
              mt={6}
              pt={4}
              borderTop="1px solid"
              borderColor="whiteAlpha.100"
              textAlign="center"
            >
              <Text fontSize="11px" color="whiteAlpha.400">
                Acesso restrito. Novos usuários são provisionados via CLI administrativa (
                <Text as="span" fontFamily="mono" color="cirqueira.brand.400">
                  app:usuario:criar
                </Text>
                ).
              </Text>
            </Box>
          </Card.Body>
        </Card.Root>
      </Box>
    </Container>
  )
}
