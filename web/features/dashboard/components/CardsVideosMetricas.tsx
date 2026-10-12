import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  HStack,
  Skeleton,
  Text,
} from '@chakra-ui/react'
import {
  ArrowUpRight,
  CalendarClock,
  DownloadCloud,
  HardDrive,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react'
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MetricasVideosDashboard } from '../types'

export interface CardsVideosMetricasProps {
  metricas?: MetricasVideosDashboard
  carregando?: boolean
}

export const CardsVideosMetricas = memo(function CardsVideosMetricas({
  metricas,
  carregando = false,
}: CardsVideosMetricasProps) {
  const navigate = useNavigate()

  if (carregando) {
    return (
      <Card.Root
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
        borderRadius="2xl"
        p={5}
        w="full"
      >
        <HStack justify="space-between" mb={4}>
          <Skeleton h={5} w={64} borderRadius="md" />
          <Skeleton h={6} w={32} borderRadius="xl" />
        </HStack>
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          {['sk-v1', 'sk-v2', 'sk-v3', 'sk-v4'].map((k) => (
            <Skeleton key={k} h="96px" borderRadius="xl" />
          ))}
        </Grid>
      </Card.Root>
    )
  }

  const totalBaixados = metricas?.totalBaixados ?? 0
  const permanecemSistema = metricas?.permanecemSistema ?? 0
  const removidosHoje = metricas?.removidosHoje ?? 0
  const totalRemovidos = metricas?.totalRemovidos ?? 0
  const tamanhoFormatado = metricas?.tamanhoPermanecemFormatado ?? '0 B'
  const espacoLiberadoFormatado = metricas?.espacoLiberadoFormatado ?? '0 B'

  const percPermanecem = totalBaixados > 0 ? Math.round((permanecemSistema / totalBaixados) * 100) : 100
  const percRemovidos = totalBaixados > 0 ? Math.round((totalRemovidos / totalBaixados) * 100) : 0

  return (
    <Card.Root
      position="relative"
      overflow="hidden"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      borderRadius="2xl"
      p={{ base: 4, md: 5 }}
      w="full"
      shadow="sm"
      transition="border-color 0.2s"
      _hover={{ borderColor: 'border.muted' }}
    >
      <Box
        position="absolute"
        top="-60px"
        right="-40px"
        w="160px"
        h="160px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 186, 156, 0.08) 0%, transparent 70%)"
        pointerEvents="none"
      />

      {/* Cabeçalho do Painel */}
      <HStack
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        mb={4}
        gap={3}
        flexWrap="wrap"
      >
        <HStack gap={2.5}>
          <Box
            p={2}
            borderRadius="xl"
            bg="cirqueira.blue.500/12"
            color="cirqueira.blue.400"
            borderWidth="1px"
            borderColor="cirqueira.blue.500/25"
          >
            <Video size={18} />
          </Box>
          <Box>
            <HStack gap={2} align="center">
              <Text fontSize="sm" fontWeight="bold" color="fg">
                Vídeos do Sistema & Retenção de Armazenamento
              </Text>
              <Badge
                variant="subtle"
                colorPalette="teal"
                size="sm"
                borderRadius="md"
                px={2}
                py={0.5}
                fontSize="10px"
                fontWeight="semibold"
                display={{ base: 'none', sm: 'inline-flex' }}
              >
                <ShieldCheck size={11} style={{ marginRight: '4px' }} />
                Pasta do Celular Protegida
              </Badge>
            </HStack>
            <Text fontSize="xs" color="fg.subtle">
              Monitoramento do ciclo de downloads, arquivos físicos em disco e rotina automática de limpeza semanal
            </Text>
          </Box>
        </HStack>

        <HStack gap={2}>
          <Button
            size="xs"
            variant="outline"
            colorPalette="cyan"
            fontWeight="semibold"
            borderRadius="lg"
            px={3}
            py={1.5}
            onClick={() => navigate('/downloads-video')}
            _hover={{ bg: 'cirqueira.cyan.500/10' }}
          >
            <DownloadCloud size={12} style={{ marginRight: '5px' }} />
            Ver Downloads de Vídeo
            <ArrowUpRight size={12} style={{ marginLeft: '4px' }} />
          </Button>
        </HStack>
      </HStack>

      {/* Grid de 4 Cards de Métricas de Vídeos */}
      <Grid
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={3.5}
      >
        {/* Card 1: Total Baixados no Sistema */}
        <Box
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="cirqueira.blue.500/20"
          bg="cirqueira.blue.500/5"
          transition="all 0.2s"
          cursor="pointer"
          _hover={{
            transform: 'translateY(-2px)',
            borderColor: 'cirqueira.blue.500/40',
            bg: 'cirqueira.blue.500/8',
          }}
          onClick={() => navigate('/downloads-video')}
        >
          <HStack justify="space-between" align="center" mb={2}>
            <Text
              fontSize="11px"
              fontWeight="bold"
              color="cirqueira.blue.400"
              textTransform="uppercase"
              letterSpacing="0.06em"
            >
              Total Baixados
            </Text>
            <Box
              p={1.5}
              borderRadius="lg"
              bg="cirqueira.blue.500/15"
              color="cirqueira.blue.400"
            >
              <DownloadCloud size={15} />
            </Box>
          </HStack>

          <HStack align="baseline" gap={2}>
            <Text fontSize="2xl" fontWeight="black" color="fg" lineHeight="1">
              {totalBaixados}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
              {totalBaixados === 1 ? 'vídeo' : 'vídeos'}
            </Text>
          </HStack>

          <Text fontSize="11px" color="fg.muted" mt={2} lineClamp={1}>
            Histórico completo no sistema
          </Text>
        </Box>

        {/* Card 2: Permanecem no Sistema (Físicos na VPS) */}
        <Box
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="cirqueira.brand.500/20"
          bg="cirqueira.brand.500/5"
          transition="all 0.2s"
          cursor="pointer"
          _hover={{
            transform: 'translateY(-2px)',
            borderColor: 'cirqueira.brand.500/40',
            bg: 'cirqueira.brand.500/8',
          }}
          onClick={() => navigate('/downloads-video')}
        >
          <HStack justify="space-between" align="center" mb={2}>
            <Text
              fontSize="11px"
              fontWeight="bold"
              color="cirqueira.brand.400"
              textTransform="uppercase"
              letterSpacing="0.06em"
            >
              Permanecem no Sistema
            </Text>
            <Box
              p={1.5}
              borderRadius="lg"
              bg="cirqueira.brand.500/15"
              color="cirqueira.brand.400"
            >
              <HardDrive size={15} />
            </Box>
          </HStack>

          <HStack align="baseline" gap={2}>
            <Text fontSize="2xl" fontWeight="black" color="cirqueira.brand.300" lineHeight="1">
              {permanecemSistema}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="cirqueira.brand.400">
              ({percPermanecem}%)
            </Text>
          </HStack>

          <HStack mt={2} fontSize="11px" color="fg.muted" gap={1} align="center">
            <Text as="span" fontWeight="medium" color="fg.subtle">
              {tamanhoFormatado} em disco na VPS
            </Text>
          </HStack>
        </Box>

        {/* Card 3: Apagados Hoje (Pela Cron/Rotina) */}
        <Box
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={removidosHoje > 0 ? 'cirqueira.amber.500/35' : 'border.subtle'}
          bg={removidosHoje > 0 ? 'cirqueira.amber.500/8' : 'bg.muted/30'}
          transition="all 0.2s"
        >
          <HStack justify="space-between" align="center" mb={2}>
            <Text
              fontSize="11px"
              fontWeight="bold"
              color={removidosHoje > 0 ? 'cirqueira.amber.400' : 'fg.subtle'}
              textTransform="uppercase"
              letterSpacing="0.06em"
            >
              Apagados Hoje
            </Text>
            <Box
              p={1.5}
              borderRadius="lg"
              bg={removidosHoje > 0 ? 'cirqueira.amber.500/15' : 'bg.muted'}
              color={removidosHoje > 0 ? 'cirqueira.amber.400' : 'fg.subtle'}
            >
              <CalendarClock size={15} />
            </Box>
          </HStack>

          <HStack align="baseline" gap={2}>
            <Text
              fontSize="2xl"
              fontWeight="black"
              color={removidosHoje > 0 ? 'cirqueira.amber.400' : 'fg'}
              lineHeight="1"
            >
              {removidosHoje}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
              {removidosHoje === 1 ? 'vídeo hoje' : 'vídeos hoje'}
            </Text>
          </HStack>

          <Text fontSize="11px" color="fg.muted" mt={2} lineClamp={1}>
            {removidosHoje > 0
              ? 'Espaço liberado pela rotina hoje'
              : 'Nenhum vídeo removido hoje'}
          </Text>
        </Box>

        {/* Card 4: Total Removidos (Espaço Liberado Acumulado) */}
        <Box
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={totalRemovidos > 0 ? 'purple.500/25' : 'border.subtle'}
          bg={totalRemovidos > 0 ? 'purple.500/6' : 'bg.muted/30'}
          transition="all 0.2s"
          cursor={totalRemovidos > 0 ? 'pointer' : 'default'}
          _hover={
            totalRemovidos > 0
              ? {
                  transform: 'translateY(-2px)',
                  borderColor: 'purple.500/40',
                  bg: 'purple.500/10',
                }
              : undefined
          }
          onClick={() => {
            if (totalRemovidos > 0) {
              navigate('/downloads-video')
            }
          }}
        >
          <HStack justify="space-between" align="center" mb={2}>
            <Text
              fontSize="11px"
              fontWeight="bold"
              color={totalRemovidos > 0 ? 'purple.400' : 'fg.subtle'}
              textTransform="uppercase"
              letterSpacing="0.06em"
            >
              Espaço Liberado
            </Text>
            <Box
              p={1.5}
              borderRadius="lg"
              bg={totalRemovidos > 0 ? 'purple.500/15' : 'bg.muted'}
              color={totalRemovidos > 0 ? 'purple.400' : 'fg.subtle'}
            >
              <Sparkles size={15} />
            </Box>
          </HStack>

          <HStack align="baseline" gap={2}>
            <Text
              fontSize="2xl"
              fontWeight="black"
              color={totalRemovidos > 0 ? 'purple.300' : 'fg'}
              lineHeight="1"
            >
              {totalRemovidos}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
              removido(s)
            </Text>
          </HStack>

          <Text fontSize="11px" color="purple.400" mt={2} fontWeight="medium" lineClamp={1}>
            {espacoLiberadoFormatado} liberados na VPS
          </Text>
        </Box>
      </Grid>

      {/* Barra de Proporção Visual de Armazenamento */}
      {totalBaixados > 0 && (
        <Box mt={4} pt={3} borderTopWidth="1px" borderColor="border.subtle">
          <HStack justify="space-between" mb={1.5} fontSize="11px" color="fg.subtle">
            <HStack gap={1.5}>
              <Box w={2} h={2} borderRadius="full" bg="cirqueira.brand.400" />
              <Text as="span" fontWeight="medium" color="fg.muted">
                Permanecem no disco: {permanecemSistema} ({percPermanecem}%)
              </Text>
            </HStack>
            {totalRemovidos > 0 && (
              <HStack gap={1.5}>
                <Box w={2} h={2} borderRadius="full" bg="purple.400" />
                <Text as="span" fontWeight="medium" color="purple.400">
                  Espaço liberado: {totalRemovidos} ({percRemovidos}%)
                </Text>
              </HStack>
            )}
          </HStack>
          <Box w="full" h="4px" borderRadius="full" bg="bg.muted" overflow="hidden" display="flex">
            <Box
              h="full"
              w={`${percPermanecem}%`}
              bg="linear-gradient(90deg, #00ba9c, #45d3b7)"
              transition="width 0.4s ease"
            />
            {totalRemovidos > 0 && (
              <Box
                h="full"
                w={`${percRemovidos}%`}
                bg="linear-gradient(90deg, #a855f7, #c084fc)"
                transition="width 0.4s ease"
              />
            )}
          </Box>
        </Box>
      )}
    </Card.Root>
  )
})
