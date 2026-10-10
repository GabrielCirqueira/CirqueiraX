import { Badge, Box, Card, Grid, HStack, Skeleton, Text } from '@chakra-ui/react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { memo } from 'react'
import type { ResumoDashboard } from '../types'

export interface CardsResumoProps {
  resumo?: ResumoDashboard
  carregando?: boolean
}

export const CardsResumo = memo(function CardsResumo({
  resumo,
  carregando = false,
}: CardsResumoProps) {
  if (carregando) {
    return (
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
              <Skeleton h={4} w={24} borderRadius="md" />
              <Skeleton h={8} w={8} borderRadius="lg" />
            </Card.Header>
            <Card.Body>
              <Skeleton h={8} w={16} borderRadius="md" mb={2} />
              <Skeleton h={4} w={28} borderRadius="md" />
            </Card.Body>
          </Card.Root>
        ))}
      </Grid>
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
    <Grid
      w="full"
      templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
      gap={4}
    >
      <Card.Root
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
        shadow="md"
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
          <Card.Title
            fontSize="xs"
            fontWeight="semibold"
            color="fg.subtle"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Total Ingerido
          </Card.Title>
          <Box p={2} borderRadius="lg" bg="blue.500/10" color="blue.500">
            <Layers size={18} />
          </Box>
        </Card.Header>
        <Card.Body>
          <Text fontSize="2xl" fontWeight="black" letterSpacing="tight" color="fg">
            {totalGeral}
          </Text>
          <HStack mt={1.5} fontSize="xs" color="fg.subtle" gap={1.5}>
            <Box as="span" color="cirqueira.blue.500" display="inline-flex">
              <Sparkles size={13} color="currentColor" />
            </Box>
            <Text as="span">{resumo?.tamanhoTotalFormatado ?? '0 B'}</Text>
          </HStack>
        </Card.Body>
      </Card.Root>

      <Card.Root
        borderWidth="1px"
        borderColor="emerald.500/20"
        bg="emerald.500/5"
        shadow="md"
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
          <Card.Title
            fontSize="xs"
            fontWeight="semibold"
            color="emerald.500"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Concluídas
          </Card.Title>
          <Box p={2} borderRadius="lg" bg="emerald.500/10" color="emerald.500">
            <CheckCircle2 size={18} />
          </Box>
        </Card.Header>
        <Card.Body>
          <Text fontSize="2xl" fontWeight="black" letterSpacing="tight" color="emerald.500">
            {concluidos}
          </Text>
          <HStack mt={1.5} fontSize="xs" color="emerald.500" gap={1.5}>
            <Badge size="xs" variant="subtle" colorPalette="green" borderRadius="md" px={1.5}>
              {taxaConclusao}% sucesso
            </Badge>
            <Text as="span">processadas</Text>
          </HStack>
        </Card.Body>
      </Card.Root>

      <Card.Root
        borderWidth="1px"
        borderColor="cyan.500/20"
        bg="cyan.500/5"
        shadow="md"
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
          <Card.Title
            fontSize="xs"
            fontWeight="semibold"
            color="cyan.500"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Em Processamento
          </Card.Title>
          <Box p={2} borderRadius="lg" bg="cyan.500/10" color="cyan.500">
            {emProcessamento > 0 ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Clock size={18} />
            )}
          </Box>
        </Card.Header>
        <Card.Body>
          <Text fontSize="2xl" fontWeight="black" letterSpacing="tight" color="cyan.500">
            {emProcessamento}
          </Text>
          <HStack mt={1.5} fontSize="xs" color="cyan.500" gap={1.5}>
            <Text as="span">{emProcessamento > 0 ? 'Fila ativa em execução' : 'Fila ociosa'}</Text>
          </HStack>
        </Card.Body>
      </Card.Root>

      <Card.Root
        borderWidth="1px"
        borderColor={totalErros > 0 ? 'red.500/40' : 'border.subtle'}
        bg={totalErros > 0 ? 'red.500/5' : 'bg.panel'}
        shadow="md"
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
            fontSize="xs"
            fontWeight="semibold"
            color={totalErros > 0 ? 'red.500' : 'fg.subtle'}
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Fila de Erros
          </Card.Title>
          <Box
            p={2}
            borderRadius="lg"
            bg={totalErros > 0 ? 'red.500/20' : 'bg.muted'}
            color={totalErros > 0 ? 'red.500' : 'fg.subtle'}
          >
            {totalErros > 0 ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
          </Box>
        </Card.Header>
        <Card.Body>
          <Text
            fontSize="2xl"
            fontWeight="black"
            letterSpacing="tight"
            color={totalErros > 0 ? 'red.500' : 'fg.subtle'}
          >
            {totalErros}
          </Text>
          <HStack mt={1.5} fontSize="xs" color="fg.subtle" gap={1.5}>
            {totalErros > 0 ? (
              <Text color="red.500" fontWeight="medium">
                Requer atenção
              </Text>
            ) : (
              <Text as="span">Nenhum erro pendente</Text>
            )}
          </HStack>
        </Card.Body>
      </Card.Root>
    </Grid>
  )
})
