import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Video,
  X,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { BarraAcoesEmLote } from './components/BarraAcoesEmLote'
import { CampoNovoLink } from './components/CampoNovoLink'
import { GridVideos } from './components/GridVideos'
import { ModalEditarMetadata } from './components/ModalEditarMetadata'
import { ModalVisualizarMidia } from './components/ModalVisualizarMidia'
import { TabelaVideos } from './components/TabelaVideos'
import {
  useApagarLote,
  useAtualizarMetadata,
  useCategorias,
  useCategorizarLote,
  useClassificarIndividual,
  useMediaItens,
  useRebaixarLote,
  useRetentarMediaItem,
  useRetentarTodos,
} from './hooks/useDownloadsVideo'
import type { AtualizarMetadataInput, FiltrosMediaItem, MediaItem } from './types'

export default function DownloadsVideo() {
  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string>('')
  const [origemFiltro, setOrigemFiltro] = useState<string>('')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'lista'>('grid')

  const [itemVisualizar, setItemVisualizar] = useState<MediaItem | null>(null)
  const [itemEditarMetadata, setItemEditarMetadata] = useState<MediaItem | null>(null)

  const [modalCategorizarAberto, setModalCategorizarAberto] = useState(false)
  const [categoriaAlvoUuid, setCategoriaAlvoUuid] = useState<string | null>(null)
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState<string>('')

  const [modalConfirmarApagar, setModalConfirmarApagar] = useState(false)
  const [itemApagarAlvo, setItemApagarAlvo] = useState<string | null>(null)

  const [modalConfirmarRebaixar, setModalConfirmarRebaixar] = useState(false)
  const [itemRebaixarAlvo, setItemRebaixarAlvo] = useState<string | null>(null)

  const filtros = useMemo<FiltrosMediaItem>(() => {
    const obj: FiltrosMediaItem = {
      pagina,
      porPagina: 12,
    }
    if (busca.trim()) {
      obj.busca = busca.trim()
    }
    if (statusFiltro) {
      obj.status = statusFiltro
    }
    if (origemFiltro) {
      obj.origem = origemFiltro
    }
    return obj
  }, [pagina, busca, statusFiltro, origemFiltro])

  const { data: respostaPaginada, isLoading, isFetching, refetch } = useMediaItens(filtros)
  const { data: categorias = [] } = useCategorias()

  const { mutate: categorizarLoteMutate, isPending: pendenteCategorizarLote } = useCategorizarLote()
  const { mutate: classificarIndividualMutate, isPending: pendenteClassificarIndividual } =
    useClassificarIndividual()
  const { mutate: rebaixarLoteMutate, isPending: pendenteRebaixar } = useRebaixarLote()
  const { mutate: apagarLoteMutate, isPending: pendenteApagar } = useApagarLote()
  const { mutate: atualizarMetadataMutate, isPending: pendenteMetadata } = useAtualizarMetadata()
  const { mutate: retentarItemMutate } = useRetentarMediaItem()
  const { mutate: retentarTodosMutate, isPending: pendenteRetentarTodos } = useRetentarTodos()

  const itens = respostaPaginada?.data ?? []
  const total = respostaPaginada?.total ?? 0
  const porPagina = respostaPaginada?.porPagina ?? 12
  const totalPaginas = Math.ceil(total / porPagina) || 1

  const concluidosCount = useMemo(
    () => itens.filter((i) => i.status === 'concluido' || i.status === 'distribuido_local').length,
    [itens]
  )
  const processandoCount = useMemo(
    () =>
      itens.filter((i) =>
        ['baixando', 'recebido', 'em_fila', 'distribuindo', 'enviando_google_fotos'].includes(
          i.status
        )
      ).length,
    [itens]
  )
  const errosCount = useMemo(() => itens.filter((i) => i.status === 'erro').length, [itens])
  const temItensComErro = errosCount > 0

  const porcentagemConcluido = useMemo(() => {
    if (total === 0) return 0
    return Math.round((concluidosCount / Math.max(itens.length, 1)) * 100)
  }, [total, concluidosCount, itens.length])

  const filtrosAtivos = Boolean(busca.trim() || statusFiltro || origemFiltro)

  const handleLimparFiltros = () => {
    setBusca('')
    setStatusFiltro('')
    setOrigemFiltro('')
    setPagina(1)
  }

  const handleToggleSelect = useCallback((uuid: string) => {
    setSelecionados((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    )
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    if (selecionados.length === itens.length) {
      setSelecionados([])
    } else {
      setSelecionados(itens.map((item) => item.uuid))
    }
  }, [selecionados.length, itens])

  const handleLimparSelecao = useCallback(() => {
    setSelecionados([])
  }, [])

  const handleAbrirEditarMetadata = (item: MediaItem) => {
    setItemEditarMetadata(item)
  }

  const handleSalvarMetadata = (input: AtualizarMetadataInput) => {
    if (!itemEditarMetadata) return
    atualizarMetadataMutate(
      {
        uuid: itemEditarMetadata.uuid,
        input,
      },
      {
        onSuccess: () => {
          setItemEditarMetadata(null)
        },
      }
    )
  }

  const handleAbrirCategorizarIndividual = (item: MediaItem) => {
    setCategoriaAlvoUuid(item.uuid)
    setCategoriaSelecionadaId(item.categoriaId || '')
    setModalCategorizarAberto(true)
  }

  const handleAbrirCategorizarLote = () => {
    setCategoriaAlvoUuid(null)
    setCategoriaSelecionadaId('')
    setModalCategorizarAberto(true)
  }

  const handleConfirmarCategorizar = () => {
    if (!categoriaSelecionadaId) return

    if (categoriaAlvoUuid) {
      classificarIndividualMutate(
        {
          uuid: categoriaAlvoUuid,
          categoriaId: categoriaSelecionadaId,
        },
        {
          onSuccess: () => {
            setModalCategorizarAberto(false)
            setCategoriaAlvoUuid(null)
          },
        }
      )
    } else if (selecionados.length > 0) {
      categorizarLoteMutate(
        {
          uuids: selecionados,
          categoriaId: categoriaSelecionadaId,
        },
        {
          onSuccess: () => {
            setModalCategorizarAberto(false)
            setSelecionados([])
          },
        }
      )
    }
  }

  const handleAbrirApagarIndividual = (uuid: string) => {
    setItemApagarAlvo(uuid)
    setModalConfirmarApagar(true)
  }

  const handleAbrirApagarLote = () => {
    setItemApagarAlvo(null)
    setModalConfirmarApagar(true)
  }

  const handleConfirmarApagar = () => {
    const uuidsParaApagar = itemApagarAlvo ? [itemApagarAlvo] : selecionados
    if (uuidsParaApagar.length === 0) return

    apagarLoteMutate(
      { uuids: uuidsParaApagar },
      {
        onSuccess: () => {
          setModalConfirmarApagar(false)
          setItemApagarAlvo(null)
          setSelecionados((prev) => prev.filter((id) => !uuidsParaApagar.includes(id)))
        },
      }
    )
  }

  const handleAbrirRebaixarIndividual = (uuid: string) => {
    setItemRebaixarAlvo(uuid)
    setModalConfirmarRebaixar(true)
  }

  const handleAbrirRebaixarLote = () => {
    setItemRebaixarAlvo(null)
    setModalConfirmarRebaixar(true)
  }

  const handleConfirmarRebaixar = () => {
    const uuidsParaRebaixar = itemRebaixarAlvo ? [itemRebaixarAlvo] : selecionados
    if (uuidsParaRebaixar.length === 0) return

    rebaixarLoteMutate(
      { uuids: uuidsParaRebaixar },
      {
        onSuccess: () => {
          setModalConfirmarRebaixar(false)
          setItemRebaixarAlvo(null)
          setSelecionados((prev) => prev.filter((id) => !uuidsParaRebaixar.includes(id)))
        },
      }
    )
  }

  return (
    <Box w="full" maxW="7xl" mx="auto" py={{ base: 4, md: 6 }} px={{ base: 4, md: 8 }}>
      <VStack w="full" gap={6} alignItems="stretch">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap={4}
          pb={2}
        >
          <VStack gap={1} alignItems="flex-start">
            <HStack gap={3}>
              <Box
                p={2.5}
                borderRadius="lg"
                bg="cirqueira.brand.500/10"
                color="cirqueira.brand.500"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
              >
                <Video size={24} />
              </Box>
              <VStack align="start" gap={0}>
                <Text
                  as="h1"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="bold"
                  color="fg"
                  letterSpacing="tight"
                >
                  Downloads de Vídeo
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  Central de ingestão de mídias de redes sociais e biblioteca inteligente
                </Text>
              </VStack>
            </HStack>
          </VStack>

          <HStack gap={2.5} flexWrap="wrap">
            {temItensComErro && (
              <Button
                size="sm"
                colorPalette="amber"
                variant="subtle"
                disabled={pendenteRetentarTodos}
                onClick={() => retentarTodosMutate()}
                borderRadius="lg"
              >
                {pendenteRetentarTodos ? (
                  <Loader2
                    size={14}
                    style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                  />
                ) : (
                  <RotateCcw size={14} style={{ marginRight: '6px' }} />
                )}
                <Text as="span">Retentar Falhas ({errosCount})</Text>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              disabled={isFetching}
              onClick={() => refetch()}
              borderRadius="lg"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: isFetching ? 'spin 1s linear infinite' : 'none',
                  marginRight: '6px',
                }}
              />
              <Text as="span">Atualizar</Text>
            </Button>
          </HStack>
        </Flex>

        <Grid
          templateColumns={{
            base: '1fr',
            lg: 'repeat(12, 1fr)',
          }}
          gap={4}
          w="full"
          alignItems="stretch"
        >
          <Box gridColumn={{ base: 'span 1', lg: 'span 8' }} display="flex">
            <CampoNovoLink onDownloadIniciado={() => refetch()} />
          </Box>

          <Box gridColumn={{ base: 'span 1', lg: 'span 4' }} display="flex">
            <Card.Root
              borderWidth="1px"
              borderColor="border.subtle"
              bg="bg.panel"
              borderRadius="xl"
              shadow="sm"
              w="full"
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
            >
              <Card.Body p={{ base: 4, md: 5 }}>
                <VStack gap={3.5} align="stretch" h="full" justify="space-between">
                  <Flex align="center" justify="space-between">
                    <HStack gap={2}>
                      <Box
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg={errosCount > 0 ? 'cirqueira.red.500' : 'cirqueira.green.500'}
                      />
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                        color="fg.subtle"
                      >
                        Status do Pipeline
                      </Text>
                    </HStack>

                    <Badge
                      size="xs"
                      variant="subtle"
                      colorPalette={errosCount > 0 ? 'red' : 'green'}
                      borderRadius="md"
                    >
                      {errosCount > 0 ? `${errosCount} com erro` : 'Operacional'}
                    </Badge>
                  </Flex>

                  <Box>
                    <Flex justify="space-between" align="baseline" mb={1.5}>
                      <Text fontSize="2xl" fontWeight="bold" color="fg">
                        {isLoading ? '...' : `${total}`}
                      </Text>
                      <Text fontSize="xs" color="fg.subtle">
                        {porcentagemConcluido}% concluídos
                      </Text>
                    </Flex>

                    <Box w="full" h={2} bg="bg.muted" borderRadius="full" overflow="hidden">
                      <Box
                        h="full"
                        w={`${Math.min(100, Math.max(0, porcentagemConcluido))}%`}
                        bg="cirqueira.brand.500"
                        borderRadius="full"
                        transition="width 0.4s ease"
                      />
                    </Box>
                  </Box>

                  <Grid templateColumns="repeat(3, 1fr)" gap={2} pt={2}>
                    <Box
                      p={2}
                      borderRadius="lg"
                      bg="bg.muted/60"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      textAlign="center"
                    >
                      <HStack gap={1} justify="center" mb={0.5} color="cirqueira.green.500">
                        <CheckCircle2 size={12} />
                        <Text fontSize="10px" fontWeight="semibold" color="fg.subtle">
                          Prontos
                        </Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="bold" color="fg">
                        {concluidosCount}
                      </Text>
                    </Box>

                    <Box
                      p={2}
                      borderRadius="lg"
                      bg="bg.muted/60"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      textAlign="center"
                    >
                      <HStack gap={1} justify="center" mb={0.5} color="cirqueira.blue.500">
                        <Clock size={12} />
                        <Text fontSize="10px" fontWeight="semibold" color="fg.subtle">
                          Fila
                        </Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="bold" color="fg">
                        {processandoCount}
                      </Text>
                    </Box>

                    <Box
                      p={2}
                      borderRadius="lg"
                      bg="bg.muted/60"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      textAlign="center"
                    >
                      <HStack
                        gap={1}
                        justify="center"
                        mb={0.5}
                        color={errosCount > 0 ? 'cirqueira.red.500' : 'fg.subtle'}
                      >
                        <AlertTriangle size={12} />
                        <Text fontSize="10px" fontWeight="semibold" color="fg.subtle">
                          Erros
                        </Text>
                      </HStack>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color={errosCount > 0 ? 'cirqueira.red.500' : 'fg'}
                      >
                        {errosCount}
                      </Text>
                    </Box>
                  </Grid>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>
        </Grid>

        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
          gap={3}
          bg="bg.panel"
          p={3}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          shadow="sm"
        >
          <Box position="relative" flex={1} maxW={{ base: 'full', md: 'md' }}>
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              pointerEvents="none"
              zIndex={2}
              color="fg.subtle"
            >
              <Search size={15} />
            </Box>
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setPagina(1)
              }}
              placeholder="Buscar por título, canal ou hash..."
              bg="bg.muted"
              borderColor="border.subtle"
              fontSize="xs"
              h={9}
              pl={9}
              pr={busca ? 8 : 3}
              borderRadius="lg"
            />
            {busca && (
              <Button
                size="xs"
                variant="ghost"
                position="absolute"
                right={1.5}
                top="50%"
                transform="translateY(-50%)"
                onClick={() => {
                  setBusca('')
                  setPagina(1)
                }}
                p={1}
                borderRadius="lg"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </Button>
            )}
          </Box>

          <HStack gap={2} flexWrap="wrap" justify={{ base: 'stretch', md: 'flex-end' }}>
            <HStack gap={1} fontSize="xs" color="fg.subtle" display={{ base: 'none', lg: 'flex' }}>
              <Filter size={13} />
            </HStack>

            <Box w={{ base: 'full', sm: '44' }}>
              <NativeSelect.Root size="sm" w="full">
                <NativeSelect.Field
                  value={statusFiltro}
                  onChange={(e) => {
                    setStatusFiltro(e.target.value)
                    setPagina(1)
                  }}
                  bg="bg.muted"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  fontSize="xs"
                  h={9}
                >
                  <option value="">Todos os status</option>
                  <option value="baixando">Baixando</option>
                  <option value="recebido">Recebido</option>
                  <option value="em_fila">Em Fila</option>
                  <option value="sem_categoria">Sem Categoria</option>
                  <option value="classificado">Classificado</option>
                  <option value="distribuindo">Distribuindo</option>
                  <option value="distribuido_local">Distribuído</option>
                  <option value="enviando_google_fotos">Google Fotos</option>
                  <option value="concluido">Concluído</option>
                  <option value="erro">Com Erro</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>

            <Box w={{ base: 'full', sm: '40' }}>
              <NativeSelect.Root size="sm" w="full">
                <NativeSelect.Field
                  value={origemFiltro}
                  onChange={(e) => {
                    setOrigemFiltro(e.target.value)
                    setPagina(1)
                  }}
                  bg="bg.muted"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  fontSize="xs"
                  h={9}
                >
                  <option value="">Todas as origens</option>
                  <option value="manual">Manual / Web</option>
                  <option value="bot_telegram">Bot Telegram</option>
                  <option value="print_empresa">Print Empresa</option>
                  <option value="print_pessoal">Print Pessoal</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>

            {filtrosAtivos && (
              <Button
                size="xs"
                variant="ghost"
                onClick={handleLimparFiltros}
                fontSize="xs"
                borderRadius="lg"
                color="fg.subtle"
                _hover={{ color: 'fg' }}
                h={9}
              >
                Limpar
              </Button>
            )}

            <HStack
              gap={1}
              p={0.5}
              bg="bg.muted"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="border.subtle"
            >
              <IconButton
                size="xs"
                variant={modoVisualizacao === 'grid' ? 'subtle' : 'ghost'}
                colorPalette={modoVisualizacao === 'grid' ? 'brand' : 'gray'}
                onClick={() => setModoVisualizacao('grid')}
                aria-label="Visualização em Grid"
                title="Cards em grade"
                borderRadius="md"
              >
                <LayoutGrid size={15} />
              </IconButton>
              <IconButton
                size="xs"
                variant={modoVisualizacao === 'lista' ? 'subtle' : 'ghost'}
                colorPalette={modoVisualizacao === 'lista' ? 'brand' : 'gray'}
                onClick={() => setModoVisualizacao('lista')}
                aria-label="Visualização em Lista"
                title="Tabela detalhada"
                borderRadius="md"
              >
                <List size={15} />
              </IconButton>
            </HStack>
          </HStack>
        </Flex>

        {modoVisualizacao === 'grid' ? (
          <GridVideos
            itens={itens}
            carregando={isLoading}
            selecionados={selecionados}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onVisualizar={(item) => setItemVisualizar(item)}
            onEditarMetadata={handleAbrirEditarMetadata}
            onCategorizar={handleAbrirCategorizarIndividual}
            onRebaixar={handleAbrirRebaixarIndividual}
            onRetentar={(uuid) => retentarItemMutate(uuid)}
            onApagar={handleAbrirApagarIndividual}
          />
        ) : (
          <TabelaVideos
            itens={itens}
            carregando={isLoading}
            selecionados={selecionados}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onVisualizar={(item) => setItemVisualizar(item)}
            onEditarMetadata={handleAbrirEditarMetadata}
            onCategorizar={handleAbrirCategorizarIndividual}
            onRebaixar={handleAbrirRebaixarIndividual}
            onRetentar={(uuid) => retentarItemMutate(uuid)}
            onApagar={handleAbrirApagarIndividual}
          />
        )}

        {total > 0 && (
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align="center"
            justify="space-between"
            gap={4}
            pt={3}
            borderTopWidth="1px"
            borderColor="border.subtle"
          >
            <Text fontSize="xs" color="fg.subtle">
              Mostrando {itens.length} de {total} registros (Página {pagina} de {totalPaginas})
            </Text>

            <HStack gap={2}>
              <Button
                size="sm"
                variant="outline"
                disabled={pagina <= 1 || isFetching}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                borderRadius="lg"
              >
                <ChevronLeft size={16} style={{ marginRight: '4px' }} />
                <Text as="span">Anterior</Text>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={pagina >= totalPaginas || isFetching}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                borderRadius="lg"
              >
                <Text as="span">Próxima</Text>
                <ChevronRight size={16} style={{ marginLeft: '4px' }} />
              </Button>
            </HStack>
          </Flex>
        )}

        <BarraAcoesEmLote
          totalSelecionados={selecionados.length}
          selecionados={selecionados}
          onLimparSelecao={handleLimparSelecao}
          onCategorizarLote={handleAbrirCategorizarLote}
          onRebaixarLote={handleAbrirRebaixarLote}
          onApagarLote={handleAbrirApagarLote}
          processando={pendenteCategorizarLote || pendenteRebaixar || pendenteApagar}
        />

        <ModalEditarMetadata
          item={itemEditarMetadata}
          aberto={Boolean(itemEditarMetadata)}
          onFechar={() => setItemEditarMetadata(null)}
          onSalvar={handleSalvarMetadata}
          pendente={pendenteMetadata}
        />

        <Dialog.Root
          open={modalCategorizarAberto}
          onOpenChange={(e) => setModalCategorizarAberto(e.open)}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border.subtle"
              color="fg"
              borderRadius="xl"
              p={5}
              maxW="md"
            >
              <Dialog.Header p={0} mb={3}>
                <Dialog.Title fontSize="md" fontWeight="bold">
                  {categoriaAlvoUuid
                    ? 'Categorizar Vídeo'
                    : `Categorizar ${selecionados.length} Itens`}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body p={0} py={2}>
                <VStack gap={4} alignItems="stretch">
                  <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
                    Selecione a Categoria de Destino
                  </Text>
                  <NativeSelect.Root size="md" w="full">
                    <NativeSelect.Field
                      value={categoriaSelecionadaId}
                      onChange={(e) => setCategoriaSelecionadaId(e.target.value)}
                      bg="bg.muted"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      fontSize="xs"
                      h={10}
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categorias.map((cat) => (
                        <option key={cat.uuid} value={cat.uuid}>
                          {cat.nome} {cat.googlePhotosAlbumId ? '☁️ (Google Fotos)' : '📁 (Local)'}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>

                  <HStack
                    justify="flex-end"
                    gap={2}
                    pt={3}
                    borderTopWidth="1px"
                    borderColor="border.subtle"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setModalCategorizarAberto(false)}
                      borderRadius="lg"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="brand"
                      disabled={
                        !categoriaSelecionadaId ||
                        pendenteCategorizarLote ||
                        pendenteClassificarIndividual
                      }
                      onClick={handleConfirmarCategorizar}
                      fontWeight="semibold"
                      borderRadius="lg"
                    >
                      {(pendenteCategorizarLote || pendenteClassificarIndividual) && (
                        <Loader2
                          size={14}
                          style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                        />
                      )}
                      <Text as="span">Confirmar Categoria</Text>
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        <Dialog.Root
          open={modalConfirmarApagar}
          onOpenChange={(e) => setModalConfirmarApagar(e.open)}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border.subtle"
              color="fg"
              borderRadius="xl"
              p={5}
              maxW="md"
            >
              <Dialog.Header p={0} mb={3}>
                <Dialog.Title fontSize="md" fontWeight="bold">
                  Confirmar Exclusão
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body p={0} py={2}>
                <VStack gap={4} alignItems="stretch">
                  <Text fontSize="xs" color="fg.subtle">
                    Tem certeza que deseja apagar{' '}
                    <Text as="strong" color="fg">
                      {itemApagarAlvo
                        ? 'este arquivo'
                        : `${selecionados.length} arquivos selecionados`}
                    </Text>
                    ? Esta ação removerá o arquivo físico e o registro do banco.
                  </Text>

                  <HStack
                    justify="flex-end"
                    gap={2}
                    pt={3}
                    borderTopWidth="1px"
                    borderColor="border.subtle"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setModalConfirmarApagar(false)}
                      borderRadius="lg"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="red"
                      disabled={pendenteApagar}
                      onClick={handleConfirmarApagar}
                      fontWeight="semibold"
                      borderRadius="lg"
                    >
                      {pendenteApagar && (
                        <Loader2
                          size={14}
                          style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                        />
                      )}
                      <Text as="span">Sim, Apagar</Text>
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        <Dialog.Root
          open={modalConfirmarRebaixar}
          onOpenChange={(e) => setModalConfirmarRebaixar(e.open)}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border.subtle"
              color="fg"
              borderRadius="xl"
              p={5}
              maxW="md"
            >
              <Dialog.Header p={0} mb={3}>
                <Dialog.Title fontSize="md" fontWeight="bold">
                  Rebaixar Vídeo(s)
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body p={0} py={2}>
                <VStack gap={4} alignItems="stretch">
                  <Text fontSize="xs" color="fg.subtle">
                    O download será reenfileirado a partir da URL original gravada nos metadados.
                  </Text>

                  <HStack
                    justify="flex-end"
                    gap={2}
                    pt={3}
                    borderTopWidth="1px"
                    borderColor="border.subtle"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setModalConfirmarRebaixar(false)}
                      borderRadius="lg"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      disabled={pendenteRebaixar}
                      onClick={handleConfirmarRebaixar}
                      fontWeight="semibold"
                      borderRadius="lg"
                    >
                      {pendenteRebaixar && (
                        <Loader2
                          size={14}
                          style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                        />
                      )}
                      <Text as="span">Confirmar Rebaixamento</Text>
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        <ModalVisualizarMidia
          item={itemVisualizar}
          aberto={Boolean(itemVisualizar)}
          onFechar={() => setItemVisualizar(null)}
          onCategorizar={handleAbrirCategorizarIndividual}
          onEditarMetadata={handleAbrirEditarMetadata}
        />
      </VStack>
    </Box>
  )
}

export { DownloadsVideo as Component }
