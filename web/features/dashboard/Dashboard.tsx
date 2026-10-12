import { Badge, Box, Button, HStack, Skeleton, Tabs, Text, VStack } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  FolderTree,
  LayoutDashboard,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { memo, Suspense, lazy, useState } from 'react'
import { AtividadesRecentes } from './components/AtividadesRecentes'
import { BarraAcoesRapidas } from './components/BarraAcoesRapidas'
import { CardsResumo } from './components/CardsResumo'
import { CardsVideosMetricas } from './components/CardsVideosMetricas'
import { StatusIntegracoes } from './components/StatusIntegracoes'
import {
  DASHBOARD_QUERY_KEYS,
  useCategoriasMetricas,
  usePastasSync,
  useResumoDashboard,
  useStatusSync,
} from './hooks/useDashboard'

const GraficosDashboard = lazy(() =>
  import('./components/GraficosDashboard').then((m) => ({ default: m.GraficosDashboard }))
)
const TabelaCategorias = lazy(() =>
  import('./components/TabelaCategorias').then((m) => ({ default: m.TabelaCategorias }))
)
const PainelSync = lazy(() =>
  import('./components/PainelSync').then((m) => ({ default: m.PainelSync }))
)
const FilaErros = lazy(() =>
  import('./components/FilaErros').then((m) => ({ default: m.FilaErros }))
)

export function Component() {
  return <DashboardView />
}

export const Dashboard = Component

const DashboardView = memo(function DashboardView() {
  const queryClient = useQueryClient()
  const [abaAtiva, setAbaAtiva] = useState<string>('visao-geral')
  const [atualizandoManual, setAtualizandoManual] = useState(false)

  const { data: resumo, isLoading: carregandoResumo } = useResumoDashboard()
  const { data: categorias = [], isLoading: carregandoCategorias } = useCategoriasMetricas()
  const { data: pastasSync = [] } = usePastasSync()
  const { data: statusSync } = useStatusSync()

  const totalErros = resumo?.totalErros ?? 0

  function handleAtualizarTudo() {
    setAtualizandoManual(true)
    Promise.all([
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.resumo }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.categorias }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'erros'] }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.syncPastas }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.syncStatus }),
    ]).finally(() => {
      setTimeout(() => setAtualizandoManual(false), 600)
    })
  }

  return (
    <Box w="full" maxW="7xl" mx="auto" py={{ base: 4, md: 6 }} px={{ base: 4, md: 8 }}>
      <VStack w="full" gap={6} alignItems="stretch">
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <VStack gap={1} alignItems="flex-start">
            <HStack gap={2.5} align="center">
              <Text
                as="h1"
                fontSize={{ base: '2xl', sm: '3xl' }}
                fontWeight="black"
                color="fg"
                letterSpacing="tight"
              >
                Dashboard
              </Text>
              <Box
                w={2.5}
                h={2.5}
                borderRadius="full"
                bg="cirqueira.brand.400"
                boxShadow="0 0 10px rgba(0, 186, 156, 0.8)"
              />
            </HStack>
            <Text fontSize="xs" color="fg.subtle">
              Métricas operacionais, ingestão contínua e status integrado em tempo real
            </Text>
          </VStack>

          <HStack gap={3}>
            {totalErros > 0 ? (
              <Badge
                variant="subtle"
                size="md"
                colorPalette="red"
                fontWeight="semibold"
                cursor="pointer"
                onClick={() => setAbaAtiva('erros')}
                borderRadius="xl"
                px={3}
                py={1.5}
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.02)' }}
              >
                <AlertTriangle size={14} style={{ marginRight: '6px' }} />
                {totalErros} {totalErros === 1 ? 'erro pendente' : 'erros pendentes'}
              </Badge>
            ) : (
              <Badge
                variant="subtle"
                size="md"
                colorPalette="teal"
                fontWeight="semibold"
                borderRadius="xl"
                px={3}
                py={1.5}
              >
                <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
                Pipeline 100% Operacional
              </Badge>
            )}

            <Button
              size="sm"
              variant="outline"
              disabled={atualizandoManual}
              onClick={handleAtualizarTudo}
              fontWeight="medium"
              borderRadius="xl"
              _hover={{ borderColor: 'cirqueira.brand.500/50' }}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: atualizandoManual ? 'spin 1s linear infinite' : 'none',
                  marginRight: '6px',
                }}
              />
              <Text as="span">{atualizandoManual ? 'Atualizando...' : 'Atualizar'}</Text>
            </Button>
          </HStack>
        </HStack>

        <BarraAcoesRapidas
          pastasSync={pastasSync}
          onAtualizarTudo={handleAtualizarTudo}
          atualizando={atualizandoManual}
        />

        <CardsResumo
          resumo={resumo}
          carregando={carregandoResumo}
          onSelecionarAba={setAbaAtiva}
        />

        <CardsVideosMetricas
          metricas={resumo?.metricasVideos}
          carregando={carregandoResumo}
        />

        <VStack w="full" gap={6} alignItems="stretch">
          <Tabs.Root value={abaAtiva} onValueChange={(e) => setAbaAtiva(e.value)} w="full">
            <Tabs.List
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border.subtle"
              p={1.5}
              borderRadius="2xl"
              flexWrap="wrap"
              gap={1.5}
              shadow="sm"
            >
              <Tabs.Trigger
                value="visao-geral"
                px={4}
                py={2.5}
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="semibold"
                borderRadius="xl"
                transition="all 0.2s"
              >
                <HStack gap={2} align="center">
                  <LayoutDashboard size={16} />
                  <Text as="span">Gráficos & Métricas</Text>
                </HStack>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="categorias"
                px={4}
                py={2.5}
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="semibold"
                borderRadius="xl"
                transition="all 0.2s"
              >
                <HStack gap={2} align="center">
                  <FolderTree size={16} />
                  <Text as="span">Categorias ({categorias.length})</Text>
                </HStack>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="sincronizacao"
                px={4}
                py={2.5}
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="semibold"
                borderRadius="xl"
                transition="all 0.2s"
              >
                <HStack gap={2} align="center">
                  <RefreshCw size={16} />
                  <Text as="span">Sincronização ({pastasSync.length})</Text>
                </HStack>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="erros"
                px={4}
                py={2.5}
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="semibold"
                borderRadius="xl"
                transition="all 0.2s"
              >
                <HStack gap={2} align="center">
                  <AlertTriangle size={16} />
                  <Text as="span">Fila de Erros</Text>
                  {totalErros > 0 && (
                    <Badge
                      size="sm"
                      variant="subtle"
                      colorPalette="red"
                      px={1.5}
                      fontSize="10px"
                      fontWeight="bold"
                      borderRadius="md"
                    >
                      {totalErros}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>

          <Box key={abaAtiva} className="tab-pane-fade" w="full">
            {abaAtiva === 'visao-geral' && (
              <VStack gap={6} w="full" alignItems="stretch">
                <Suspense
                  fallback={
                    <Box
                      p={6}
                      borderRadius="2xl"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      bg="bg.panel"
                      minH="260px"
                    >
                      <Skeleton h="220px" borderRadius="xl" />
                    </Box>
                  }
                >
                  <GraficosDashboard
                    resumo={resumo}
                    categorias={categorias}
                    carregando={carregandoResumo || carregandoCategorias}
                  />
                </Suspense>

                <Box
                  display="grid"
                  gridTemplateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 1.2fr) minmax(0, 0.8fr)' }}
                  gap={5}
                  w="full"
                  minW={0}
                >
                  <AtividadesRecentes
                    midias={resumo?.ultimasMidias}
                    carregando={carregandoResumo}
                  />
                  <StatusIntegracoes
                    statusSync={statusSync}
                    resumo={resumo}
                    totalCategorias={categorias.length}
                  />
                </Box>
              </VStack>
            )}

            {abaAtiva === 'categorias' && (
              <VStack gap={6} w="full" alignItems="stretch">
                <Suspense
                  fallback={
                    <Box p={6} borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" bg="bg.panel">
                      <Skeleton h="200px" borderRadius="xl" />
                    </Box>
                  }
                >
                  <TabelaCategorias categorias={categorias} carregando={carregandoCategorias} />
                </Suspense>
              </VStack>
            )}

            {abaAtiva === 'sincronizacao' && (
              <VStack gap={6} w="full" alignItems="stretch">
                <Suspense
                  fallback={
                    <Box p={6} borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" bg="bg.panel">
                      <Skeleton h="200px" borderRadius="xl" />
                    </Box>
                  }
                >
                  <PainelSync />
                </Suspense>
              </VStack>
            )}

            {abaAtiva === 'erros' && (
              <VStack gap={6} w="full" alignItems="stretch">
                <Suspense
                  fallback={
                    <Box p={6} borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" bg="bg.panel">
                      <Skeleton h="200px" borderRadius="xl" />
                    </Box>
                  }
                >
                  <FilaErros />
                </Suspense>
              </VStack>
            )}
          </Box>
        </VStack>
      </VStack>
    </Box>
  )
})
