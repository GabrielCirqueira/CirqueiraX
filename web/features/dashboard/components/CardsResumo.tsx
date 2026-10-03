import { Badge, Box, Card, Grid, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  DownloadCloud,
  HardDrive,
  Layers,
  Loader2,
  Smartphone,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { memo } from 'react'
import type { OrigemMedia, ResumoDashboard } from '../types'

export interface CardsResumoProps {
  resumo?: ResumoDashboard
  carregando?: boolean
}

const ORIGEM_CONFIG: Record<
  OrigemMedia,
  { label: string; icon: typeof Bot; colorPalette: string }
> = {
  print_empresa: {
    label: 'Prints Empresa',
    icon: Building2,
    colorPalette: 'blue',
  },
  print_pessoal: {
    label: 'Prints Pessoal',
    icon: Smartphone,
    colorPalette: 'emerald',
  },
  bot_telegram: {
    label: 'Bot Telegram',
    icon: Bot,
    colorPalette: 'cyan',
  },
  download: {
    label: 'Downloads de Vídeo',
    icon: DownloadCloud,
    colorPalette: 'amber',
  },
  manual: {
    label: 'Upload Manual',
    icon: UploadCloud,
    colorPalette: 'purple',
  },
}

export const CardsResumo = memo(function CardsResumo({
  resumo,
  carregando = false,
}: CardsResumoProps) {
  if (carregando) {
    return (
      <VStack w="full" gap={6} alignItems="stretch">
        <Grid
          w="full"
          templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap={4}
        >
          {['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4'].map((chave) => (
            <Card.Root key={chave} borderWidth="1px" borderColor="border.subtle" bg="bg.panel">
              <Card.Header
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                pb={2}
              >
                <Skeleton h={4} w={28} borderRadius="md" />
                <Skeleton h={8} w={8} borderRadius="full" />
              </Card.Header>
              <Card.Body>
                <Skeleton h={8} w={20} borderRadius="md" mb={2} />
                <Skeleton h={4} w={36} borderRadius="md" />
              </Card.Body>
            </Card.Root>
          ))}
        </Grid>
      </VStack>
    )
  }

  const totalGeral = resumo?.totalGeral ?? 0
  const totalErros = resumo?.totalErros ?? resumo?.porStatus?.erro ?? 0

  const concluidos =
    (resumo?.porStatus?.concluido ?? 0) + (resumo?.porStatus?.distribuido_local ?? 0)

  const emProcessamento =
    (resumo?.porStatus?.baixando ?? 0) +
    (resumo?.porStatus?.recebido ?? 0) +
    (resumo?.porStatus?.em_fila ?? 0) +
    (resumo?.porStatus?.classificado ?? 0) +
    (resumo?.porStatus?.distribuindo ?? 0) +
    (resumo?.porStatus?.enviando_google_fotos ?? 0)

  const taxaConclusao = totalGeral > 0 ? ((concluidos / totalGeral) * 100).toFixed(0) : '100'

  return (
    <VStack w="full" gap={6} alignItems="stretch">
      <Grid
        w="full"
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={4}
      >
        <Card.Root
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.panel"
          shadow="lg"
          transition="all 0.2s"
          _hover={{ borderColor: 'border.muted' }}
        >
          <Card.Header
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            pb={2}
          >
            <Card.Title fontSize="sm" fontWeight="medium" color="fg.subtle">
              Total Ingerido
            </Card.Title>
            <Box p={2} borderRadius="xl" bg="blue.500/10" color="blue.500">
              <Layers size={20} />
            </Box>
          </Card.Header>
          <Card.Body>
            <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="fg">
              {totalGeral}
            </Text>
            <HStack mt={2} fontSize="xs" color="fg.subtle" gap={1.5}>
              <Sparkles size={14} color="#3b82f6" />
              <Text as="span">Espaço: {resumo?.tamanhoTotalFormatado ?? '0 B'}</Text>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Card.Root
          borderWidth="1px"
          borderColor="emerald.500/20"
          bg="emerald.500/5"
          shadow="lg"
          transition="all 0.2s"
          _hover={{ borderColor: 'emerald.500/40' }}
        >
          <Card.Header
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            pb={2}
          >
            <Card.Title fontSize="sm" fontWeight="medium" color="emerald.500">
              Concluídas
            </Card.Title>
            <Box p={2} borderRadius="xl" bg="emerald.500/10" color="emerald.500">
              <CheckCircle2 size={20} />
            </Box>
          </Card.Header>
          <Card.Body>
            <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="emerald.500">
              {concluidos}
            </Text>
            <HStack mt={2} fontSize="xs" color="emerald.500" gap={1.5}>
              <Badge size="sm" variant="subtle" colorPalette="green">
                {taxaConclusao}% sucesso
              </Badge>
              <Text as="span">distribuídas e sincronizadas</Text>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Card.Root
          borderWidth="1px"
          borderColor="cyan.500/20"
          bg="cyan.500/5"
          shadow="lg"
          transition="all 0.2s"
          _hover={{ borderColor: 'cyan.500/40' }}
        >
          <Card.Header
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            pb={2}
          >
            <Card.Title fontSize="sm" fontWeight="medium" color="cyan.500">
              Em Processamento
            </Card.Title>
            <Box p={2} borderRadius="xl" bg="cyan.500/10" color="cyan.500">
              {emProcessamento > 0 ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Clock size={20} />
              )}
            </Box>
          </Card.Header>
          <Card.Body>
            <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="cyan.500">
              {emProcessamento}
            </Text>
            <HStack mt={2} fontSize="xs" color="cyan.500" gap={1.5}>
              <Text as="span">Fila ativa de background</Text>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Card.Root
          borderWidth="1px"
          borderColor={totalErros > 0 ? 'red.500/40' : 'border.subtle'}
          bg={totalErros > 0 ? 'red.500/5' : 'bg.panel'}
          shadow="lg"
          transition="all 0.2s"
          _hover={{ borderColor: totalErros > 0 ? 'red.500/60' : 'border.muted' }}
        >
          <Card.Header
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            pb={2}
          >
            <Card.Title
              fontSize="sm"
              fontWeight="medium"
              color={totalErros > 0 ? 'red.500' : 'fg.subtle'}
            >
              Fila de Erros
            </Card.Title>
            <Box
              p={2}
              borderRadius="xl"
              bg={totalErros > 0 ? 'red.500/20' : 'bg.muted'}
              color={totalErros > 0 ? 'red.500' : 'fg.subtle'}
            >
              {totalErros > 0 ? <AlertTriangle size={20} /> : <AlertCircle size={20} />}
            </Box>
          </Card.Header>
          <Card.Body>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              letterSpacing="tight"
              color={totalErros > 0 ? 'red.500' : 'fg.subtle'}
            >
              {totalErros}
            </Text>
            <HStack mt={2} fontSize="xs" color="fg.subtle" gap={1.5}>
              {totalErros > 0 ? (
                <Text color="red.500" fontWeight="medium">
                  Requer atenção ou retentativa
                </Text>
              ) : (
                <Text as="span">Nenhum erro pendente</Text>
              )}
            </HStack>
          </Card.Body>
        </Card.Root>
      </Grid>

      <VStack w="full" gap={3} alignItems="stretch">
        <HStack justify="space-between" align="center" px={1}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="wider"
            color="fg.subtle"
          >
            Distribuição por Origem de Mídia
          </Text>
          <HStack fontSize="xs" color="fg.subtle" gap={1}>
            <HardDrive size={14} />
            <Text as="span">Espaço total: {resumo?.tamanhoTotalFormatado ?? '0 B'}</Text>
          </HStack>
        </HStack>

        <Grid
          w="full"
          templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }}
          gap={3}
        >
          {(Object.keys(ORIGEM_CONFIG) as OrigemMedia[]).map((origem) => {
            const config = ORIGEM_CONFIG[origem]
            const Icone = config.icon
            const qtd = resumo?.porOrigem?.[origem] ?? 0
            const espaco = resumo?.porOrigemEspaco?.[origem]?.tamanhoFormatado ?? '0 B'

            return (
              <Card.Root
                key={origem}
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.panel"
                transition="all 0.2s"
                _hover={{ borderColor: 'brand.500' }}
              >
                <Card.Body p={3.5}>
                  <HStack justify="space-between" align="flex-start" mb={2}>
                    <Badge
                      colorPalette={config.colorPalette}
                      p={1.5}
                      borderRadius="lg"
                      variant="subtle"
                    >
                      <Icone size={16} />
                    </Badge>
                    <Text fontSize="lg" fontWeight="bold" color="fg">
                      {qtd}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" fontWeight="medium" color="fg" truncate>
                    {config.label}
                  </Text>
                  <Text fontSize="11px" color="fg.subtle" mt={0.5}>
                    {espaco}
                  </Text>
                </Card.Body>
              </Card.Root>
            )
          })}
        </Grid>
      </VStack>
    </VStack>
  )
})
