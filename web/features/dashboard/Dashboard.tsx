import { Container, HStack, Text, VStack } from '@/shared/ui/layout'
import { Button, Chip, Tab, TabList, Tabs } from '@heroui/react'
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
    <Container size="xl" className="py-8 space-y-8">
      {/* ════════════════════════════════════════════
          CABEÇALHO PRINCIPAL DO DASHBOARD
      ════════════════════════════════════════════ */}
      <VStack className="gap-4">
        <HStack className="justify-between items-start flex-wrap gap-4">
          <VStack className="gap-1.5">
            <HStack className="gap-2 items-center flex-wrap">
              <Chip
                variant="soft"
                size="sm"
                className="border border-brand-500/30 bg-brand-500/10 text-brand-600 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Painel v1.0 • Master
              </Chip>
              {totalErros > 0 ? (
                <Chip
                  variant="soft"
                  size="sm"
                  className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer"
                  onClick={() => setAbaAtiva('erros')}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  {totalErros} {totalErros === 1 ? 'erro pendente' : 'erros pendentes'}
                </Chip>
              ) : (
                <Chip
                  variant="soft"
                  size="sm"
                  className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Pipeline 100% Operacional
                </Chip>
              )}
              {pastasSincronizando > 0 && (
                <Chip
                  variant="soft"
                  size="sm"
                  className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold animate-pulse"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  {pastasSincronizando} pasta(s) sincronizando
                </Chip>
              )}
            </HStack>

            <Text as="h1" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Dashboard de Mídias & Pipeline
            </Text>
            <Text className="text-sm text-white/60 max-w-2xl">
              Visão consolidada de ingestão, distribuição local, categorização, agentes e
              sincronização Syncthing em tempo real.
            </Text>
          </VStack>

          <Button
            size="sm"
            variant="ghost"
            isDisabled={atualizandoManual}
            onPress={handleAtualizarTudo}
            className="border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium h-9"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${atualizandoManual ? 'animate-spin text-brand-400' : ''}`}
            />
            <span>{atualizandoManual ? 'Atualizando...' : 'Atualizar Dados'}</span>
          </Button>
        </HStack>
      </VStack>

      {/* ════════════════════════════════════════════
          CARDS DE RESUMO (KPIs)
      ════════════════════════════════════════════ */}
      <CardsResumo resumo={resumo} carregando={carregandoResumo} />

      {/* ════════════════════════════════════════════
          ABAS DE NAVEGAÇÃO DO PAINEL
      ════════════════════════════════════════════ */}
      <VStack className="gap-6">
        <Tabs
          selectedKey={abaAtiva}
          onSelectionChange={(chave) => setAbaAtiva(String(chave))}
          className="w-full"
        >
          <TabList className="gap-1.5 bg-zinc-900/90 border border-white/10 p-1.5 rounded-2xl backdrop-blur-xl flex-wrap">
            <Tab
              id="visao-geral"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all"
            >
              <HStack className="gap-2 items-center">
                <LayoutDashboard className="w-4 h-4" />
                <span>Visão Geral & Gráficos</span>
              </HStack>
            </Tab>

            <Tab
              id="categorias"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all"
            >
              <HStack className="gap-2 items-center">
                <FolderTree className="w-4 h-4" />
                <span>Categorias ({categorias.length})</span>
              </HStack>
            </Tab>

            <Tab
              id="sincronizacao"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all"
            >
              <HStack className="gap-2 items-center">
                <RefreshCw className="w-4 h-4" />
                <span>Sincronização ({pastasSync.length})</span>
              </HStack>
            </Tab>

            <Tab
              id="erros"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all"
            >
              <HStack className="gap-2 items-center">
                <AlertTriangle className="w-4 h-4" />
                <span>Fila de Erros</span>
                {totalErros > 0 && (
                  <Chip
                    size="sm"
                    variant="soft"
                    className="h-4 px-1.5 text-[10px] bg-rose-500/20 text-rose-300 font-bold"
                  >
                    {totalErros}
                  </Chip>
                )}
              </HStack>
            </Tab>
          </TabList>
        </Tabs>

        {/* ── Conteúdo da Aba 1: Visão Geral & Gráficos ── */}
        {abaAtiva === 'visao-geral' && (
          <VStack className="gap-8 w-full">
            <GraficosDashboard
              resumo={resumo}
              categorias={categorias}
              carregando={carregandoResumo || carregandoCategorias}
            />

            <HStack className="justify-between items-center pt-2">
              <VStack className="gap-0.5">
                <Text as="h2" className="text-xl font-bold text-white">
                  Distribuição por Pastas & Categorias
                </Text>
                <Text className="text-xs text-white/50">
                  Gerencie mapeamentos de diretórios locais e sincronização
                </Text>
              </VStack>
            </HStack>

            <TabelaCategorias categorias={categorias} carregando={carregandoCategorias} />

            <PainelSync />
          </VStack>
        )}

        {/* ── Conteúdo da Aba 2: Categorias ── */}
        {abaAtiva === 'categorias' && (
          <VStack className="gap-6 w-full">
            <TabelaCategorias categorias={categorias} carregando={carregandoCategorias} />
          </VStack>
        )}

        {/* ── Conteúdo da Aba 3: Sincronização ── */}
        {abaAtiva === 'sincronizacao' && (
          <VStack className="gap-6 w-full">
            <PainelSync />
          </VStack>
        )}

        {/* ── Conteúdo da Aba 4: Fila de Erros ── */}
        {abaAtiva === 'erros' && (
          <VStack className="gap-6 w-full">
            <FilaErros />
          </VStack>
        )}
      </VStack>
    </Container>
  )
})
