import { listarCategorias, listarMediaItens } from '@/features/downloads-video/api'
import { Badge, Box, Button, Card, Container, Grid, HStack, Text, VStack } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Cloud,
  DownloadCloud,
  Film,
  FolderCheck,
  Globe,
  LayoutDashboard,
  Monitor,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Video,
  Youtube,
} from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'

export function Component() {
  return <HomeContent />
}

const HomeContent = memo(function HomeContent() {
  const { data: respostaMedia, isLoading: carregandoMedia } = useQuery({
    queryKey: ['media-itens', 'home-stats'],
    queryFn: () => listarMediaItens({ porPagina: 10 }),
  })

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', 'home-stats'],
    queryFn: listarCategorias,
  })

  const totalMedia = respostaMedia?.total ?? 0

  return (
    <VStack w="full" gap={12} py={10}>
      <Box as="section" position="relative" overflow="hidden" w="full">
        <Container maxW="6xl" position="relative" textAlign="center" py={12}>
          <Badge
            variant="subtle"
            colorPalette="purple"
            border="1px solid"
            borderColor="cirqueira.brand.500/30"
            color="cirqueira.brand.400"
            fontWeight="semibold"
            px={3}
            py={1}
            borderRadius="full"
            display="inline-flex"
            alignItems="center"
            mb={4}
          >
            <Sparkles size={14} style={{ marginRight: '6px' }} />
            CirqueiraX Media Pipeline v6.0 • v1.0 Final
          </Badge>

          <VStack gap={3} alignItems="center" maxW="3xl" mx="auto" mb={6}>
            <Text
              as="h1"
              fontSize={{ base: '4xl', sm: '6xl' }}
              fontWeight="900"
              letterSpacing="tight"
              lineHeight="tight"
              color="white"
            >
              Central Inteligente de Ingestão &{' '}
              <Text as="span" color="cirqueira.brand.500">
                Gestão de Mídias
              </Text>
            </Text>
            <Text
              fontSize={{ base: 'sm', sm: 'lg' }}
              color="zinc.400"
              maxW="2xl"
              lineHeight="relaxed"
            >
              Automação completa para download de vídeos de redes sociais, upload manual com triagem
              inteligente por hash e agentes de captura de tela em segundo plano.
            </Text>
          </VStack>

          <HStack gap={4} flexWrap="wrap" justifyContent="center" pt={2}>
            <Link to="/dashboard">
              <Button
                size="lg"
                bg="cirqueira.brand.500"
                _hover={{ bg: 'cirqueira.brand.600' }}
                color="white"
                fontWeight="bold"
                px={6}
                borderRadius="xl"
                shadow="lg"
              >
                <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
                <Text as="span">Acessar Dashboard</Text>
              </Button>
            </Link>

            <Link to="/downloads">
              <Button
                variant="outline"
                size="lg"
                borderColor="zinc.700"
                color="zinc.200"
                fontWeight="bold"
                px={6}
                borderRadius="xl"
                _hover={{ bg: 'zinc.800' }}
              >
                <Box as="span" color="cirqueira.brand.500" display="inline-flex" mr={2}>
                  <DownloadCloud size={20} color="currentColor" />
                </Box>
                <Text as="span">Downloads de Vídeo</Text>
              </Button>
            </Link>

            <Link to="/upload-manual">
              <Button
                variant="outline"
                size="lg"
                borderColor="zinc.700"
                color="zinc.200"
                fontWeight="bold"
                px={6}
                borderRadius="xl"
                _hover={{ bg: 'zinc.800' }}
              >
                <Box as="span" color="cirqueira.indigo.500" display="inline-flex" mr={2}>
                  <UploadCloud size={20} color="currentColor" />
                </Box>
                <Text as="span">Upload Manual & Triagem</Text>
              </Button>
            </Link>
          </HStack>

          <HStack flexWrap="wrap" justifyContent="center" gap={2} pt={4}>
            {['YouTube', 'TikTok', 'Twitter / X', 'Instagram', 'Agentes PC', 'Google Fotos'].map(
              (tag) => (
                <Badge
                  key={tag}
                  variant="subtle"
                  colorPalette="gray"
                  bg="zinc.800"
                  color="zinc.400"
                  border="1px solid"
                  borderColor="zinc.700"
                  fontSize="xs"
                  fontWeight="medium"
                  px={2.5}
                  py={0.5}
                  borderRadius="md"
                >
                  {tag}
                </Badge>
              )
            )}
          </HStack>
        </Container>
      </Box>

      <Container maxW="6xl">
        <VStack gap={1} textAlign={{ base: 'center', sm: 'left' }} mb={6}>
          <Text as="h2" fontSize="2xl" fontWeight="800" color="white">
            Métricas & Status do Sistema
          </Text>
          <Text fontSize="xs" color="zinc.400">
            Resumo em tempo real dos pipelines de ingestão, categorias e agentes conectados.
          </Text>
        </VStack>

        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          <Card.Root
            border="1px solid"
            borderColor="zinc.800"
            bg="zinc.900"
            shadow="sm"
            borderRadius="2xl"
          >
            <Card.Header
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              pb={2}
            >
              <Card.Title
                fontSize="xs"
                fontWeight="bold"
                color="zinc.400"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Mídias Processadas
              </Card.Title>
              <Box p={2} borderRadius="xl" bg="cirqueira.brand.500/10" color="cirqueira.brand.500">
                <Film size={20} />
              </Box>
            </Card.Header>
            <Card.Body>
              <Text fontSize="3xl" fontWeight="900" color="white" mb={1}>
                {carregandoMedia ? '...' : totalMedia}
              </Text>
              <Text fontSize="xs" color="zinc.400">
                Vídeos e imagens registrados no banco de dados
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root
            border="1px solid"
            borderColor="zinc.800"
            bg="zinc.900"
            shadow="sm"
            borderRadius="2xl"
          >
            <Card.Header
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              pb={2}
            >
              <Card.Title
                fontSize="xs"
                fontWeight="bold"
                color="zinc.400"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Categorias Ativas
              </Card.Title>
              <Box p={2} borderRadius="xl" bg="indigo.500/10" color="indigo.500">
                <FolderCheck size={20} />
              </Box>
            </Card.Header>
            <Card.Body>
              <Text fontSize="3xl" fontWeight="900" color="white" mb={1}>
                {categorias.length}
              </Text>
              <Text fontSize="xs" color="zinc.400">
                Categorias para organização e triagem automática
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root
            border="1px solid"
            borderColor="zinc.800"
            bg="zinc.900"
            shadow="sm"
            borderRadius="2xl"
          >
            <Card.Header
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              pb={2}
            >
              <Card.Title
                fontSize="xs"
                fontWeight="bold"
                color="zinc.400"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Agentes de Print
              </Card.Title>
              <Box p={2} borderRadius="xl" bg="emerald.500/10" color="emerald.500">
                <Monitor size={20} />
              </Box>
            </Card.Header>
            <Card.Body>
              <HStack gap={2} alignItems="center" mb={1}>
                <Badge
                  colorPalette="green"
                  variant="subtle"
                  bg="emerald.500/10"
                  color="emerald-400"
                  border="1px solid"
                  borderColor="emerald.500/20"
                  fontWeight="bold"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                >
                  2 Conectados
                </Badge>
              </HStack>
              <Text fontSize="xs" color="zinc.400">
                Agente PC Empresa e Agente PC Pessoal ativos via X-Agent-Token
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root
            border="1px solid"
            borderColor="zinc.800"
            bg="zinc.900"
            shadow="sm"
            borderRadius="2xl"
          >
            <Card.Header
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              pb={2}
            >
              <Card.Title
                fontSize="xs"
                fontWeight="bold"
                color="zinc.400"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Google Fotos Pipeline
              </Card.Title>
              <Box p={2} borderRadius="xl" bg="amber.500/10" color="amber.500">
                <Cloud size={20} />
              </Box>
            </Card.Header>
            <Card.Body>
              <HStack gap={2} alignItems="center" mb={1}>
                <Badge
                  colorPalette="amber"
                  variant="subtle"
                  bg="amber.500/10"
                  color="amber.400"
                  border="1px solid"
                  borderColor="amber.500/20"
                  fontWeight="bold"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                >
                  OAuth2 Pronto
                </Badge>
              </HStack>
              <Text fontSize="xs" color="zinc.400">
                Sincronização com renovação automática de tokens
              </Text>
            </Card.Body>
          </Card.Root>
        </Grid>
      </Container>

      <Container maxW="6xl">
        <VStack gap={1} textAlign={{ base: 'center', sm: 'left' }} mb={6}>
          <Text as="h2" fontSize="2xl" fontWeight="800" color="white">
            Recursos Principais do CirqueiraX
          </Text>
          <Text fontSize="xs" color="zinc.400">
            Conheça as ferramentas e pipelines integrados ao ecossistema.
          </Text>
        </VStack>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
          <Card.Root
            border="1px solid"
            borderColor="zinc.800"
            bg="zinc.900"
            shadow="sm"
            borderRadius="2xl"
            _hover={{ borderColor: 'cirqueira.brand.500/40' }}
          >
            <Card.Header>
              <Box
                w={10}
                h={10}
                borderRadius="2xl"
                bg="cirqueira.brand.500/10"
                color="cirqueira.brand.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={2}
              >
                <Video size={20} />
              </Box>
              <Card.Title fontSize="lg" fontWeight="bold" color="white">
                Downloads de Redes Sociais
              </Card.Title>
            </Card.Header>
            <Card.Body display="flex" flexDirection="column" gap={4}>
              <Text fontSize="xs" color="zinc.400" lineHeight="relaxed">
                Suporte completo a URLs do YouTube, TikTok, X (Twitter) e Instagram com extração
                automática de metadados (título, uploader, duração e thumbnail).
              </Text>

              <HStack gap={2} flexWrap="wrap">
                <Badge colorPalette="red" variant="subtle" px={2} py={0.5} borderRadius="md">
                  <Youtube size={12} style={{ marginRight: '4px', display: 'inline' }} /> YouTube
                </Badge>
                <Badge colorPalette="cyan" variant="subtle" px={2} py={0.5} borderRadius="md">
                  <Video size={12} style={{ marginRight: '4px', display: 'inline' }} /> TikTok
                </Badge>
                <Badge colorPalette="blue" variant="subtle" px={2} py={0.5} borderRadius="md">
                  <Globe size={12} style={{ marginRight: '4px', display: 'inline' }} /> Twitter / X
                </Badge>
              </HStack>

              <Box w="full" pt={2}>
                <Link to="/downloads" style={{ width: '100%' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    w="full"
                    justifyContent="space-between"
                    color="cirqueira.brand.500"
                    _hover={{ color: 'cirqueira.brand.400', bg: 'cirqueira.brand.500/10' }}
                    fontWeight="bold"
                  >
                    <Text as="span">Acessar Downloads</Text>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </Box>
            </Card.Body>
          </Card.Root>

          <Card.Root
            border="1px solid"
            borderColor="zinc.800"
            bg="zinc.900"
            shadow="sm"
            borderRadius="2xl"
            _hover={{ borderColor: 'cirqueira.brand.500/40' }}
          >
            <Card.Header>
              <Box
                w={10}
                h={10}
                borderRadius="2xl"
                bg="cirqueira.indigo.500/10"
                color="cirqueira.indigo.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={2}
              >
                <UploadCloud size={20} />
              </Box>
              <Card.Title fontSize="lg" fontWeight="bold" color="white">
                Upload Manual & Triagem
              </Card.Title>
            </Card.Header>
            <Card.Body display="flex" flexDirection="column" gap={4}>
              <Text fontSize="xs" color="zinc.400" lineHeight="relaxed">
                Área de drag-and-drop interativa para fotos e vídeos com verificação imediata de
                hash contra arquivos duplicados e atribuição rápida de categorias em lote.
              </Text>

              <HStack gap={2} flexWrap="wrap">
                <Badge colorPalette="purple" variant="subtle" px={2} py={0.5} borderRadius="md">
                  Drag & Drop
                </Badge>
                <Badge colorPalette="green" variant="subtle" px={2} py={0.5} borderRadius="md">
                  Checagem de Hash
                </Badge>
                <Badge colorPalette="amber" variant="subtle" px={2} py={0.5} borderRadius="md">
                  Ações em Lote
                </Badge>
              </HStack>

              <Box w="full" pt={2}>
                <Link to="/upload-manual" style={{ width: '100%' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    w="full"
                    justifyContent="space-between"
                    color="cirqueira.indigo.400"
                    _hover={{ color: 'cirqueira.indigo.300', bg: 'cirqueira.indigo.500/10' }}
                    fontWeight="bold"
                  >
                    <Text as="span">Acessar Upload Manual</Text>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </Box>
            </Card.Body>
          </Card.Root>

          <Card.Root
            border="1px solid"
            borderColor="zinc.800"
            bg="zinc.900"
            shadow="sm"
            borderRadius="2xl"
            _hover={{ borderColor: 'cirqueira.brand.500/40' }}
          >
            <Card.Header>
              <Box
                w={10}
                h={10}
                borderRadius="2xl"
                bg="cirqueira.green.500/10"
                color="cirqueira.green.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={2}
              >
                <ShieldCheck size={20} />
              </Box>
              <Card.Title fontSize="lg" fontWeight="bold" color="white">
                Agentes de Ingestão Automática
              </Card.Title>
            </Card.Header>
            <Card.Body display="flex" flexDirection="column" gap={4}>
              <Text fontSize="xs" color="zinc.400" lineHeight="relaxed">
                Agentes autônomos para PC Empresa e PC Pessoal com monitoramento de pastas em tempo
                real, debounce, cliente HTTP com retry e salvamento seguro.
              </Text>

              <HStack gap={2} flexWrap="wrap">
                <Badge colorPalette="green" variant="subtle" px={2} py={0.5} borderRadius="md">
                  print_empresa
                </Badge>
                <Badge colorPalette="teal" variant="subtle" px={2} py={0.5} borderRadius="md">
                  print_pessoal
                </Badge>
                <Badge colorPalette="blue" variant="subtle" px={2} py={0.5} borderRadius="md">
                  X-Agent-Token
                </Badge>
              </HStack>

              <Box w="full" pt={2}>
                <Link to="/downloads" style={{ width: '100%' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    w="full"
                    justifyContent="space-between"
                    color="cirqueira.green.400"
                    _hover={{ color: 'cirqueira.green.300', bg: 'cirqueira.green.500/10' }}
                    fontWeight="bold"
                  >
                    <Text as="span">Ver Mídias dos Agentes</Text>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </Box>
            </Card.Body>
          </Card.Root>
        </Grid>
      </Container>
    </VStack>
  )
})
