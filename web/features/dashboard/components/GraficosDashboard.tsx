import { Box, Card, Grid, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { BarChart3, HardDrive, PieChart as PieChartIcon } from 'lucide-react'
import { memo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategoriaMetrica, ResumoDashboard } from '../types'

export interface GraficosDashboardProps {
  resumo?: ResumoDashboard
  categorias?: CategoriaMetrica[]
  carregando?: boolean
}

const CORES_ORIGEM = {
  print_empresa: '#3b82f6',
  print_pessoal: '#10b981',
  bot_telegram: '#06b6d4',
  download: '#f59e0b',
  manual: '#a855f7',
}

const NOMES_ORIGEM = {
  print_empresa: 'Prints Empresa',
  print_pessoal: 'Prints Pessoal',
  bot_telegram: 'Telegram',
  download: 'Downloads',
  manual: 'Upload Manual',
}

interface ItemTooltipCustom {
  name: string
  value: number
  payload?: {
    tamanhoFormatado?: string
    percentual?: string
  }
}

function CustomTooltipPie({
  active,
  payload,
}: { active?: boolean; payload?: ItemTooltipCustom[] }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const data = payload[0]
  if (!data) {
    return null
  }
  return (
    <Box
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      p={3}
      shadow="2xl"
      fontSize="xs"
    >
      <Text fontWeight="semibold" color="fg" mb={1}>
        {data.name}
      </Text>
      <HStack gap={2} color="fg.subtle">
        <Text as="span">Quantidade:</Text>
        <Text as="span" fontWeight="bold" color="fg">
          {data.value} itens
        </Text>
      </HStack>
    </Box>
  )
}

function CustomTooltipBar({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: { tamanhoFormatado: string; totalItens: number } }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const data = payload[0]
  if (!data?.payload) {
    return null
  }
  return (
    <Box
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      p={3}
      shadow="2xl"
      fontSize="xs"
    >
      <Text fontWeight="semibold" color="fg" mb={1}>
        {label}
      </Text>
      <VStack gap={1} color="fg.subtle" alignItems="stretch">
        <HStack justify="space-between" gap={4}>
          <Text as="span">Tamanho:</Text>
          <Text as="span" fontWeight="bold" color="#a855f7">
            {data.payload.tamanhoFormatado}
          </Text>
        </HStack>
        <HStack justify="space-between" gap={4}>
          <Text as="span">Total de itens:</Text>
          <Text as="span" fontWeight="bold" color="fg">
            {data.payload.totalItens}
          </Text>
        </HStack>
      </VStack>
    </Box>
  )
}

export const GraficosDashboard = memo(function GraficosDashboard({
  resumo,
  categorias = [],
  carregando = false,
}: GraficosDashboardProps) {
  if (carregando) {
    return (
      <Grid w="full" templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={4}>
        {['grafico-sk-1', 'grafico-sk-2'].map((chave) => (
          <Card.Root key={chave} borderWidth="1px" borderColor="border.subtle" bg="bg.panel" p={4}>
            <Skeleton h={6} w={48} borderRadius="md" mb={4} />
            <Skeleton h={64} w="full" borderRadius="xl" />
          </Card.Root>
        ))}
      </Grid>
    )
  }

  const dadosOrigem = [
    {
      name: NOMES_ORIGEM.print_empresa,
      value: resumo?.porOrigem?.print_empresa ?? 0,
      color: CORES_ORIGEM.print_empresa,
    },
    {
      name: NOMES_ORIGEM.print_pessoal,
      value: resumo?.porOrigem?.print_pessoal ?? 0,
      color: CORES_ORIGEM.print_pessoal,
    },
    {
      name: NOMES_ORIGEM.bot_telegram,
      value: resumo?.porOrigem?.bot_telegram ?? 0,
      color: CORES_ORIGEM.bot_telegram,
    },
    {
      name: NOMES_ORIGEM.download,
      value: resumo?.porOrigem?.download ?? 0,
      color: CORES_ORIGEM.download,
    },
    {
      name: NOMES_ORIGEM.manual,
      value: resumo?.porOrigem?.manual ?? 0,
      color: CORES_ORIGEM.manual,
    },
  ].filter((item) => item.value > 0)

  const dadosCategorias = categorias.map((cat) => ({
    name: cat.nome,
    tamanhoMb: Number((cat.tamanhoBytes / (1024 * 1024)).toFixed(2)),
    tamanhoFormatado: cat.tamanhoFormatado,
    totalItens: cat.totalItens,
  }))

  const temDadosOrigem = dadosOrigem.length > 0
  const temDadosCategorias = dadosCategorias.length > 0

  return (
    <Grid w="full" templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={4}>
      <Card.Root borderWidth="1px" borderColor="border.subtle" bg="bg.panel" shadow="lg">
        <Card.Header
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          pb={2}
        >
          <HStack gap={2.5}>
            <Box p={2} borderRadius="xl" bg="blue.500/10" color="blue.500">
              <PieChartIcon size={20} />
            </Box>
            <VStack gap={0.5} alignItems="flex-start">
              <Card.Title fontSize="sm" fontWeight="semibold" color="fg">
                Distribuição de Mídias por Origem
              </Card.Title>
              <Text fontSize="xs" color="fg.subtle">
                Proporção de itens por canal de entrada
              </Text>
            </VStack>
          </HStack>
        </Card.Header>

        <Card.Body pt={2}>
          {!temDadosOrigem ? (
            <Box
              h={64}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              color="fg.subtle"
            >
              <PieChartIcon size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <Text fontSize="xs">Nenhuma mídia registrada para exibição gráfica.</Text>
            </Box>
          ) : (
            <Box h={64} w="full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltipPie />} />
                  <Pie
                    data={dadosOrigem}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dadosOrigem.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => (
                      <Text as="span" fontSize="xs" color="fg.subtle" fontWeight="medium">
                        {value}
                      </Text>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Card.Body>
      </Card.Root>

      <Card.Root borderWidth="1px" borderColor="border.subtle" bg="bg.panel" shadow="lg">
        <Card.Header
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          pb={2}
        >
          <HStack gap={2.5}>
            <Box p={2} borderRadius="xl" bg="purple.500/10" color="purple.500">
              <HardDrive size={20} />
            </Box>
            <VStack gap={0.5} alignItems="flex-start">
              <Card.Title fontSize="sm" fontWeight="semibold" color="fg">
                Armazenamento por Categoria (MB)
              </Card.Title>
              <Text fontSize="xs" color="fg.subtle">
                Consumo em disco por diretório classificado
              </Text>
            </VStack>
          </HStack>
        </Card.Header>

        <Card.Body pt={2}>
          {!temDadosCategorias ? (
            <Box
              h={64}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              color="fg.subtle"
            >
              <BarChart3 size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <Text fontSize="xs">Nenhum dado de categoria disponível.</Text>
            </Box>
          ) : (
            <Box h={64} w="full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosCategorias}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} unit=" MB" />
                  <Tooltip content={<CustomTooltipBar />} />
                  <Bar dataKey="tamanhoMb" fill="#a855f7" radius={[6, 6, 0, 0]}>
                    {dadosCategorias.map((cat, index) => (
                      <Cell
                        key={`bar-${cat.name}`}
                        fill={index % 2 === 0 ? '#a855f7' : '#8b5cf6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Card.Body>
      </Card.Root>
    </Grid>
  )
})
