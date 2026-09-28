import { cn } from '@/shared/lib/cn'
import { Box, Grid, HStack, Text, VStack } from '@/shared/ui/layout'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@heroui/react'
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
  className?: string
}

const CORES_ORIGEM = {
  print_empresa: '#3b82f6', // azul
  print_pessoal: '#10b981', // esmeralda
  bot_telegram: '#06b6d4', // ciano
  download: '#f59e0b', // âmbar
  manual: '#a855f7', // roxo
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
    <Box className="rounded-xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-3 shadow-2xl text-xs">
      <Text className="font-semibold text-white mb-1">{data.name}</Text>
      <HStack className="gap-2 text-white/70">
        <span>Quantidade:</span>
        <span className="font-bold text-white">{data.value} itens</span>
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
    <Box className="rounded-xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-3 shadow-2xl text-xs">
      <Text className="font-semibold text-white mb-1">{label}</Text>
      <VStack className="gap-1 text-white/70">
        <HStack className="justify-between gap-4">
          <span>Tamanho:</span>
          <span className="font-bold text-purple-300">{data.payload.tamanhoFormatado}</span>
        </HStack>
        <HStack className="justify-between gap-4">
          <span>Total de itens:</span>
          <span className="font-bold text-white">{data.payload.totalItens}</span>
        </HStack>
      </VStack>
    </Box>
  )
}

export const GraficosDashboard = memo(function GraficosDashboard({
  resumo,
  categorias = [],
  carregando = false,
  className,
}: GraficosDashboardProps) {
  if (carregando) {
    return (
      <Grid className={cn('grid-cols-1 lg:grid-cols-2 gap-4 w-full', className)}>
        {['grafico-sk-1', 'grafico-sk-2'].map((chave) => (
          <Card key={chave} className="border border-white/10 bg-black/40 backdrop-blur-md p-4">
            <Skeleton className="h-6 w-48 rounded-md mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </Card>
        ))}
      </Grid>
    )
  }

  // 1. Dados para o Donut Chart por Origem
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

  // 2. Dados para o BarChart por Categoria (em Megabytes para escala proporcional)
  const dadosCategorias = categorias.map((cat) => ({
    name: cat.nome,
    tamanhoMb: Number((cat.tamanhoBytes / (1024 * 1024)).toFixed(2)),
    tamanhoFormatado: cat.tamanhoFormatado,
    totalItens: cat.totalItens,
  }))

  const temDadosOrigem = dadosOrigem.length > 0
  const temDadosCategorias = dadosCategorias.length > 0

  return (
    <Grid className={cn('grid-cols-1 lg:grid-cols-2 gap-4 w-full', className)}>
      {/* ── Gráfico 1: Volume por Origem ── */}
      <Card className="border border-white/10 bg-linear-to-br from-white/5 to-white/2 backdrop-blur-xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <HStack className="gap-2.5">
            <Box className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PieChartIcon className="w-5 h-5" />
            </Box>
            <VStack className="gap-0.5">
              <CardTitle className="text-sm font-semibold text-white">
                Distribuição de Mídias por Origem
              </CardTitle>
              <Text className="text-xs text-white/50">Proporção de itens por canal de entrada</Text>
            </VStack>
          </HStack>
        </CardHeader>

        <CardContent className="pt-2">
          {!temDadosOrigem ? (
            <Box className="h-64 flex flex-col items-center justify-center text-center text-white/40">
              <PieChartIcon className="w-8 h-8 mb-2 opacity-30" />
              <Text className="text-xs">Nenhuma mídia registrada para exibição gráfica.</Text>
            </Box>
          ) : (
            <Box className="h-64 w-full">
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
                      <span className="text-xs text-white/70 font-medium">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Gráfico 2: Armazenamento por Categoria ── */}
      <Card className="border border-white/10 bg-linear-to-br from-white/5 to-white/2 backdrop-blur-xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <HStack className="gap-2.5">
            <Box className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <HardDrive className="w-5 h-5" />
            </Box>
            <VStack className="gap-0.5">
              <CardTitle className="text-sm font-semibold text-white">
                Armazenamento por Categoria (MB)
              </CardTitle>
              <Text className="text-xs text-white/50">
                Consumo em disco por diretório classificado
              </Text>
            </VStack>
          </HStack>
        </CardHeader>

        <CardContent className="pt-2">
          {!temDadosCategorias ? (
            <Box className="h-64 flex flex-col items-center justify-center text-center text-white/40">
              <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
              <Text className="text-xs">Nenhum dado de categoria disponível.</Text>
            </Box>
          ) : (
            <Box className="h-64 w-full">
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
        </CardContent>
      </Card>
    </Grid>
  )
})
