import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { ModalDistribuirHorariosLote } from './components/ModalDistribuirHorariosLote'
import { ModalEditarMetadata } from './components/ModalEditarMetadata'
import { ModalVisualizarMidia } from './components/ModalVisualizarMidia'
import { TabelaVideos } from './components/TabelaVideos'
import { useSEO } from '@/shared/hooks'
import {
  useApagarLote,
  useAtualizarMetadata,
  useCategorias,
  useCategorizarLote,
  useClassificarIndividual,
  useDistribuirHorariosLote,
  useForcarGoogleFotos,
  useMediaItens,
  useRebaixarLote,
  useRetentarMediaItem,
  useRetentarTodos,
} from './hooks/useDownloadsVideo'
import type {
  AtualizarMetadataInput,
  FiltrosMediaItem,
  ItemDistribuicaoHorario,
  MediaItem,
} from './types'

export default function DownloadsVideo() {
  useSEO({
    title: 'Downloads de Vídeos',
    description: 'Gerencie e monitore os downloads de vídeos sociais, metadados enriquecidos, categorias e status de sincronização.',
    keywords: 'downloads de videos, tiktok, twitter, instagram, youtube, cirqueirax',
  })

  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string>('')
  const [origemFiltro, setOrigemFiltro] = useState<string>('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [porPagina, setPorPagina] = useState<number>(50)
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'lista'>('grid')

  const [itemVisualizar, setItemVisualizar] = useState<MediaItem | null>(null)
  const [itemEditarMetadata, setItemEditarMetadata] = useState<MediaItem | null>(null)
  const [abaInicialEditarMetadata, setAbaInicialEditarMetadata] = useState<
    'geral' | 'data' | 'duracao' | 'capa'
  >('geral')

  const [modalDistribuirAberto, setModalDistribuirAberto] = useState(false)
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
      porPagina,
      tipo: 'video',
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
    if (categoriaFiltro) {
      obj.categoriaId = categoriaFiltro
    }
    return obj
  }, [pagina, porPagina, busca, statusFiltro, origemFiltro, categoriaFiltro])

  const { data: respostaPaginada, isLoading, isFetching, refetch } = useMediaItens(filtros)
  const { data: categorias = [] } = useCategorias()

  const { mutate: categorizarLoteMutate, isPending: pendenteCategorizarLote } = useCategorizarLote()
  const { mutate: classificarIndividualMutate, isPending: pendenteClassificarIndividual } =
    useClassificarIndividual()
  const { mutate: rebaixarLoteMutate, isPending: pendenteRebaixar } = useRebaixarLote()
  const { mutate: apagarLoteMutate, isPending: pendenteApagar } = useApagarLote()
  const { mutate: atualizarMetadataMutate, isPending: pendenteMetadata } = useAtualizarMetadata()
  const { mutate: distribuirHorariosMutate, isPending: pendenteDistribuir } =
    useDistribuirHorariosLote()
  const { mutate: retentarItemMutate } = useRetentarMediaItem()
  const { mutate: retentarTodosMutate, isPending: pendenteRetentarTodos } = useRetentarTodos()
  const { mutate: forcarGoogleFotosMutate } = useForcarGoogleFotos()

  const handleForcarGoogleFotos = useCallback(
    (item: MediaItem) => {
      forcarGoogleFotosMutate({ uuid: item.uuid, categoriaId: item.categoriaId ?? undefined })
    },
    [forcarGoogleFotosMutate]
  )

  const itens = respostaPaginada?.data ?? []
  const total = respostaPaginada?.total ?? 0
  const limitePorPagina = respostaPaginada?.porPagina ?? porPagina
  const totalPaginas = Math.ceil(total / limitePorPagina) || 1

  const itensSelecionados = useMemo(
    () => itens.filter((i) => selecionados.includes(i.uuid)),
    [itens, selecionados]
  )

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
  const filtrosAtivos = Boolean(busca.trim() || statusFiltro || origemFiltro || categoriaFiltro)

  const handleLimparFiltros = () => {
    setBusca('')
    setStatusFiltro('')
    setOrigemFiltro('')
    setCategoriaFiltro('')
    setPagina(1)
  }

  const handleFiltrarRapidoStatus = (status: string) => {
    setStatusFiltro((prev) => (prev === status ? '' : status))
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

  const handleAbrirEditarMetadata = (
    item: MediaItem,
    aba: 'geral' | 'data' | 'duracao' | 'capa' = 'geral'
  ) => {
    setItemEditarMetadata(item)
    setAbaInicialEditarMetadata(aba)
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

  const handleSalvarDistribuicaoLote = (itensDistribuicao: ItemDistribuicaoHorario[]) => {
    distribuirHorariosMutate(
      { itens: itensDistribuicao },
      {
        onSuccess: () => {
          setModalDistribuirAberto(false)
          setSelecionados([])
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
    <Box w="full" maxW="1680px" mx="auto" py={{ base: 4, md: 6 }} px={{ base: 3, md: 6 }}>
      <VStack w="full" gap={6} alignItems="stretch">
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', sm: 'center' }}
          gap={4}
        >
          <VStack align="start" gap={1}>
            <HStack gap={2.5} align="center" flexWrap="wrap">
              <Box
                p={2}
                borderRadius="xl"
                bg="cirqueira.brand.500/15"
                color="cirqueira.brand.400"
                display="inline-flex"
              >
                <Video size={22} strokeWidth={2.2} />
              </Box>
              <Text as="h1" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black" color="fg">
                Downloads de Vídeo
              </Text>
              <HStack gap={1.5} pl={1}>
                <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="md">
                  {total} {total === 1 ? 'mídia' : 'mídias'}
                </Badge>
                {concluidosCount > 0 && (
                  <Badge size="sm" variant="subtle" colorPalette="green" borderRadius="md">
                    {concluidosCount} prontas
                  </Badge>
                )}
                {processandoCount > 0 && (
                  <Badge size="sm" variant="subtle" colorPalette="blue" borderRadius="md">
                    {processandoCount} na fila
                  </Badge>
                )}
                {errosCount > 0 && (
                  <Badge size="sm" variant="subtle" colorPalette="red" borderRadius="md">
                    {errosCount} erros
                  </Badge>
                )}
              </HStack>
            </HStack>
            <Text fontSize="xs" color="fg.subtle">
              Downloads inteligentes com extração de metadados, corte e sincronização com Google Fotos
            </Text>
          </VStack>

          <HStack gap={2} flexWrap="wrap">
            <HStack
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border.subtle"
              px={3}
              py={1.5}
              borderRadius="lg"
              fontSize="xs"
              color="fg.subtle"
              display={{ base: 'none', md: 'flex' }}
            >
              <Box w={2} h={2} borderRadius="full" bg="cirqueira.green.500" />
              <Text as="span">Motor yt-dlp • Pipeline Ativo</Text>
              <Box as="span" color="cirqueira.green.500" display="inline-flex">
                <CheckCircle2 size={11} color="currentColor" />
              </Box>
            </HStack>

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
                <Text as="span">Retentar Falhas</Text>
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
              <Text as="span" display={{ base: 'none', sm: 'inline' }}>
                {isFetching ? 'Atualizando...' : 'Atualizar'}
              </Text>
            </Button>
          </HStack>
        </Flex>

        <CampoNovoLink onDownloadIniciado={() => refetch()} />

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
        >
          <HStack gap={2} flex={1} flexWrap="wrap">
            <Box position="relative" flex={1} minW={{ base: 'full', sm: '220px' }} maxW={{ base: 'full', md: '360px' }}>
              <Box
                position="absolute"
                left={3}
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
                zIndex={2}
                color="fg.subtle"
              >
                <Search size={14} />
              </Box>
              <Input
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setPagina(1)
                }}
                placeholder="Buscar por título ou canal..."
                bg="bg.muted"
                borderColor="border.subtle"
                fontSize="xs"
                h={9}
                pl={8}
                pr={busca ? 7 : 3}
                borderRadius="lg"
              />
              {busca && (
                <Button
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  right={1}
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={() => {
                    setBusca('')
                    setPagina(1)
                  }}
                  p={0.5}
                  borderRadius="lg"
                  aria-label="Limpar busca"
                >
                  <X size={13} />
                </Button>
              )}
            </Box>

            <Box w={{ base: 'full', sm: '44' }}>
              <NativeSelect.Root size="sm" w="full">
                <NativeSelect.Field
                  value={categoriaFiltro}
                  onChange={(e) => {
                    setCategoriaFiltro(e.target.value)
                    setPagina(1)
                  }}
                  bg="bg.muted"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  fontSize="xs"
                  h={9}
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map((cat) => (
                    <option key={cat.uuid} value={cat.uuid}>
                      {cat.nome}
                    </option>
                  ))}
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
                  <option value="download">Download de Vídeo</option>
                  <option value="bot_telegram">Bot Telegram</option>
                  <option value="manual">Upload Manual (Vídeo)</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>

            <HStack gap={1} display={{ base: 'none', xl: 'flex' }}>
              <Button
                size="xs"
                variant={statusFiltro === '' ? 'solid' : 'ghost'}
                colorPalette={statusFiltro === '' ? 'brand' : 'gray'}
                onClick={() => handleFiltrarRapidoStatus('')}
                borderRadius="md"
                fontSize="xs"
                h={8}
                px={3}
              >
                Todos
              </Button>
              <Button
                size="xs"
                variant={statusFiltro === 'concluido' ? 'solid' : 'ghost'}
                colorPalette={statusFiltro === 'concluido' ? 'brand' : 'gray'}
                onClick={() => handleFiltrarRapidoStatus('concluido')}
                borderRadius="md"
                fontSize="xs"
                h={8}
                px={3}
              >
                Concluídos
              </Button>
              <Button
                size="xs"
                variant={statusFiltro === 'baixando' ? 'solid' : 'ghost'}
                colorPalette={statusFiltro === 'baixando' ? 'brand' : 'gray'}
                onClick={() => handleFiltrarRapidoStatus('baixando')}
                borderRadius="md"
                fontSize="xs"
                h={8}
                px={3}
              >
                Baixando
              </Button>
              <Button
                size="xs"
                variant={statusFiltro === 'erro' ? 'solid' : 'ghost'}
                colorPalette={statusFiltro === 'erro' ? 'red' : 'gray'}
                onClick={() => handleFiltrarRapidoStatus('erro')}
                borderRadius="md"
                fontSize="xs"
                h={8}
                px={3}
              >
                Com Erro
              </Button>
              <Button
                size="xs"
                variant={statusFiltro === 'arquivo_removido' || statusFiltro === 'arquivo_expurgado' ? 'solid' : 'ghost'}
                colorPalette={statusFiltro === 'arquivo_removido' || statusFiltro === 'arquivo_expurgado' ? 'orange' : 'gray'}
                onClick={() => handleFiltrarRapidoStatus('arquivo_removido')}
                borderRadius="md"
                fontSize="xs"
                h={8}
                px={3}
              >
                Arquivo Removido
              </Button>
            </HStack>

            <Box w={{ base: 'full', sm: '36' }} display={{ base: 'block', xl: 'none' }}>
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
                  <option value="concluido">Concluídos</option>
                  <option value="arquivo_removido">Arquivo Removido</option>
                  <option value="baixando">Baixando</option>
                  <option value="em_fila">Em Fila</option>
                  <option value="erro">Com Erro</option>
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
                <X size={13} style={{ marginRight: '4px' }} />
                Limpar
              </Button>
            )}
          </HStack>

          <HStack gap={1}>
            <IconButton
              size="sm"
              variant={modoVisualizacao === 'grid' ? 'subtle' : 'ghost'}
              colorPalette={modoVisualizacao === 'grid' ? 'brand' : 'gray'}
              onClick={() => setModoVisualizacao('grid')}
              aria-label="Grade"
              title="Visualização em Grade"
              borderRadius="lg"
            >
              <LayoutGrid size={16} />
            </IconButton>
            <IconButton
              size="sm"
              variant={modoVisualizacao === 'lista' ? 'subtle' : 'ghost'}
              colorPalette={modoVisualizacao === 'lista' ? 'brand' : 'gray'}
              onClick={() => setModoVisualizacao('lista')}
              aria-label="Lista"
              title="Visualização em Lista"
              borderRadius="lg"
            >
              <List size={16} />
            </IconButton>
          </HStack>
        </Flex>

        <Box
          key={`${modoVisualizacao}-${statusFiltro}-${origemFiltro}-${categoriaFiltro}-${pagina}`}
          className="tab-pane-fade"
          w="full"
        >
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
              onForcarGoogleFotos={handleForcarGoogleFotos}
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
              onForcarGoogleFotos={handleForcarGoogleFotos}
            />
          )}
        </Box>

        {total > 0 && (
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align="center"
            justify="space-between"
            gap={4}
            pt={3}
            borderTopWidth="1px"
            borderColor="border.subtle"
            flexWrap="wrap"
          >
            <HStack gap={4} align="center" flexWrap="wrap">
              <Text fontSize="xs" color="fg.subtle">
                Mostrando {itens.length} de {total} registros (Página {pagina} de {totalPaginas})
              </Text>

              <HStack gap={1} align="center">
                <Text fontSize="xs" color="fg.subtle">
                  Por página:
                </Text>
                {[25, 50, 100].map((qtd) => (
                  <Button
                    key={qtd}
                    size="xs"
                    variant={porPagina === qtd ? 'solid' : 'ghost'}
                    colorPalette={porPagina === qtd ? 'brand' : undefined}
                    onClick={() => {
                      setPorPagina(qtd)
                      setPagina(1)
                    }}
                    borderRadius="md"
                    h={6}
                    px={2}
                    fontSize="xs"
                  >
                    {qtd}
                  </Button>
                ))}
              </HStack>
            </HStack>

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
          onDistribuirHorariosLote={() => setModalDistribuirAberto(true)}
          onCategorizarLote={handleAbrirCategorizarLote}
          onRebaixarLote={handleAbrirRebaixarLote}
          onApagarLote={handleAbrirApagarLote}
          processando={
            pendenteCategorizarLote || pendenteRebaixar || pendenteApagar || pendenteDistribuir
          }
        />

        <ModalDistribuirHorariosLote
          aberto={modalDistribuirAberto}
          itens={itensSelecionados}
          onFechar={() => setModalDistribuirAberto(false)}
          onSalvar={handleSalvarDistribuicaoLote}
          pendente={pendenteDistribuir}
        />

        <ModalEditarMetadata
          item={itemEditarMetadata}
          aberto={Boolean(itemEditarMetadata)}
          onFechar={() => setItemEditarMetadata(null)}
          onSalvar={handleSalvarMetadata}
          pendente={pendenteMetadata}
          abaInicial={abaInicialEditarMetadata}
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
                    O download do arquivo de vídeo será reenfileirado a partir da URL original gravada nos metadados. Todas as datas alteradas, categorias e metadados existentes serão rigorosamente preservados, sem reenviar para o Google Fotos se já sincronizado.
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
