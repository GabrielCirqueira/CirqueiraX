import { useSEO } from '@/shared/hooks'
import { Badge, Box, Button, Grid, HStack, Skeleton, Tabs, Text, VStack } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Suspense, lazy, memo, useState } from 'react'
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
import { pluralizar } from './utils/metricasDashboard'

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
  useSEO({
    title: 'Dashboard Geral',
    description:
      'Métricas em tempo real, volume de downloads, status de sincronização com Google Fotos e integridade do storage.',
    keywords: 'dashboard, metricas, downloads, google fotos, syncthing, cirqueirax',
  })

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
    <Box w="full" maxW="7xl" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
      <VStack w="full" gap={6} alignItems="stretch">
        <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={4}>
          <VStack gap={1} alignItems="flex-start">
            <Text as="h1" fontSize="2xl" fontWeight="semibold" color="fg" letterSpacing="tight">
              Dashboard
            </Text>
            <HStack gap={2} fontSize="sm" color="fg.subtle">
              <Box
                w={1.5}
                h={1.5}
                borderRadius="full"
                bg={totalErros > 0 ? 'cirqueira.red.500' : 'cirqueira.green.500'}
              />
              <Text as="span">
                {totalErros > 0
                  ? pluralizar(totalErros, 'erro pendente', 'erros pendentes')
                  : 'Tudo funcionando'}
              </Text>
            </HStack>
          </VStack>

          <Button
            size="sm"
            variant="ghost"
            borderRadius="lg"
            color="fg.muted"
            disabled={atualizandoManual}
            onClick={handleAtualizarTudo}
          >
            <RefreshCw
              size={14}
              style={{ animation: atualizandoManual ? 'spin 1s linear infinite' : 'none' }}
            />
            {atualizandoManual ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </HStack>

        <BarraAcoesRapidas
          pastasSync={pastasSync}
          onAtualizarTudo={handleAtualizarTudo}
          atualizando={atualizandoManual}
        />

        <CardsResumo resumo={resumo} carregando={carregandoResumo} onSelecionarAba={setAbaAtiva} />

        <CardsVideosMetricas metricas={resumo?.metricasVideos} carregando={carregandoResumo} />

        <Tabs.Root
          value={abaAtiva}
          onValueChange={(e) => setAbaAtiva(e.value)}
          variant="line"
          size="sm"
          w="full"
        >
          <Tabs.List borderColor="border.subtle" overflowX="auto">
            <Tabs.Trigger value="visao-geral">Visão geral</Tabs.Trigger>
            <Tabs.Trigger value="categorias">Categorias · {categorias.length}</Tabs.Trigger>
            <Tabs.Trigger value="sincronizacao">Sincronização · {pastasSync.length}</Tabs.Trigger>
            <Tabs.Trigger value="erros">
              Erros
              {totalErros > 0 && (
                <Badge size="xs" variant="subtle" colorPalette="red" borderRadius="md">
                  {totalErros}
                </Badge>
              )}
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        <Suspense fallback={<Skeleton h="260px" borderRadius="xl" />}>
          {abaAtiva === 'visao-geral' && (
            <VStack gap={4} w="full" alignItems="stretch">
              <GraficosDashboard
                resumo={resumo}
                categorias={categorias}
                carregando={carregandoResumo || carregandoCategorias}
              />
              <Grid
                templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 3fr) minmax(0, 2fr)' }}
                gap={4}
                w="full"
              >
                <AtividadesRecentes midias={resumo?.ultimasMidias} carregando={carregandoResumo} />
                <StatusIntegracoes
                  statusSync={statusSync}
                  resumo={resumo}
                  totalCategorias={categorias.length}
                />
              </Grid>
            </VStack>
          )}

          {abaAtiva === 'categorias' && (
            <TabelaCategorias categorias={categorias} carregando={carregandoCategorias} />
          )}

          {abaAtiva === 'sincronizacao' && <PainelSync />}

          {abaAtiva === 'erros' && <FilaErros />}
        </Suspense>
      </VStack>
    </Box>
  )
})
