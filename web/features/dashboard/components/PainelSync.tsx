import { Badge, Box, Button, Card, Grid, HStack, IconButton, Skeleton, Text, VStack } from '@chakra-ui/react'
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
}

function estadoBadge(estado: string, emSincronizacao: boolean) {
  if (emSincronizacao || estado === 'syncing' || estado === 'scanning') {
    return {
      label: 'Sincronizando...',
      icon: Loader2,
      animate: true,
      colorPalette: 'blue',
    }
  }

  if (estado === 'idle' || estado === 'ok') {
    return {
      label: 'Sincronizado',
      icon: CheckCircle2,
      animate: false,
      colorPalette: 'green',
    }
  }

  if (estado === 'paused') {
    return {
      label: 'Pausado',
      icon: PauseCircle,
      animate: false,
      colorPalette: 'amber',
    }
  }

  if (estado === 'offline') {
    return {
      label: 'Daemon Offline',
      icon: WifiOff,
      animate: false,
      colorPalette: 'gray',
    }
  }

  return {
    label: estado || 'Ocioso',
    icon: AlertTriangle,
    animate: false,
    colorPalette: 'purple',
  }
}

export const PainelSync = memo(function PainelSync({
  pastas: pastasList,
  carregando: carregandoProp,
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
      <VStack w="full" gap={4} alignItems="stretch">
        <HStack justify="space-between" align="center">
          <Skeleton h={6} w={52} borderRadius="md" />
          <Skeleton h={8} w={8} borderRadius="full" />
        </HStack>
        <Grid w="full" templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
          {['sync-sk-1', 'sync-sk-2'].map((chave) => (
            <Card.Root key={chave} borderWidth="1px" borderColor="border.subtle" bg="bg.panel">
              <Card.Body p={4}>
                <Skeleton h={5} w={40} borderRadius="md" mb={2} />
                <Skeleton h={4} w={56} borderRadius="md" mb={3} />
                <Skeleton h={8} w={28} borderRadius="lg" />
              </Card.Body>
            </Card.Root>
          ))}
        </Grid>
      </VStack>
    )
  }

  return (
    <VStack w="full" gap={4} alignItems="stretch">
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
        <HStack gap={2.5}>
          <Box p={2} borderRadius="xl" bg="cyan.500/10" color="cyan.500">
            <FolderSync size={20} />
          </Box>
          <VStack gap={0.5} alignItems="flex-start">
            <Text fontSize="base" fontWeight="semibold" color="fg">
              Sincronização com Dispositivos (Syncthing)
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              Pastas observadas e transferência direta com celular/VPS
            </Text>
          </VStack>
        </HStack>

        <HStack gap={2}>
          <Badge
            size="sm"
            variant="subtle"
            colorPalette={isOnline ? 'cyan' : 'gray'}
          >
            <HStack gap={1.5}>
              {isOnline ? (
                <Wifi size={12} color="#06b6d4" />
              ) : (
                <WifiOff size={12} />
              )}
              <span>
                {isOnline ? `Syncthing Ativo ${versao ? `(v${versao})` : ''}` : 'Syncthing Inativo'}
              </span>
            </HStack>
          </Badge>

          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Atualizar Status"
          >
            <RefreshCw size={14} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </HStack>
      </HStack>

      {mensagemSucesso && (
        <Box p={3} borderRadius="xl" bg="emerald.500/10" borderWidth="1px" borderColor="emerald.500/20" color="emerald.500" fontSize="xs" display="flex" alignItems="center" gap={2}>
          <CheckCircle2 size={16} flexShrink={0} />
          <span>{mensagemSucesso}</span>
        </Box>
      )}

      {pastas.length === 0 ? (
        <Card.Root borderWidth="1px" borderColor="border.subtle" bg="bg.panel" p={6} textAlign="center">
          <Card.Body display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
            <Smartphone size={32} style={{ opacity: 0.3 }} />
            <Text fontSize="sm" fontWeight="medium" color="fg.subtle">
              Nenhuma pasta configurada no daemon do Syncthing.
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              As pastas sincronizadas pelo app móvel aparecerão aqui automaticamente.
            </Text>
          </Card.Body>
        </Card.Root>
      ) : (
        <Grid w="full" templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
          {pastas.map((pasta) => {
            const badge = estadoBadge(pasta.estado, pasta.emSincronizacao)
            const BadgeIcon = badge.icon
            const estaSincronizandoEstaPasta = sincronizando && pastaEmAcao === pasta.id

            return (
              <Card.Root
                key={pasta.id}
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.panel"
                shadow="md"
                transition="all 0.2s"
                _hover={{ borderColor: 'cyan.500' }}
              >
                <Card.Header display="flex" flexDirection="row" alignItems="center" justifyContent="space-between" pb={2}>
                  <HStack gap={2.5}>
                    <Box p={2} borderRadius="xl" bg="cyan.500/10" color="cyan.400">
                      <Smartphone size={16} />
                    </Box>
                    <VStack gap={0.5} alignItems="flex-start">
                      <Card.Title fontSize="sm" fontWeight="semibold" color="fg">
                        {pasta.label || pasta.id}
                      </Card.Title>
                      <Text fontSize="11px" fontFamily="mono" color="fg.subtle" truncate maxW="200px">
                        {pasta.caminho || `ID: ${pasta.id}`}
                      </Text>
                    </VStack>
                  </HStack>

                  <Badge
                    size="sm"
                    variant="subtle"
                    colorPalette={badge.colorPalette}
                  >
                    <HStack gap={1}>
                      <BadgeIcon size={12} style={{ animation: badge.animate ? 'spin 1s linear infinite' : 'none' }} />
                      <span>{badge.label}</span>
                    </HStack>
                  </Badge>
                </Card.Header>

                <Card.Body pt={2}>
                  <HStack justify="space-between" align="center" py={2} borderTopWidth="1px" borderColor="border.subtle" fontSize="xs" color="fg.subtle">
                    <HStack gap={1.5}>
                      <HardDrive size={14} color="#06b6d4" />
                      <span>{pasta.tamanhoFormatado || '0 B'}</span>
                    </HStack>

                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="cyan"
                      disabled={estaSincronizandoEstaPasta || pasta.emSincronizacao}
                      onClick={() => handleSincronizar(pasta.id)}
                      fontSize="xs"
                      fontWeight="medium"
                      h={7}
                    >
                      {estaSincronizandoEstaPasta ? (
                        <HStack gap={1.5}>
                          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Solicitando...</span>
                        </HStack>
                      ) : (
                        <HStack gap={1.5}>
                          <RefreshCw size={12} />
                          <span>Sincronizar agora</span>
                        </HStack>
                      )}
                    </Button>
                  </HStack>
                </Card.Body>
              </Card.Root>
            )
          })}
        </Grid>
      )}
    </VStack>
  )
})