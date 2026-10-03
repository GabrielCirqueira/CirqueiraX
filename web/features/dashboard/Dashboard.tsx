import { Badge, Button, Container, HStack, Tabs, Text, VStack } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  FolderTree,
  LayoutDashboard,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { memo, useState } from 'react'
import { CardsResumo } from './components/CardsResumo'
import { FilaErros } from './components/FilaErros'
import { GraficosDashboard } from './components/GraficosDashboard'
import { PainelSync } from './components/PainelSync'
import { TabelaCategorias } from './components/TabelaCategorias'
import {
  DASHBOARD_QUERY_KEYS,
  useCategoriasMetricas,
  useFilaErros,
  usePastasSync,
  useResumoDashboard,
} from './hooks/useDashboard'

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
  const { data: respostaErros } = useFilaErros(1, 10)
  const { data: pastasSync = [] } = usePastasSync()

  const totalErros = resumo?.totalErros ?? respostaErros?.total ?? 0
  const pastasSincronizando = pastasSync.filter((p) => p.emSincronizacao).length

  function handleAtualizarTudo() {
    setAtualizandoManual(true)
    Promise.all([
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.resumo }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.categorias }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'erros'] }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.syncPastas }),
    ]).finally(() => {
      setTimeout(() => setAtualizandoManual(false), 600)
    })
  }

  return (
    <Container maxW="7xl" py={8} px={6}>
      <VStack w="full" gap={8} alignItems="stretch">
        <VStack w="full" gap={4} alignItems="stretch">
          <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
            <VStack gap={1.5} alignItems="flex-start">
              <HStack gap={2} align="center" flexWrap="wrap">
                <Badge variant="subtle" size="sm" colorPalette="brand" fontWeight="semibold">
                  <Sparkles size={14} style={{ marginRight: '4px' }} />
                  Painel v1.0 • Master
                </Badge>
                {totalErros > 0 ? (
                  <Badge
                    variant="subtle"
                    size="sm"
                    colorPalette="red"
                    fontWeight="semibold"
                    cursor="pointer"
                    onClick={() => setAbaAtiva('erros')}
                  >
                    <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                    {totalErros} {totalErros === 1 ? 'erro pendente' : 'erros pendentes'}
                  </Badge>
                ) : (
                  <Badge variant="subtle" size="sm" colorPalette="green" fontWeight="semibold">
                    <CheckCircle2 size={14} style={{ marginRight: '4px' }} />
                    Pipeline 100% Operacional
                  </Badge>
                )}
                {pastasSincronizando > 0 && (
                  <Badge variant="subtle" size="sm" colorPalette="blue" fontWeight="semibold">
                    <RefreshCw
                      size={14}
                      style={{ animation: 'spin 1s linear infinite', marginRight: '4px' }}
                    />
                    {pastasSincronizando} pasta(s) sincronizando
                  </Badge>
                )}
              </HStack>

              <Text
                as="h1"
                fontSize={{ base: '3xl', sm: '4xl' }}
                fontWeight="black"
                color="fg"
                letterSpacing="tight"
              >
                Dashboard de Mídias & Pipeline
              </Text>
              <Text fontSize="sm" color="fg.subtle" maxW="2xl">
                Visão consolidada de ingestão, distribuição local, categorização, agentes e
                sincronização Syncthing em tempo real.
              </Text>
            </VStack>

            <Button
              size="sm"
              variant="ghost"
              disabled={atualizandoManual}
              onClick={handleAtualizarTudo}
              fontWeight="medium"
              h={9}
              borderRadius="xl"
            >
              <RefreshCw
                size={16}
                style={{
                  animation: atualizandoManual ? 'spin 1s linear infinite' : 'none',
                  marginRight: '6px',
                }}
              />
              <Text as="span">{atualizandoManual ? 'Atualizando...' : 'Atualizar Dados'}</Text>
            </Button>
          </HStack>
        </VStack>

        <CardsResumo resumo={resumo} carregando={carregandoResumo} />

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
            >
              <Tabs.Trigger
                value="visao-geral"
                px={4}
                py={2}
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="semibold"
                borderRadius="xl"
              >
                <HStack gap={2} align="center">
                  <LayoutDashboard size={16} />
                  <Text as="span">Visão Geral & Gráficos</Text>
                </HStack>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="categorias"
                px={4}
                py={2}
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="semibold"
                borderRadius="xl"
              >
                <HStack gap={2} align="center">
                  <FolderTree size={16} />
                  <Text as="span">Categorias ({categorias.length})</Text>
                </HStack>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="sincronizacao"
                px={4}
                py={2}
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="semibold"
                borderRadius="xl"
              >
                <HStack gap={2} align="center">
                  <RefreshCw size={16} />
                  <Text as="span">Sincronização ({pastasSync.length})</Text>
                </HStack>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="erros"
                px={4}
                py={2}
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="semibold"
                borderRadius="xl"
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
                    >
                      {totalErros}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>

          {abaAtiva === 'visao-geral' && (
            <VStack gap={8} w="full" alignItems="stretch">
              <GraficosDashboard
                resumo={resumo}
                categorias={categorias}
                carregando={carregandoResumo || carregandoCategorias}
              />

              <HStack justify="space-between" align="center" pt={2}>
                <VStack gap={0.5} alignItems="flex-start">
                  <Text as="h2" fontSize="xl" fontWeight="bold" color="fg">
                    Distribuição por Pastas & Categorias
                  </Text>
                  <Text fontSize="xs" color="fg.subtle">
                    Gerencie mapeamentos de diretórios locais e sincronização
                  </Text>
                </VStack>
              </HStack>

              <TabelaCategorias categorias={categorias} carregando={carregandoCategorias} />

              <PainelSync />
            </VStack>
          )}

          {abaAtiva === 'categorias' && (
            <VStack gap={6} w="full" alignItems="stretch">
              <TabelaCategorias categorias={categorias} carregando={carregandoCategorias} />
            </VStack>
          )}

          {abaAtiva === 'sincronizacao' && (
            <VStack gap={6} w="full" alignItems="stretch">
              <PainelSync />
            </VStack>
          )}

          {abaAtiva === 'erros' && (
            <VStack gap={6} w="full" alignItems="stretch">
              <FilaErros />
            </VStack>
          )}
        </VStack>
      </VStack>
    </Container>
  )
})
