import { cn } from '@/shared/lib/cn'
import { Box, Flex, Grid, HStack, Text, VStack } from '@/shared/ui/layout'
import { Card, CardContent, CardHeader, CardTitle, Chip, Skeleton } from '@heroui/react'
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
  className?: string
}

const ORIGEM_CONFIG: Record<
  OrigemMedia,
  { label: string; icon: typeof Bot; corBadge: string; corBorda: string }
> = {
  print_empresa: {
    label: 'Prints Empresa',
    icon: Building2,
    corBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    corBorda: 'hover:border-blue-500/40',
  },
  print_pessoal: {
    label: 'Prints Pessoal',
    icon: Smartphone,
    corBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    corBorda: 'hover:border-emerald-500/40',
  },
  bot_telegram: {
    label: 'Bot Telegram',
    icon: Bot,
    corBadge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    corBorda: 'hover:border-cyan-500/40',
  },
  download: {
    label: 'Downloads de Vídeo',
    icon: DownloadCloud,
    corBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    corBorda: 'hover:border-amber-500/40',
  },
  manual: {
    label: 'Upload Manual',
    icon: UploadCloud,
    corBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    corBorda: 'hover:border-purple-500/40',
  },
}

export const CardsResumo = memo(function CardsResumo({
  resumo,
  carregando = false,
  className,
}: CardsResumoProps) {
  if (carregando) {
    return (
      <VStack className={cn('w-full gap-6', className)}>
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4'].map((chave) => (
            <Card key={chave} className="border border-white/10 bg-black/40 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 rounded-md mb-2" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </CardContent>
            </Card>
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
    <VStack className={cn('w-full gap-6', className)}>
      {/* ── Cards Principais de Métricas ── */}
      <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Mídias */}
        <Card className="border border-white/10 bg-linear-to-br from-white/5 to-white/2 backdrop-blur-xl shadow-lg hover:border-white/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Total Ingerido</CardTitle>
            <Box className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </Box>
          </CardHeader>
          <CardContent>
            <Text className="text-3xl font-bold tracking-tight text-white">{totalGeral}</Text>
            <HStack className="mt-2 text-xs text-white/50 gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Espaço: {resumo?.tamanhoTotalFormatado ?? '0 B'}</span>
            </HStack>
          </CardContent>
        </Card>

        {/* Processadas com Sucesso */}
        <Card className="border border-emerald-500/20 bg-linear-to-br from-emerald-500/5 to-transparent backdrop-blur-xl shadow-lg hover:border-emerald-500/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-400/90">Concluídas</CardTitle>
            <Box className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </Box>
          </CardHeader>
          <CardContent>
            <Text className="text-3xl font-bold tracking-tight text-emerald-300">{concluidos}</Text>
            <HStack className="mt-2 text-xs text-emerald-400/70 gap-1.5">
              <Chip
                size="sm"
                variant="flat"
                className="h-5 text-[10px] bg-emerald-500/20 text-emerald-300 border-0"
              >
                {taxaConclusao}% sucesso
              </Chip>
              <span>distribuídas e sincronizadas</span>
            </HStack>
          </CardContent>
        </Card>

        {/* Em Fila / Processando */}
        <Card className="border border-cyan-500/20 bg-linear-to-br from-cyan-500/5 to-transparent backdrop-blur-xl shadow-lg hover:border-cyan-500/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-cyan-400/90">Em Processamento</CardTitle>
            <Box className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {emProcessamento > 0 ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </Box>
          </CardHeader>
          <CardContent>
            <Text className="text-3xl font-bold tracking-tight text-cyan-300">
              {emProcessamento}
            </Text>
            <HStack className="mt-2 text-xs text-cyan-400/70 gap-1.5">
              <span>Fila ativa de background</span>
            </HStack>
          </CardContent>
        </Card>

        {/* Fila de Erros */}
        <Card
          className={cn(
            'backdrop-blur-xl shadow-lg transition-all duration-300',
            totalErros > 0
              ? 'border-rose-500/40 bg-linear-to-br from-rose-500/10 to-transparent hover:border-rose-500/60'
              : 'border-white/10 bg-linear-to-br from-white/5 to-white/2 hover:border-white/20'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={cn(
                'text-sm font-medium',
                totalErros > 0 ? 'text-rose-400 font-semibold' : 'text-white/70'
              )}
            >
              Fila de Erros
            </CardTitle>
            <Box
              className={cn(
                'p-2 rounded-xl border',
                totalErros > 0
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-white/5 text-white/40 border-white/10'
              )}
            >
              {totalErros > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </Box>
          </CardHeader>
          <CardContent>
            <Text
              className={cn(
                'text-3xl font-bold tracking-tight',
                totalErros > 0 ? 'text-rose-400' : 'text-white/40'
              )}
            >
              {totalErros}
            </Text>
            <HStack className="mt-2 text-xs text-white/50 gap-1.5">
              {totalErros > 0 ? (
                <Text className="text-rose-400/90 font-medium">Requer atenção ou retentativa</Text>
              ) : (
                <span>Nenhum erro pendente</span>
              )}
            </HStack>
          </CardContent>
        </Card>
      </Grid>

      {/* ── Cards de Distribuição por Origem ── */}
      <VStack className="w-full gap-3">
        <HStack className="justify-between items-center px-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Distribuição por Origem de Mídia
          </Text>
          <HStack className="text-xs text-white/40 gap-1">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Espaço total: {resumo?.tamanhoTotalFormatado ?? '0 B'}</span>
          </HStack>
        </HStack>

        <Grid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.keys(ORIGEM_CONFIG) as OrigemMedia[]).map((origem) => {
            const config = ORIGEM_CONFIG[origem]
            const Icone = config.icon
            const qtd = resumo?.porOrigem?.[origem] ?? 0
            const espaco = resumo?.porOrigemEspaco?.[origem]?.tamanhoFormatado ?? '0 B'

            return (
              <Card
                key={origem}
                className={cn(
                  'border border-white/5 bg-white/2 hover:bg-white/4 transition-all duration-200',
                  config.corBorda
                )}
              >
                <CardContent className="p-3.5">
                  <HStack className="justify-between items-start mb-2">
                    <Box className={cn('p-1.5 rounded-lg border', config.corBadge)}>
                      <Icone className="w-4 h-4" />
                    </Box>
                    <Text className="text-lg font-bold text-white">{qtd}</Text>
                  </HStack>
                  <Text className="text-xs font-medium text-white/80 truncate">{config.label}</Text>
                  <Text className="text-[11px] text-white/40 mt-0.5">{espaco}</Text>
                </CardContent>
              </Card>
            )
          })}
        </Grid>
      </VStack>
    </VStack>
  )
})
