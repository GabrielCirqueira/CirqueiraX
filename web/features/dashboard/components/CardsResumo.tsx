import { Box, Card, Grid, HStack, Progress, Skeleton, Text, VStack } from '@chakra-ui/react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  HardDrive,
  Layers,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { memo } from 'react'
import type { ResumoDashboard } from '../types'

export interface CardsResumoProps {
  resumo?: ResumoDashboard
  carregando?: boolean
  onSelecionarAba?: (aba: string) => void
}

export const CardsResumo = memo(function CardsResumo({
  resumo,
  carregando = false,
  onSelecionarAba,
}: CardsResumoProps) {
  if (carregando) {
    return (
      <Grid
        w="full"
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={4}
      >
        {['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4'].map((chave) => (
          <Card.Root
            key={chave}
            borderWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
            borderRadius="2xl"
            p={5}
          >
            <HStack justify="space-between" mb={4}>
              <Skeleton h={3} w={24} borderRadius="md" />
              <Skeleton h={9} w={9} borderRadius="xl" />
            </HStack>
            <Skeleton h={8} w={20} borderRadius="md" mb={2} />
            <Skeleton h={4} w={32} borderRadius="md" />
          </Card.Root>
        ))}
      </Grid>
    )
  }

  const totalGeral = resumo?.totalGeral ?? 0
  const statusMap = resumo?.porStatus ?? resumo?.status ?? {}

  const concluidos =
    (statusMap.concluido ?? 0) + (statusMap.distribuido_local ?? 0)

  const emProcessamento =
    (statusMap.baixando ?? 0) +
    (statusMap.recebido ?? 0) +
    (statusMap.em_fila ?? 0) +
    (statusMap.classificado ?? 0) +
    (statusMap.distribuindo ?? 0) +
    (statusMap.enviando_google_fotos ?? 0)

  const pendentesClassificacao = statusMap.sem_categoria ?? 0
  const totalErros = resumo?.totalErros ?? statusMap.erro ?? 0

  const taxaConclusaoNum = totalGeral > 0 ? Math.round((concluidos / totalGeral) * 100) : 100
  const taxaConclusao = taxaConclusaoNum.toString()

  return (
    <Grid
      w="full"
      templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
      gap={4}
    >
      {/* 1. TOTAL INGERIDO */}
      <Card.Root
        position="relative"
        overflow="hidden"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
        borderRadius="2xl"
        p={5}
        transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        cursor="pointer"
        _hover={{
          transform: 'translateY(-2px)',
          borderColor: 'cirqueira.blue.500/50',
          shadow: '0 12px 28px -8px rgba(0, 138, 202, 0.15)',
        }}
        onClick={() => onSelecionarAba?.('visao-geral')}
      >
        {/* Glow ambient background */}
        <Box
          position="absolute"
          top="-40px"
          right="-40px"
          w="110px"
          h="110px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(0, 170, 249, 0.15) 0%, transparent 70%)"
          pointerEvents="none"
        />

        <VStack align="stretch" gap={3}>
          <HStack justify="space-between" align="center">
            <HStack gap={1.5}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="fg.subtle"
                textTransform="uppercase"
                letterSpacing="0.08em"
              >
                Total Ingerido
              </Text>
            </HStack>
            <Box
              p={2.5}
              borderRadius="xl"
              bg="cirqueira.blue.500/12"
              color="cirqueira.blue.400"
              borderWidth="1px"
              borderColor="cirqueira.blue.500/20"
            >
              <Layers size={18} />
            </Box>
          </HStack>

          <Box>
            <HStack align="baseline" gap={2}>
              <Text fontSize="3xl" fontWeight="black" letterSpacing="tight" color="fg" lineHeight="1">
                {totalGeral}
              </Text>
              <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
                mídias
              </Text>
            </HStack>

            <HStack mt={2.5} fontSize="xs" color="fg.subtle" gap={1.5} align="center">
              <Box as="span" color="cirqueira.blue.400" display="inline-flex">
                <HardDrive size={13} />
              </Box>
              <Text as="span" fontWeight="medium" color="fg.muted">
                {resumo?.tamanhoTotalFormatado ?? '0 B'} em disco
              </Text>
            </HStack>
          </Box>
        </VStack>
      </Card.Root>

      {/* 2. CONCLUÍDAS */}
      <Card.Root
        position="relative"
        overflow="hidden"
        borderWidth="1px"
        borderColor="cirqueira.brand.500/25"
        bg="bg.panel"
        borderRadius="2xl"
        p={5}
        transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        cursor="pointer"
        _hover={{
          transform: 'translateY(-2px)',
          borderColor: 'cirqueira.brand.400/60',
          shadow: '0 12px 28px -8px rgba(0, 186, 156, 0.2)',
        }}
        onClick={() => onSelecionarAba?.('visao-geral')}
      >
        <Box
          position="absolute"
          top="-40px"
          right="-40px"
          w="110px"
          h="110px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(0, 186, 156, 0.18) 0%, transparent 70%)"
          pointerEvents="none"
        />

        <VStack align="stretch" gap={3}>
          <HStack justify="space-between" align="center">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="cirqueira.brand.400"
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Concluídas
            </Text>
            <Box
              p={2.5}
              borderRadius="xl"
              bg="cirqueira.brand.500/15"
              color="cirqueira.brand.400"
              borderWidth="1px"
              borderColor="cirqueira.brand.500/25"
            >
              <CheckCircle2 size={18} />
            </Box>
          </HStack>

          <Box>
            <HStack align="baseline" gap={2}>
              <Text
                fontSize="3xl"
                fontWeight="black"
                letterSpacing="tight"
                color="cirqueira.brand.300"
                lineHeight="1"
              >
                {concluidos}
              </Text>
              <Text fontSize="xs" fontWeight="bold" color="cirqueira.brand.400">
                ({taxaConclusao}%)
              </Text>
            </HStack>

            {/* Visual mini progress bar */}
            <Box mt={2.5} w="full">
              <Box
                w="full"
                h="5px"
                borderRadius="full"
                bg="cirqueira.grey.800"
                overflow="hidden"
              >
                <Box
                  h="full"
                  w={`${Math.min(taxaConclusaoNum, 100)}%`}
                  borderRadius="full"
                  bg="linear-gradient(90deg, #00ba9c, #45d3b7)"
                  transition="width 0.6s ease-out"
                />
              </Box>
              <HStack justify="space-between" mt={1.5} fontSize="11px" color="fg.subtle">
                <Text as="span">Taxa de sucesso</Text>
                <Text as="span" fontWeight="semibold" color="cirqueira.brand.400">
                  {concluidos}/{totalGeral}
                </Text>
              </HStack>
            </Box>
          </Box>
        </VStack>
      </Card.Root>

      {/* 3. EM PROCESSAMENTO / FILA */}
      <Card.Root
        position="relative"
        overflow="hidden"
        borderWidth="1px"
        borderColor={emProcessamento > 0 ? 'cirqueira.cyan.500/40' : 'border.subtle'}
        bg="bg.panel"
        borderRadius="2xl"
        p={5}
        transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        cursor="pointer"
        _hover={{
          transform: 'translateY(-2px)',
          borderColor: 'cirqueira.cyan.500/60',
          shadow: '0 12px 28px -8px rgba(0, 170, 249, 0.15)',
        }}
        onClick={() => onSelecionarAba?.('categorias')}
      >
        <Box
          position="absolute"
          top="-40px"
          right="-40px"
          w="110px"
          h="110px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)"
          pointerEvents="none"
        />

        <VStack align="stretch" gap={3}>
          <HStack justify="space-between" align="center">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={emProcessamento > 0 ? 'cirqueira.cyan.400' : 'fg.subtle'}
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Em Fila & Pendentes
            </Text>
            <Box
              p={2.5}
              borderRadius="xl"
              bg={emProcessamento > 0 ? 'cirqueira.cyan.500/15' : 'cirqueira.grey.800/50'}
              color={emProcessamento > 0 ? 'cirqueira.cyan.400' : 'fg.subtle'}
              borderWidth="1px"
              borderColor={emProcessamento > 0 ? 'cirqueira.cyan.500/30' : 'border.subtle'}
            >
              {emProcessamento > 0 ? (
                <Loader2 size={18} style={{ animation: 'spin 1.2s linear infinite' }} />
              ) : (
                <Clock size={18} />
              )}
            </Box>
          </HStack>

          <Box>
            <HStack align="baseline" gap={2}>
              <Text
                fontSize="3xl"
                fontWeight="black"
                letterSpacing="tight"
                color={emProcessamento > 0 ? 'cirqueira.cyan.400' : 'fg'}
                lineHeight="1"
              >
                {emProcessamento + pendentesClassificacao}
              </Text>
              <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
                itens
              </Text>
            </HStack>

            <HStack mt={2.5} fontSize="xs" color="fg.subtle" gap={2} align="center" flexWrap="wrap">
              {emProcessamento > 0 && (
                <Box
                  as="span"
                  px={1.5}
                  py={0.5}
                  borderRadius="md"
                  bg="cirqueira.cyan.500/15"
                  color="cirqueira.cyan.400"
                  fontSize="10px"
                  fontWeight="bold"
                >
                  {emProcessamento} em execução
                </Box>
              )}
              {pendentesClassificacao > 0 && (
                <Box
                  as="span"
                  px={1.5}
                  py={0.5}
                  borderRadius="md"
                  bg="cirqueira.amber.500/15"
                  color="cirqueira.amber.400"
                  fontSize="10px"
                  fontWeight="bold"
                >
                  {pendentesClassificacao} sem categoria
                </Box>
              )}
              {emProcessamento === 0 && pendentesClassificacao === 0 && (
                <HStack gap={1} color="cirqueira.brand.400" fontSize="xs">
                  <ShieldCheck size={13} />
                  <Text as="span">Fila ociosa (tudo processado)</Text>
                </HStack>
              )}
            </HStack>
          </Box>
        </VStack>
      </Card.Root>

      {/* 4. FILA DE ERROS */}
      <Card.Root
        position="relative"
        overflow="hidden"
        borderWidth="1px"
        borderColor={totalErros > 0 ? 'cirqueira.red.500/40' : 'border.subtle'}
        bg={totalErros > 0 ? 'cirqueira.red.500/6' : 'bg.panel'}
        borderRadius="2xl"
        p={5}
        transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        cursor="pointer"
        _hover={{
          transform: 'translateY(-2px)',
          borderColor: totalErros > 0 ? 'cirqueira.red.500/70' : 'border.muted',
          shadow: totalErros > 0
            ? '0 12px 28px -8px rgba(218, 71, 55, 0.25)'
            : '0 12px 28px -8px rgba(0, 0, 0, 0.2)',
        }}
        onClick={() => onSelecionarAba?.('erros')}
      >
        {totalErros > 0 && (
          <Box
            position="absolute"
            top="-40px"
            right="-40px"
            w="110px"
            h="110px"
            borderRadius="full"
            bg="radial-gradient(circle, rgba(218, 71, 55, 0.2) 0%, transparent 70%)"
            pointerEvents="none"
          />
        )}

        <VStack align="stretch" gap={3}>
          <HStack justify="space-between" align="center">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={totalErros > 0 ? 'cirqueira.red.400' : 'fg.subtle'}
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Fila de Erros
            </Text>
            <Box
              p={2.5}
              borderRadius="xl"
              bg={totalErros > 0 ? 'cirqueira.red.500/20' : 'cirqueira.grey.800/50'}
              color={totalErros > 0 ? 'cirqueira.red.400' : 'fg.subtle'}
              borderWidth="1px"
              borderColor={totalErros > 0 ? 'cirqueira.red.500/30' : 'border.subtle'}
            >
              {totalErros > 0 ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
            </Box>
          </HStack>

          <Box>
            <HStack align="baseline" gap={2}>
              <Text
                fontSize="3xl"
                fontWeight="black"
                letterSpacing="tight"
                color={totalErros > 0 ? 'cirqueira.red.400' : 'fg'}
                lineHeight="1"
              >
                {totalErros}
              </Text>
              <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
                {totalErros === 1 ? 'falha' : 'falhas'}
              </Text>
            </HStack>

            <HStack mt={2.5} fontSize="xs" gap={1.5} align="center">
              {totalErros > 0 ? (
                <HStack gap={1} color="cirqueira.red.400" fontWeight="semibold">
                  <Text as="span">Requer atenção</Text>
                  <ArrowUpRight size={13} />
                </HStack>
              ) : (
                <HStack gap={1} color="cirqueira.brand.400" fontSize="xs">
                  <ShieldCheck size={13} />
                  <Text as="span">Zero falhas pendentes</Text>
                </HStack>
              )}
            </HStack>
          </Box>
        </VStack>
      </Card.Root>
    </Grid>
  )
})
