import { Badge, Box, Card, Grid, HStack, Progress, Skeleton, Text, VStack } from '@chakra-ui/react'
import {
  BarChart3,
  Bot,
  Building2,
  DownloadCloud,
  FolderTree,
  HardDrive,
  PieChart as PieChartIcon,
  Smartphone,
  UploadCloud,
} from 'lucide-react'
import { memo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategoriaMetrica, OrigemMedia, ResumoDashboard } from '../types'

export interface GraficosDashboardProps {
  resumo?: ResumoDashboard
  categorias?: CategoriaMetrica[]
  carregando?: boolean
}

const ORIGEM_CONFIG: Record<
  OrigemMedia,
  { label: string; color: string; icon: typeof Smartphone }
> = {
  print_empresa: {
    label: 'Prints Empresa',
    color: '#00aaf9',
    icon: Building2,
  },
  print_pessoal: {
    label: 'Prints Celular',
    color: '#00ba9c',
    icon: Smartphone,
  },
  download: {
    label: 'Downloads de Vídeo',
    color: '#f59e0b',
    icon: DownloadCloud,
  },
  bot_telegram: {
    label: 'Telegram Bot',
    color: '#06b6d4',
    icon: Bot,
  },
  manual: {
    label: 'Upload Manual',
    color: '#a855f7',
    icon: UploadCloud,
  },
}

interface ItemTooltipCustom {
  name: string
  value: number
  payload?: {
    percentual?: string
    color?: string
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
  const color = data.payload?.color ?? '#00ba9c'

  return (
    <Box
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="rgba(25, 27, 26, 0.95)"
      backdropFilter="blur(12px)"
      p={3}
      shadow="2xl"
      fontSize="xs"
      minW="160px"
    >
      <HStack gap={2} mb={1.5} align="center">
        <Box w={2.5} h={2.5} borderRadius="full" bg={color} />
        <Text fontWeight="bold" color="fg">
          {data.name}
        </Text>
      </HStack>
      <HStack justify="space-between" color="fg.subtle">
        <Text as="span">Volume:</Text>
        <Text as="span" fontWeight="bold" color="fg">
          {data.value} {data.value === 1 ? 'mídia' : 'mídias'}
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
  payload?: Array<{ value: number; payload: { tamanhoFormatado: string; totalItens: number; name: string } }>
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
      bg="rgba(25, 27, 26, 0.95)"
      backdropFilter="blur(12px)"
      p={3.5}
      shadow="2xl"
      fontSize="xs"
      minW="180px"
    >
      <HStack gap={2} mb={2} align="center">
        <FolderTree size={14} color="#00ba9c" />
        <Text fontWeight="bold" color="fg">
          {label}
        </Text>
      </HStack>
      <VStack gap={1.5} color="fg.subtle" alignItems="stretch">
        <HStack justify="space-between" gap={4}>
          <Text as="span">Espaço Ocupado:</Text>
          <Text as="span" fontWeight="bold" color="cirqueira.brand.400">
            {data.payload.tamanhoFormatado}
          </Text>
        </HStack>
        <HStack justify="space-between" gap={4}>
          <Text as="span">Total de Arquivos:</Text>
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
      <Grid w="full" templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={5}>
        {['grafico-sk-1', 'grafico-sk-2'].map((chave) => (
          <Card.Root
            key={chave}
            borderWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
            borderRadius="2xl"
            p={5}
          >
            <Skeleton h={6} w={48} borderRadius="md" mb={4} />
            <Skeleton h={64} w="full" borderRadius="xl" />
          </Card.Root>
        ))}
      </Grid>
    )
  }

  const mapaOrigem = resumo?.porOrigem ?? resumo?.origem ?? {}
  const totalMídiasGeral = resumo?.totalGeral ?? 0

  const dadosOrigem = (Object.keys(ORIGEM_CONFIG) as OrigemMedia[])
    .map((chave) => {
      const config = ORIGEM_CONFIG[chave]
      const count = mapaOrigem[chave] ?? 0
      const percentual = totalMídiasGeral > 0 ? Math.round((count / totalMídiasGeral) * 100) : 0
      return {
        key: chave,
        name: config.label,
        value: count,
        color: config.color,
        icon: config.icon,
        percentual,
      }
    })
    .filter((item) => item.value > 0)

  const dadosCategorias = categorias.map((cat) => ({
    name: cat.nome,
    tamanhoMb: Number((cat.tamanhoBytes / (1024 * 1024)).toFixed(2)),
    tamanhoFormatado: cat.tamanhoFormatado,
    totalItens: cat.totalItens,
    tamanhoBytes: cat.tamanhoBytes,
  }))

  const temDadosOrigem = dadosOrigem.length > 0
  const temDadosCategorias = dadosCategorias.length > 0

  const espacoTotalBytes = categorias.reduce((acc, c) => acc + c.tamanhoBytes, 0)

  return (
    <VStack gap={5} w="full" align="stretch">
      <Grid w="full" templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={5}>
        {/* GRÁFICO 1: DISTRIBUIÇÃO POR ORIGEM (DONUT) */}
        <Card.Root
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.panel"
          borderRadius="2xl"
          shadow="lg"
          p={5}
        >
          <HStack justify="space-between" align="flex-start" mb={4}>
            <HStack gap={3}>
              <Box
                p={2.5}
                borderRadius="xl"
                bg="cirqueira.blue.500/12"
                color="cirqueira.blue.400"
                borderWidth="1px"
                borderColor="cirqueira.blue.500/20"
              >
                <PieChartIcon size={20} />
              </Box>
              <VStack gap={0.5} align="flex-start">
                <Text fontSize="sm" fontWeight="bold" color="fg">
                  Distribuição por Origem
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  Proporção de ingestão por canal de entrada
                </Text>
              </VStack>
            </HStack>

            {temDadosOrigem && (
              <Badge
                variant="subtle"
                colorPalette="blue"
                size="sm"
                borderRadius="md"
                px={2}
                py={0.5}
              >
                {dadosOrigem.length} {dadosOrigem.length === 1 ? 'canal ativo' : 'canais ativos'}
              </Badge>
            )}
          </HStack>

          {!temDadosOrigem ? (
            <Box
              h={64}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              color="fg.subtle"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="border.subtle"
              borderRadius="xl"
              p={6}
            >
              <PieChartIcon size={36} style={{ opacity: 0.35, marginBottom: '10px' }} />
              <Text fontSize="sm" fontWeight="medium" color="fg">
                Nenhuma mídia registrada ainda
              </Text>
              <Text fontSize="xs" color="fg.subtle" mt={1}>
                Inicie um download ou sincronize pelo Syncthing para ver as métricas.
              </Text>
            </Box>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: '1.1fr 0.9fr' }} gap={4} alignItems="center">
              <Box h={64} w="full" position="relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltipPie />} />
                    <Pie
                      data={dadosOrigem}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dadosOrigem.map((entry) => (
                        <Cell
                          key={`cell-${entry.key}`}
                          fill={entry.color}
                          stroke="#191b1a"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Centro do Donut com Total */}
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  textAlign="center"
                  pointerEvents="none"
                >
                  <Text fontSize="2xl" fontWeight="black" color="fg" lineHeight="1">
                    {totalMídiasGeral}
                  </Text>
                  <Text fontSize="10px" fontWeight="semibold" color="fg.subtle" textTransform="uppercase">
                    Total
                  </Text>
                </Box>
              </Box>

              {/* Legenda Customizada com contagens e % */}
              <VStack gap={2.5} align="stretch" pr={2}>
                {dadosOrigem.map((item) => {
                  const Icone = item.icon
                  return (
                    <HStack
                      key={item.key}
                      justify="space-between"
                      p={2}
                      borderRadius="lg"
                      bg="rgba(255, 255, 255, 0.02)"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      transition="all 0.15s"
                      _hover={{ bg: 'rgba(255, 255, 255, 0.04)' }}
                    >
                      <HStack gap={2}>
                        <Box
                          p={1.5}
                          borderRadius="md"
                          bg={`${item.color}20`}
                          color={item.color}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icone size={14} />
                        </Box>
                        <Text fontSize="xs" fontWeight="medium" color="fg">
                          {item.name}
                        </Text>
                      </HStack>

                      <HStack gap={2}>
                        <Text fontSize="xs" fontWeight="bold" color="fg">
                          {item.value}
                        </Text>
                        <Badge
                          size="xs"
                          variant="subtle"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                          borderRadius="md"
                          px={1.5}
                        >
                          {item.percentual}%
                        </Badge>
                      </HStack>
                    </HStack>
                  )
                })}
              </VStack>
            </Grid>
          )}
        </Card.Root>

        {/* GRÁFICO 2: ARMAZENAMENTO POR CATEGORIA (BAR CHART FIXADO) */}
        <Card.Root
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.panel"
          borderRadius="2xl"
          shadow="lg"
          p={5}
        >
          <HStack justify="space-between" align="flex-start" mb={4}>
            <HStack gap={3}>
              <Box
                p={2.5}
                borderRadius="xl"
                bg="cirqueira.brand.500/12"
                color="cirqueira.brand.400"
                borderWidth="1px"
                borderColor="cirqueira.brand.500/20"
              >
                <HardDrive size={20} />
              </Box>
              <VStack gap={0.5} align="flex-start">
                <Text fontSize="sm" fontWeight="bold" color="fg">
                  Armazenamento por Categoria
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  Espaço consumido em disco por diretório classificado
                </Text>
              </VStack>
            </HStack>

            {temDadosCategorias && (
              <Badge
                variant="subtle"
                colorPalette="teal"
                size="sm"
                borderRadius="md"
                px={2}
                py={0.5}
              >
                {categorias.length} {categorias.length === 1 ? 'pasta' : 'pastas'}
              </Badge>
            )}
          </HStack>

          {!temDadosCategorias ? (
            <Box
              h={64}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              color="fg.subtle"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="border.subtle"
              borderRadius="xl"
              p={6}
            >
              <BarChart3 size={36} style={{ opacity: 0.35, marginBottom: '10px' }} />
              <Text fontSize="sm" fontWeight="medium" color="fg">
                Nenhum dado de categoria disponível
              </Text>
              <Text fontSize="xs" color="fg.subtle" mt={1}>
                Crie categorias ou sincronize pastas locais para ver o uso de disco.
              </Text>
            </Box>
          ) : (
            <Box h={64} w="full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosCategorias}
                  margin={{ top: 15, right: 15, left: 10, bottom: 40 }}
                >
                  <defs>
                    <linearGradient id="corBarraTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#45d3b7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#00977d" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="corBarraAccent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00aaf9" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0071a6" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255, 255, 255, 0.65)', fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    width={55}
                    tick={{ fill: 'rgba(255, 255, 255, 0.65)', fontSize: 11 }}
                    tickFormatter={(val) => `${val} MB`}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <Tooltip content={<CustomTooltipBar />} />
                  <Bar
                    dataKey="tamanhoMb"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                  >
                    {dadosCategorias.map((cat, index) => (
                      <Cell
                        key={`bar-${cat.name}`}
                        fill={index % 2 === 0 ? 'url(#corBarraTeal)' : 'url(#corBarraAccent)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Card.Root>
      </Grid>

      {/* DETALHAMENTO DE USO DE DISCO POR CATEGORIA */}
      {temDadosCategorias && (
        <Card.Root
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.panel"
          borderRadius="2xl"
          p={5}
        >
          <HStack justify="space-between" align="center" mb={4}>
            <HStack gap={2.5}>
              <FolderTree size={18} color="#00ba9c" />
              <Text fontSize="sm" fontWeight="bold" color="fg">
                Detalhamento de Pastas & Ocupação
              </Text>
            </HStack>
            <Text fontSize="xs" color="fg.subtle">
              Total indexado: {resumo?.tamanhoTotalFormatado ?? '0 B'}
            </Text>
          </HStack>

          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={3}
          >
            {dadosCategorias.map((cat) => {
              const porcentagem =
                espacoTotalBytes > 0
                  ? Math.round((cat.tamanhoBytes / espacoTotalBytes) * 100)
                  : 0

              return (
                <Box
                  key={cat.name}
                  p={3.5}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  bg="rgba(255, 255, 255, 0.02)"
                  transition="all 0.2s"
                  _hover={{ borderColor: 'cirqueira.brand.500/30', bg: 'rgba(255, 255, 255, 0.04)' }}
                >
                  <HStack justify="space-between" align="center" mb={2}>
                    <Text fontSize="xs" fontWeight="bold" color="fg" isTruncated maxW="160px">
                      {cat.name}
                    </Text>
                    <Badge size="xs" variant="subtle" colorPalette="teal" borderRadius="md">
                      {cat.totalItens} {cat.totalItens === 1 ? 'item' : 'itens'}
                    </Badge>
                  </HStack>

                  <Box w="full" h="4px" borderRadius="full" bg="cirqueira.grey.800" overflow="hidden" mb={2}>
                    <Box
                      h="full"
                      w={`${Math.min(porcentagem, 100)}%`}
                      borderRadius="full"
                      bg="linear-gradient(90deg, #00ba9c, #00aaf9)"
                    />
                  </Box>

                  <HStack justify="space-between" fontSize="11px" color="fg.subtle">
                    <Text as="span">{cat.tamanhoFormatado}</Text>
                    <Text as="span" fontWeight="semibold" color="cirqueira.brand.400">
                      {porcentagem}% do total
                    </Text>
                  </HStack>
                </Box>
              )
            })}
          </Grid>
        </Card.Root>
      )}
    </VStack>
  )
})
