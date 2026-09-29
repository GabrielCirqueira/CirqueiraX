import { cn } from '@/shared/lib/cn'
import { Box, Grid, HStack, Text, VStack } from '@/shared/ui/layout'
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Skeleton } from '@heroui/react'
import {
  AlertTriangle,
  CheckCircle2,
  FolderSync,
  HardDrive,
  Loader2,
  PauseCircle,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { memo, useState } from 'react'
import { useSincronizarPasta, useStatusSync } from '../hooks/useDashboard'
import type { PastaSync } from '../types'

export interface PainelSyncProps {
  pastas?: PastaSync[]
  carregando?: boolean
  className?: string
}

function estadoBadge(estado: string, emSincronizacao: boolean) {
  if (emSincronizacao || estado === 'syncing' || estado === 'scanning') {
    return {
      label: 'Sincronizando...',
      icon: Loader2,
      animate: true,
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }
  }

  if (estado === 'idle' || estado === 'ok') {
    return {
      label: 'Sincronizado',
      icon: CheckCircle2,
      animate: false,
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    }
  }

  if (estado === 'paused') {
    return {
      label: 'Pausado',
      icon: PauseCircle,
      animate: false,
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    }
  }

  if (estado === 'offline') {
    return {
      label: 'Daemon Offline',
      icon: WifiOff,
      animate: false,
      className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    }
  }

  return {
    label: estado || 'Ocioso',
    icon: AlertTriangle,
    animate: false,
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }
}

export const PainelSync = memo(function PainelSync({
  pastas: pastasList,
  carregando: carregandoProp,
  className,
}: PainelSyncProps) {
  const { data: statusQuery, isLoading: carregandoQuery, refetch, isFetching } = useStatusSync()
  const { mutate: dispararSync, isPending: sincronizando } = useSincronizarPasta()
  const [pastaEmAcao, setPastaEmAcao] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const isOnline = statusQuery?.online ?? false
  const versao = statusQuery?.versao
  const pastas = pastasList ?? statusQuery?.pastas ?? []
  const carregando = carregandoProp ?? carregandoQuery

  function handleSincronizar(pastaId: string) {
    setPastaEmAcao(pastaId)
    setMensagemSucesso(null)

    dispararSync(pastaId, {
      onSuccess: (res) => {
        setMensagemSucesso(res.mensagem || `Sincronização da pasta ${pastaId} iniciada.`)
        setPastaEmAcao(null)
        setTimeout(() => setMensagemSucesso(null), 4000)
      },
      onError: () => {
        setPastaEmAcao(null)
      },
    })
  }

  if (carregando && pastas.length === 0) {
    return (
      <VStack className={cn('w-full gap-4', className)}>
        <HStack className="justify-between items-center">
          <Skeleton className="h-6 w-52 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </HStack>
        <Grid className="grid-cols-1 md:grid-cols-2 gap-4">
          {['sync-sk-1', 'sync-sk-2'].map((chave) => (
            <Card key={chave} className="border border-white/10 bg-black/40 backdrop-blur-md">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-40 rounded-md mb-2" />
                <Skeleton className="h-4 w-56 rounded-md mb-3" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </Grid>
      </VStack>
    )
  }

  return (
    <VStack className={cn('w-full gap-4', className)}>
      {/* ── Cabeçalho do Painel ── */}
      <HStack className="justify-between items-center flex-wrap gap-2">
        <HStack className="gap-2.5">
          <Box className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FolderSync className="w-5 h-5" />
          </Box>
          <VStack className="gap-0.5">
            <Text className="text-base font-semibold text-white">
              Sincronização com Dispositivos (Syncthing)
            </Text>
            <Text className="text-xs text-white/50">
              Pastas observadas e transferência direta com celular/VPS
            </Text>
          </VStack>
        </HStack>

        <HStack className="gap-2">
          <Chip
            size="sm"
            variant="soft"
            className={cn(
              'h-6 text-[11px] border',
              isOnline
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
            )}
          >
            <HStack className="gap-1.5">
              {isOnline ? (
                <Wifi className="w-3 h-3 text-cyan-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-zinc-400" />
              )}
              <span>
                {isOnline ? `Syncthing Ativo ${versao ? `(v${versao})` : ''}` : 'Syncthing Inativo'}
              </span>
            </HStack>
          </Chip>

          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            onPress={() => refetch()}
            isDisabled={isFetching}
            className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10"
            aria-label="Atualizar Status"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin text-cyan-400')} />
          </Button>
        </HStack>
      </HStack>

      {/* ── Mensagem de Feedback Rápido ── */}
      {mensagemSucesso && (
        <Box className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </Box>
      )}

      {/* ── Grid de Pastas Observadas ── */}
      {pastas.length === 0 ? (
        <Card className="border border-white/10 bg-white/2 backdrop-blur-md p-6 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-2">
            <Smartphone className="w-8 h-8 text-white/30" />
            <Text className="text-sm font-medium text-white/70">
              Nenhuma pasta configurada no daemon do Syncthing.
            </Text>
            <Text className="text-xs text-white/40">
              As pastas sincronizadas pelo app móvel aparecerão aqui automaticamente.
            </Text>
          </CardContent>
        </Card>
      ) : (
        <Grid className="grid-cols-1 md:grid-cols-2 gap-4">
          {pastas.map((pasta) => {
            const badge = estadoBadge(pasta.estado, pasta.emSincronizacao)
            const BadgeIcon = badge.icon
            const estaSincronizandoEstaPasta = sincronizando && pastaEmAcao === pasta.id

            return (
              <Card
                key={pasta.id}
                className="border border-white/10 bg-linear-to-br from-white/5 to-white/2 backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-300 shadow-md group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <HStack className="gap-2.5">
                    <Box className="p-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                      <Smartphone className="w-4 h-4" />
                    </Box>
                    <VStack className="gap-0.5">
                      <CardTitle className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {pasta.label || pasta.id}
                      </CardTitle>
                      <Text className="text-[11px] font-mono text-white/40 truncate max-w-[200px]">
                        {pasta.caminho || `ID: ${pasta.id}`}
                      </Text>
                    </VStack>
                  </HStack>

                  <Chip
                    size="sm"
                    variant="soft"
                    className={cn('h-6 text-[10px] border', badge.className)}
                  >
                    <HStack className="gap-1">
                      <BadgeIcon className={cn('w-3 h-3', badge.animate && 'animate-spin')} />
                      <span>{badge.label}</span>
                    </HStack>
                  </Chip>
                </CardHeader>

                <CardContent className="pt-2">
                  <HStack className="justify-between items-center py-2 border-t border-white/5 text-xs text-white/60">
                    <HStack className="gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{pasta.tamanhoFormatado || '0 B'}</span>
                    </HStack>

                    <Button
                      size="sm"
                      variant="ghost"
                      isDisabled={estaSincronizandoEstaPasta || pasta.emSincronizacao}
                      onPress={() => handleSincronizar(pasta.id)}
                      className="h-7 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 font-medium"
                    >
                      {estaSincronizandoEstaPasta ? (
                        <HStack className="gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Solicitando...</span>
                        </HStack>
                      ) : (
                        <HStack className="gap-1.5">
                          <RefreshCw className="w-3 h-3" />
                          <span>Sincronizar agora</span>
                        </HStack>
                      )}
                    </Button>
                  </HStack>
                </CardContent>
              </Card>
            )
          })}
        </Grid>
      )}
    </VStack>
  )
})
