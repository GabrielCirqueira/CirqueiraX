import { Badge, Box, Button, HStack, Tabs, Text, VStack } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, FolderTree, LayoutDashboard, RefreshCw } from 'lucide-react'
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
    <Box w="full" maxW="7xl" mx="auto" py={{ base: 4, md: 6 }} px={{ base: 4, md: 8 }}>
      <VStack w="full" gap={6} alignItems="stretch">
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <VStack gap={1} alignItems="flex-start">
            <Text
              as="h1"
              fontSize={{ base: '2xl', sm: '3xl' }}
              fontWeight="black"
              color="fg"
              letterSpacing="tight"
            >
              Dashboard
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              Métricas operacionais e visão integrada de mídias em tempo real
            </Text>
          </VStack>

          <HStack gap={3}>
            {totalErros > 0 ? (
              <Badge
                variant="subtle"
                size="sm"
                colorPalette="red"
                fontWeight="semibold"
                cursor="pointer"
                onClick={() => setAbaAtiva('erros')}
                borderRadius="full"
                px={2.5}
                py={1}
              >
                <AlertTriangle size={13} style={{ marginRight: '4px' }} />
                {totalErros} {totalErros === 1 ? 'erro pendente' : 'erros pendentes'}
              </Badge>
            ) : (
              <Badge
                variant="subtle"
                size="sm"
                colorPalette="green"
                fontWeight="semibold"
                borderRadius="full"
                px={2.5}
                py={1}
              >
                <CheckCircle2 size={13} style={{ marginRight: '4px' }} />
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

        <CardsResumo resumo={resumo} carregando={carregandoResumo} />

        <VStack w="full" gap={6} alignItems="stretch">
          <Tabs.Root value={abaAtiva} onValueChange={(e) => setAbaAtiva(e.value)} w="full">
            <Tabs.List
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border.subtle"
              p={1}
              borderRadius="2xl"
              flexWrap="wrap"
              gap={1}
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
                  <LayoutDashboard size={15} />
                  <Text as="span">Gráficos & Métricas</Text>
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
                  <FolderTree size={15} />
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
                  <RefreshCw size={15} />
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
                  <AlertTriangle size={15} />
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
            <VStack gap={6} w="full" alignItems="stretch">
              <GraficosDashboard
                resumo={resumo}
                categorias={categorias}
                carregando={carregandoResumo || carregandoCategorias}
              />
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
    </Box>
  )
})
