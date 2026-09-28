import { listarCategorias, listarMediaItens } from '@/features/downloads-video/api'
import { Box, Container, Grid, HStack, Text, VStack } from '@/shared/ui/layout'
import { Button, Card, CardContent, CardHeader, CardTitle, Chip } from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Cloud,
  DownloadCloud,
  Film,
  FolderCheck,
  Globe,
  LayoutDashboard,
  Monitor,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Video,
  Youtube,
} from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'

export function Component() {
  return <HomeContent />
}

const HomeContent = memo(function HomeContent() {
  // Consultar dados do sistema em tempo real
  const { data: respostaMedia, isLoading: carregandoMedia } = useQuery({
    queryKey: ['media-itens', 'home-stats'],
    queryFn: () => listarMediaItens({ porPagina: 10 }),
  })

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', 'home-stats'],
    queryFn: listarCategorias,
  })

  const totalMedia = respostaMedia?.total ?? 0

  return (
    <VStack className="w-full gap-12 py-10">
      {/* ════════════════════════════════════════════
          HERO SECTION — CIRQUEIRAX MEDIA PIPELINE
      ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden w-full">
        <Box className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-5%,color-mix(in_oklch,var(--color-brand-500)_20%,transparent),transparent)] pointer-events-none" />
        <Box className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_70%,var(--color-background))] pointer-events-none" />

        <Container size="xl" className="relative text-center space-y-6 py-12">
          <Chip
            variant="soft"
            size="sm"
            className="border border-brand-500/30 bg-brand-500/10 text-brand-600 font-semibold"
          >
            <Sparkles className="size-3.5 mr-1" />
            CirqueiraX Media Pipeline v6.0 • v1.0 Final
          </Chip>

          <VStack className="gap-3 items-center max-w-3xl mx-auto">
            <Text
              as="h1"
              className="text-4xl sm:text-6xl font-black font-sans tracking-tight leading-tight text-zinc-900 dark:text-zinc-100"
            >
              Central Inteligente de Ingestão &{' '}
              <Text as="span" className="text-brand-500">
                Gestão de Mídias
              </Text>
            </Text>
            <Text className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Automação completa para download de vídeos de redes sociais, upload manual com triagem
              inteligente por hash e agentes de captura de tela em segundo plano.
            </Text>
          </VStack>

          {/* Quick Actions Buttons */}
          <HStack className="gap-4 flex-wrap justify-center pt-2">
            <Link to="/dashboard">
              <Button
                variant="primary"
                size="lg"
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 shadow-lg shadow-brand-500/20"
              >
                <LayoutDashboard className="size-5 mr-2" />
                <span>Acessar Dashboard</span>
              </Button>
            </Link>

            <Link to="/downloads">
              <Button
                variant="outline"
                size="lg"
                className="border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold px-6 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <DownloadCloud className="size-5 text-brand-500 mr-2" />
                <span>Downloads de Vídeo</span>
              </Button>
            </Link>

            <Link to="/upload-manual">
              <Button
                variant="outline"
                size="lg"
                className="border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold px-6 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <UploadCloud className="size-5 text-indigo-500 mr-2" />
                <span>Upload Manual & Triagem</span>
              </Button>
            </Link>
          </HStack>

          {/* Status Chip Bar */}
          <HStack className="flex-wrap justify-center gap-2 pt-4">
            {['YouTube', 'TikTok', 'Twitter / X', 'Instagram', 'Agentes PC', 'Google Fotos'].map(
              (tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="soft"
                  className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-xs font-medium"
                >
                  {tag}
                </Chip>
              )
            )}
          </HStack>
        </Container>
      </section>

      {/* ════════════════════════════════════════════
          PAINEL DE MÉTRICAS & RECURSOS ATIVOS
      ════════════════════════════════════════════ */}
      <Container size="xl" className="space-y-6">
        <VStack className="gap-1 text-center sm:text-left">
          <Text as="h2" className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Métricas & Status do Sistema
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            Resumo em tempo real dos pipelines de ingestão, categorias e agentes conectados.
          </Text>
        </VStack>

        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Total Mídias */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Mídias Processadas
              </CardTitle>
              <Box className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                <Film className="size-5" />
              </Box>
            </CardHeader>
            <CardContent className="space-y-2">
              <Text className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                {carregandoMedia ? '...' : totalMedia}
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                Vídeos e imagens registrados no banco de dados
              </Text>
            </CardContent>
          </Card>

          {/* Card Categorias Cadastradas */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Categorias Ativas
              </CardTitle>
              <Box className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <FolderCheck className="size-5" />
              </Box>
            </CardHeader>
            <CardContent className="space-y-2">
              <Text className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                {categorias.length}
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                Categorias para organização e triagem automática
              </Text>
            </CardContent>
          </Card>

          {/* Card Agentes de Ingestão */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Agentes de Print
              </CardTitle>
              <Box className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Monitor className="size-5" />
              </Box>
            </CardHeader>
            <CardContent className="space-y-2">
              <HStack className="gap-2 items-center">
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold"
                >
                  2 Conectados
                </Chip>
              </HStack>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                Agente PC Empresa e Agente PC Pessoal ativos via X-Agent-Token
              </Text>
            </CardContent>
          </Card>

          {/* Card Integração Google Fotos */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Google Fotos Pipeline
              </CardTitle>
              <Box className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Cloud className="size-5" />
              </Box>
            </CardHeader>
            <CardContent className="space-y-2">
              <HStack className="gap-2 items-center">
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold"
                >
                  OAuth2 Pronto
                </Chip>
              </HStack>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                Sincronização com renovação automática de tokens
              </Text>
            </CardContent>
          </Card>
        </Grid>
      </Container>

      {/* ════════════════════════════════════════════
          RECURSOS DO SISTEMA & FUNCIONALIDADES
      ════════════════════════════════════════════ */}
      <Container size="xl" className="space-y-6">
        <VStack className="gap-1 text-center sm:text-left">
          <Text as="h2" className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Recursos Principais do CirqueiraX
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            Conheça as ferramentas e pipelines integrados ao ecossistema.
          </Text>
        </VStack>

        <Grid className="grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Downloads de Vídeo */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:border-brand-500/40 transition-colors">
            <CardHeader className="space-y-2">
              <Box className="size-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Video className="size-5" />
              </Box>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Downloads de Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Text className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Suporte completo a URLs do YouTube, TikTok, X (Twitter) e Instagram com extração
                automática de metadados (título, uploader, duração e thumbnail).
              </Text>

              <HStack className="gap-2 flex-wrap">
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                >
                  <Youtube className="size-3 mr-1" /> YouTube
                </Chip>
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                >
                  <Video className="size-3 mr-1" /> TikTok
                </Chip>
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                >
                  <Globe className="size-3 mr-1" /> Twitter / X
                </Chip>
              </HStack>

              <Link to="/downloads" className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 font-bold"
                >
                  <span>Acessar Downloads</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Feature 2: Upload Manual & Triagem */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:border-brand-500/40 transition-colors">
            <CardHeader className="space-y-2">
              <Box className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <UploadCloud className="size-5" />
              </Box>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Upload Manual & Triagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Text className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Área de drag-and-drop interativa para fotos e vídeos com verificação imediata de
                hash contra arquivos duplicados e atribuição rápida de categorias em lote.
              </Text>

              <HStack className="gap-2 flex-wrap">
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                >
                  Drag & Drop
                </Chip>
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                >
                  Checagem de Hash
                </Chip>
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                >
                  Ações em Lote
                </Chip>
              </HStack>

              <Link to="/upload-manual" className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 font-bold"
                >
                  <span>Acessar Upload Manual</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Feature 3: Agentes de Print & Automação */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:border-brand-500/40 transition-colors">
            <CardHeader className="space-y-2">
              <Box className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="size-5" />
              </Box>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Agentes de Ingestão Automática
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Text className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Agentes autônomos para PC Empresa e PC Pessoal com monitoramento de pastas em tempo
                real, debounce, cliente HTTP com retry e salvamento seguro.
              </Text>

              <HStack className="gap-2 flex-wrap">
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                >
                  print_empresa
                </Chip>
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                >
                  print_pessoal
                </Chip>
                <Chip
                  size="sm"
                  variant="soft"
                  className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                >
                  X-Agent-Token
                </Chip>
              </HStack>

              <Link to="/downloads" className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 font-bold"
                >
                  <span>Ver Mídias dos Agentes</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </Grid>
      </Container>
    </VStack>
  )
})
