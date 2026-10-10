import { useLogin } from '@/features/auth'
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Field,
  Grid,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  ArrowRight,
  Code2,
  DownloadCloud,
  Eye,
  EyeOff,
  FolderSync,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'

const loginSchema = z.object({
  emailOuUsuario: z.string().min(1, 'Informe seu e-mail ou usuário.'),
  senha: z.string().min(1, 'Informe sua senha.'),
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
    <Box
      minH="100vh"
      w="full"
      bg="zinc.950"
      color="white"
      position="relative"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box
        position="absolute"
        top="-10%"
        left="-10%"
        w="600px"
        h="600px"
        borderRadius="full"
        bg="cirqueira.brand.500/12"
        filter="blur(140px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-10%"
        right="-10%"
        w="650px"
        h="650px"
        borderRadius="full"
        bg="cirqueira.blue.500/10"
        filter="blur(160px)"
        pointerEvents="none"
      />

      <HStack
        w="full"
        maxW="7xl"
        mx="auto"
        px={{ base: 6, md: 10 }}
        py={6}
        justify="space-between"
        align="center"
        position="relative"
        zIndex={10}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <HStack gap={2.5} align="center">
            <Center
              boxSize={9}
              rounded="xl"
              bg="cirqueira.brand.500"
              color="cirqueira.grey.0"
              shadow="0 4px 15px -2px rgba(0, 186, 156, 0.4)"
            >
              <Code2 size={18} color="currentColor" strokeWidth={2.5} />
            </Center>
            <Text
              as="span"
              fontWeight="900"
              fontSize="lg"
              letterSpacing="tight"
              color="white"
              fontFamily="heading"
            >
              Cirqueira
              <Text as="span" color="cirqueira.brand.400">
                X
              </Text>
            </Text>
          </HStack>
        </Link>

        <Badge
          variant="subtle"
          colorPalette="brand"
          border="1px solid"
          borderColor="cirqueira.brand.500/30"
          color="cirqueira.brand.400"
          fontSize="xs"
          px={3}
          py={1}
          borderRadius="full"
        >
          Hub de Mídias
        </Badge>
      </HStack>

      <Container
        maxW="7xl"
        w="full"
        flex={1}
        display="flex"
        alignItems="center"
        py={{ base: 8, md: 12 }}
        px={{ base: 6, md: 10 }}
        position="relative"
        zIndex={1}
      >
        <Grid
          templateColumns={{ base: '1fr', lg: '1.15fr 0.85fr' }}
          gap={{ base: 12, lg: 16 }}
          alignItems="center"
          w="full"
        >
          <VStack align="flex-start" gap={8}>
            <VStack align="flex-start" gap={4}>
              <Badge
                variant="subtle"
                colorPalette="brand"
                border="1px solid"
                borderColor="cirqueira.brand.500/30"
                color="cirqueira.brand.400"
                fontWeight="semibold"
                px={3.5}
                py={1.5}
                borderRadius="full"
                fontSize="xs"
                display="inline-flex"
                alignItems="center"
              >
                <Box as="span" display="inline-flex" mr={1.5}>
                  <Sparkles size={14} color="currentColor" />
                </Box>
                Sua Central Pessoal de Mídias
              </Badge>

              <Text
                as="h1"
                fontSize={{ base: '3xl', sm: '4xl', xl: '5xl' }}
                fontWeight="black"
                letterSpacing="tight"
                lineHeight="1.15"
                color="white"
              >
                Todas as suas mídias centralizadas em um{' '}
                <Text as="span" color="cirqueira.brand.400">
                  único ambiente.
                </Text>
              </Text>

              <Text
                fontSize={{ base: 'sm', sm: 'md' }}
                color="whiteAlpha.700"
                lineHeight="relaxed"
                maxW="xl"
              >
                Baixe vídeos da web em alta qualidade, sincronize fotos diretamente do seu celular e
                mantenha seus álbuns categorizados de forma inteligente.
              </Text>
            </VStack>

            <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={4} w="full">
              <Box
                p={4}
                borderRadius="2xl"
                bg="whiteAlpha.50"
                borderWidth="1px"
                borderColor="whiteAlpha.100"
                backdropFilter="blur(10px)"
                transition="all 0.2s"
                _hover={{ borderColor: 'cirqueira.brand.500/40', transform: 'translateY(-2px)' }}
              >
                <Center
                  boxSize={10}
                  rounded="xl"
                  bg="cirqueira.brand.500/15"
                  color="cirqueira.brand.400"
                  mb={3}
                >
                  <DownloadCloud size={20} color="currentColor" />
                </Center>
                <Text fontSize="sm" fontWeight="bold" color="white" mb={1}>
                  Downloads
                </Text>
                <Text fontSize="xs" color="whiteAlpha.600" lineHeight="short">
                  YouTube, TikTok, Twitter e Instagram em 1 clique.
                </Text>
              </Box>

              <Box
                p={4}
                borderRadius="2xl"
                bg="whiteAlpha.50"
                borderWidth="1px"
                borderColor="whiteAlpha.100"
                backdropFilter="blur(10px)"
                transition="all 0.2s"
                _hover={{ borderColor: 'cirqueira.brand.500/40', transform: 'translateY(-2px)' }}
              >
                <Center
                  boxSize={10}
                  rounded="xl"
                  bg="cirqueira.blue.500/15"
                  color="cirqueira.blue.400"
                  mb={3}
                >
                  <FolderSync size={20} color="currentColor" />
                </Center>
                <Text fontSize="sm" fontWeight="bold" color="white" mb={1}>
                  Sincronização
                </Text>
                <Text fontSize="xs" color="whiteAlpha.600" lineHeight="short">
                  Fotos do celular enviadas direto ao seu storage.
                </Text>
              </Box>

              <Box
                p={4}
                borderRadius="2xl"
                bg="whiteAlpha.50"
                borderWidth="1px"
                borderColor="whiteAlpha.100"
                backdropFilter="blur(10px)"
                transition="all 0.2s"
                _hover={{ borderColor: 'cirqueira.brand.500/40', transform: 'translateY(-2px)' }}
              >
                <Center
                  boxSize={10}
                  rounded="xl"
                  bg="cirqueira.purple.500/15"
                  color="cirqueira.purple.400"
                  mb={3}
                >
                  <Layers size={20} color="currentColor" />
                </Center>
                <Text fontSize="sm" fontWeight="bold" color="white" mb={1}>
                  Organização
                </Text>
                <Text fontSize="xs" color="whiteAlpha.600" lineHeight="short">
                  Álbuns categorizados e integrados ao Google Fotos.
                </Text>
              </Box>
            </Grid>
          </VStack>

          <Box w="full" maxW={{ base: 'md', lg: 'none' }} mx="auto" position="relative">
            <Box
              position="absolute"
              inset={-2}
              borderRadius="3xl"
              bg="cirqueira.brand.500/15"
              filter="blur(24px)"
              opacity={0.7}
              pointerEvents="none"
            />

            <Card.Root
              bg="zinc.900/90"
              borderColor="whiteAlpha.200"
              borderWidth="1px"
              borderRadius="3xl"
              shadow="2xl"
              backdropFilter="blur(24px)"
              overflow="hidden"
            >
              <Card.Header
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                gap={1.5}
                pt={{ base: 8, sm: 9 }}
                pb={2}
                px={{ base: 6, sm: 8 }}
              >
                <Text as="h2" fontSize="2xl" fontWeight="black" color="white" letterSpacing="tight">
                  Bem-vindo de volta
                </Text>
                <Text fontSize="xs" color="whiteAlpha.600">
                  Informe suas credenciais para gerenciar suas mídias
                </Text>
              </Card.Header>

              <Card.Body px={{ base: 6, sm: 8 }} pb={{ base: 8, sm: 9 }} pt={4}>
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                  <Field.Root invalid={Boolean(erros.emailOuUsuario)}>
                    <Field.Label fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">
                      E-mail ou Usuário
                    </Field.Label>
                    <HStack position="relative" w="full">
                      <Box
                        position="absolute"
                        left={3.5}
                        zIndex={2}
                        color="whiteAlpha.400"
                        pointerEvents="none"
                        display="inline-flex"
                      >
                        <Mail size={16} />
                      </Box>
                      <Input
                        placeholder="seu@email.com ou usuario"
                        value={form.emailOuUsuario}
                        onChange={(e) => handleChange('emailOuUsuario', e.target.value)}
                        autoComplete="username"
                        autoFocus
                        w="full"
                        pl={10}
                        h={12}
                        borderRadius="xl"
                        bg="whiteAlpha.50"
                        borderColor="whiteAlpha.200"
                        color="white"
                        fontSize="sm"
                        _placeholder={{ color: 'whiteAlpha.400' }}
                        _focus={{
                          borderColor: 'cirqueira.brand.500',
                          bg: 'whiteAlpha.100',
                          boxShadow: '0 0 0 1px var(--chakra-colors-cirqueira-brand-500)',
                        }}
                      />
                    </HStack>
                    <Field.ErrorText fontSize="xs" color="cirqueira.red.500">
                      {erros.emailOuUsuario}
                    </Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={Boolean(erros.senha)}>
                    <Field.Label fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">
                      Senha
                    </Field.Label>
                    <HStack position="relative" w="full">
                      <Box
                        position="absolute"
                        left={3.5}
                        zIndex={2}
                        color="whiteAlpha.400"
                        pointerEvents="none"
                        display="inline-flex"
                      >
                        <Lock size={16} />
                      </Box>
                      <Input
                        type={mostrarSenha ? 'text' : 'password'}
                        placeholder="Sua senha secreta"
                        value={form.senha}
                        onChange={(e) => handleChange('senha', e.target.value)}
                        autoComplete="current-password"
                        w="full"
                        pl={10}
                        pr={10}
                        h={12}
                        borderRadius="xl"
                        bg="whiteAlpha.50"
                        borderColor="whiteAlpha.200"
                        color="white"
                        fontSize="sm"
                        _placeholder={{ color: 'whiteAlpha.400' }}
                        _focus={{
                          borderColor: 'cirqueira.brand.500',
                          bg: 'whiteAlpha.100',
                          boxShadow: '0 0 0 1px var(--chakra-colors-cirqueira-brand-500)',
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setMostrarSenha((v) => !v)}
                        position="absolute"
                        right={2}
                        color="whiteAlpha.400"
                        _hover={{ color: 'white', bg: 'transparent' }}
                        h={8}
                        w={8}
                        p={0}
                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </HStack>
                    <Field.ErrorText fontSize="xs" color="cirqueira.red.500">
                      {erros.senha}
                    </Field.ErrorText>
                  </Field.Root>

                  <Button
                    type="submit"
                    loading={login.isPending}
                    disabled={login.isPending}
                    mt={1}
                    h={12}
                    fontWeight="bold"
                    fontSize="sm"
                    bg="cirqueira.brand.500"
                    _hover={{
                      bg: 'cirqueira.brand.400',
                      shadow: '0 10px 25px -4px rgba(0, 186, 156, 0.45)',
                    }}
                    color="cirqueira.grey.0"
                    w="full"
                    borderRadius="xl"
                    shadow="lg"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={2}
                    transition="all 0.2s"
                  >
                    <Text as="span">Acessar Sistema</Text>
                    <ArrowRight size={16} />
                  </Button>
                </form>

                <HStack
                  justify="center"
                  gap={1.5}
                  fontSize="xs"
                  color="whiteAlpha.400"
                  mt={6}
                  pt={4}
                  borderTopWidth="1px"
                  borderColor="whiteAlpha.100"
                >
                  <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                    <ShieldCheck size={14} color="currentColor" />
                  </Box>
                  <Text as="span">Ambiente protegido e criptografado</Text>
                </HStack>
              </Card.Body>
            </Card.Root>
          </Box>
        </Grid>
      </Container>

      <HStack
        w="full"
        maxW="7xl"
        mx="auto"
        px={{ base: 6, md: 10 }}
        py={4}
        justify="center"
        position="relative"
        zIndex={10}
      >
        <Text fontSize="xs" color="whiteAlpha.400">
          CirqueiraX • Plataforma de Gestão de Mídias
        </Text>
      </HStack>
    </Box>
  )
}
