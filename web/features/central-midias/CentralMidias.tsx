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
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  FolderPlus,
  Layers,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { GridCentralMidias } from './components/GridCentralMidias'
import { ModalCategorizarMidia } from './components/ModalCategorizarMidia'
import { ModalVisualizarMidiaCentral } from './components/ModalVisualizarMidiaCentral'
import { TabelaCentralMidias } from './components/TabelaCentralMidias'
import {
  useApagarLoteMidias,
  useApagarMidia,
  useCategorias,
  useCategorizarLoteMidias,
  useCategorizarMidia,
  useCentralMidias,
  useContagensMidias,
} from './hooks/useCentralMidias'
import type { FiltrosCentralMidias, MediaItem } from './types'

const CentralMidias = memo(function CentralMidias() {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(60)
  const [busca, setBusca] = useState('')
  const [origemFiltro, setOrigemFiltro] = useState<string>('todas')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('')
  const [statusFiltro, setStatusFiltro] = useState<string>('todos')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'tabela'>('grid')

  const [itemVisualizar, setItemVisualizar] = useState<MediaItem | null>(null)
  const [modalCategorizarAberto, setModalCategorizarAberto] = useState(false)
  const [itemCategorizarAlvo, setItemCategorizarAlvo] = useState<MediaItem | null>(null)
  const [modalConfirmarApagar, setModalConfirmarApagar] = useState(false)
  const [itemApagarAlvo, setItemApagarAlvo] = useState<string | null>(null)

  const filtros = useMemo<FiltrosCentralMidias>(() => {
    const obj: FiltrosCentralMidias = {
      pagina,
      porPagina,
      ordenacao: 'criadoEm',
      direcao: 'DESC',
    }

    if (busca.trim()) {
      obj.busca = busca.trim()
    }
    if (origemFiltro !== 'todas') {
      obj.origem = origemFiltro
    }
    if (tipoFiltro !== 'todos') {
      obj.tipo = tipoFiltro
    }
    if (categoriaFiltro) {
      obj.categoriaId = categoriaFiltro
    }
    if (statusFiltro !== 'todos') {
      obj.status = statusFiltro
    }

    return obj
  }, [pagina, porPagina, busca, origemFiltro, tipoFiltro, categoriaFiltro, statusFiltro])

  const { data: respostaPaginada, isLoading, isFetching, refetch } = useCentralMidias(filtros)
  const { data: contagens } = useContagensMidias()
  const { data: categorias = [] } = useCategorias()

  const { mutate: categorizarMidiaMutate } = useCategorizarMidia()
  const { mutate: categorizarLoteMutate } = useCategorizarLoteMidias()
  const { mutate: apagarMidiaMutate } = useApagarMidia()
  const { mutate: apagarLoteMutate, isPending: pendenteApagarLote } = useApagarLoteMidias()

  const itens = respostaPaginada?.data ?? []
  const total = respostaPaginada?.total ?? 0
  const limitePorPagina = respostaPaginada?.porPagina ?? porPagina
  const totalPaginas = Math.ceil(total / limitePorPagina) || 1

  const handleToggleSelect = useCallback((uuid: string) => {
    setSelecionados((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    )
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    setSelecionados((prev) => {
      const todosJaSelecionados = itens.length > 0 && itens.every((it) => prev.includes(it.uuid))
      if (todosJaSelecionados) {
        return prev.filter((id) => !itens.some((it) => it.uuid === id))
      }
      const novos = itens.map((it) => it.uuid)
      return Array.from(new Set([...prev, ...novos]))
    })
  }, [itens])

  const handleLimparFiltros = () => {
    setBusca('')
    setOrigemFiltro('todas')
    setTipoFiltro('todos')
    setCategoriaFiltro('')
    setStatusFiltro('todos')
    setPagina(1)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        handleToggleSelectAll()
        return
      }

      if (selecionados.length > 0 && /^[1-9]$/.test(e.key)) {
        const index = Number(e.key) - 1
        const categoriaAlvo = categorias[index]
        if (categoriaAlvo) {
          e.preventDefault()
          categorizarLoteMutate({ uuids: selecionados, categoriaId: categoriaAlvo.uuid })
          setSelecionados([])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selecionados, categorias, categorizarLoteMutate, handleToggleSelectAll])

  const handleConfirmarCategorizar = (catId: string) => {
    if (itemCategorizarAlvo) {
      categorizarMidiaMutate({ uuid: itemCategorizarAlvo.uuid, categoriaId: catId })
      setItemCategorizarAlvo(null)
    } else if (selecionados.length > 0) {
      categorizarLoteMutate({ uuids: selecionados, categoriaId: catId })
      setSelecionados([])
    }
  }

  const handleConfirmarApagar = () => {
    if (itemApagarAlvo) {
      apagarMidiaMutate(itemApagarAlvo)
      setItemApagarAlvo(null)
    } else if (selecionados.length > 0) {
      apagarLoteMutate(selecionados)
      setSelecionados([])
    }
    setModalConfirmarApagar(false)
  }

  const filtrosAtivos = Boolean(
    busca.trim() ||
      origemFiltro !== 'todas' ||
      tipoFiltro !== 'todos' ||
      categoriaFiltro ||
      statusFiltro !== 'todos'
  )

  const origensAbas = useMemo(
    () => [
      {
        value: 'todas',
        label: 'Todas as Mídias',
        icon: Layers,
        count: contagens?.total ?? total,
      },
      {
        value: 'manual',
        label: 'Upload Manual',
        icon: UploadCloud,
        count: contagens?.manual,
      },
      {
        value: 'downloads',
        label: 'Downloads Redes',
        icon: DownloadCloud,
        count: contagens?.downloads,
      },
      {
        value: 'prints',
        label: 'Prints & Capturas',
        icon: Camera,
        count: contagens?.prints,
      },
    ],
    [contagens, total]
  )

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
            <HStack gap={2.5} align="center">
              <Box
                p={2}
                borderRadius="xl"
                bg="cirqueira.brand.500/15"
                color="cirqueira.brand.400"
                display="inline-flex"
              >
                <Layers size={22} strokeWidth={2.2} />
              </Box>
              <Text as="h1" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black" color="fg">
                Central de Mídias
              </Text>
              <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="md">
                {total} {total === 1 ? 'mídia' : 'mídias'}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="fg.subtle">
              Galeria unificada com todas as fotos, vídeos de redes sociais, uploads manuais e prints do agente.
            </Text>
          </VStack>

          <HStack gap={2} flexWrap="wrap" alignSelf={{ base: 'flex-start', sm: 'center' }}>
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

        <VStack
          w="full"
          bg="bg.panel"
          p={3.5}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="border.subtle"
          gap={3}
          align="stretch"
        >
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', lg: 'center' }}
            gap={3}
          >
            <HStack gap={1.5} bg="bg.muted" p={1} borderRadius="xl" overflowX="auto" maxW="full">
              {origensAbas.map((aba) => {
                const Icone = aba.icon
                const ativo = origemFiltro === aba.value

                return (
                  <Button
                    key={aba.value}
                    size="sm"
                    variant={ativo ? 'solid' : 'ghost'}
                    colorPalette={ativo ? 'brand' : undefined}
                    onClick={() => {
                      setOrigemFiltro(aba.value)
                      setPagina(1)
                    }}
                    fontWeight="semibold"
                    borderRadius="lg"
                    px={3.5}
                    h="36px"
                    minH="36px"
                    flexShrink={0}
                  >
                    <HStack gap={2} align="center">
                      <Icone size={14} />
                      <Text as="span" fontSize="xs">{aba.label}</Text>
                      {typeof aba.count === 'number' && (
                        <Badge
                          size="xs"
                          variant="solid"
                          bg={ativo ? 'cirqueira.grey.950/30' : 'bg.panel'}
                          color={ativo ? 'cirqueira.grey.0' : 'fg.subtle'}
                          borderWidth={ativo ? '0px' : '1px'}
                          borderColor="border.subtle"
                          borderRadius="full"
                          px={2}
                          py={0.5}
                          fontSize="10px"
                          fontWeight="bold"
                          lineHeight="1"
                        >
                          {aba.count}
                        </Badge>
                      )}
                    </HStack>
                  </Button>
                )
              })}
            </HStack>

            <HStack gap={1} bg="bg.muted" p={1} borderRadius="xl" borderWidth="1px" borderColor="border.subtle" alignSelf={{ base: 'flex-start', lg: 'center' }} flexShrink={0}>
              <IconButton
                size="sm"
                variant={modoVisualizacao === 'grid' ? 'solid' : 'ghost'}
                colorPalette={modoVisualizacao === 'grid' ? 'brand' : undefined}
                onClick={() => setModoVisualizacao('grid')}
                aria-label="Grade Estilo Google Fotos"
                title="Grade Estilo Google Fotos"
                borderRadius="lg"
                h="36px"
                w="36px"
              >
                <LayoutGrid size={16} />
              </IconButton>
              <IconButton
                size="sm"
                variant={modoVisualizacao === 'tabela' ? 'solid' : 'ghost'}
                colorPalette={modoVisualizacao === 'tabela' ? 'brand' : undefined}
                onClick={() => setModoVisualizacao('tabela')}
                aria-label="Tabela Compacta"
                title="Tabela Compacta"
                borderRadius="lg"
                h="36px"
                w="36px"
              >
                <List size={16} />
              </IconButton>
            </HStack>
          </Flex>

          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={2.5}
            flexWrap="wrap"
          >
            <HStack gap={2} flexWrap="wrap" flex={1}>
              <NativeSelect.Root size="sm" w={{ base: 'full', sm: '130px' }}>
                <NativeSelect.Field
                  value={tipoFiltro}
                  onChange={(e) => {
                    setTipoFiltro(e.target.value)
                    setPagina(1)
                  }}
                  bg="bg.muted"
                  borderColor="border.subtle"
                  borderRadius="xl"
                  fontSize="xs"
                  h={8}
                >
                  <option value="todos">Todos Tipos</option>
                  <option value="imagem">Apenas Fotos</option>
                  <option value="video">Apenas Vídeos</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>

              <NativeSelect.Root size="sm" w={{ base: 'full', sm: '180px' }}>
                <NativeSelect.Field
                  value={categoriaFiltro}
                  onChange={(e) => {
                    setCategoriaFiltro(e.target.value)
                    setPagina(1)
                  }}
                  bg="bg.muted"
                  borderColor="border.subtle"
                  borderRadius="xl"
                  fontSize="xs"
                  h={8}
                >
                  <option value="">Todas as Categorias</option>
                  <option value="sem_categoria">Sem Categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat.uuid} value={cat.uuid}>
                      {cat.nome}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>

              <NativeSelect.Root size="sm" w={{ base: 'full', sm: '140px' }}>
                <NativeSelect.Field
                  value={statusFiltro}
                  onChange={(e) => {
                    setStatusFiltro(e.target.value)
                    setPagina(1)
                  }}
                  bg="bg.muted"
                  borderColor="border.subtle"
                  borderRadius="xl"
                  fontSize="xs"
                  h={8}
                >
                  <option value="todos">Todos Status</option>
                  <option value="classificado">Classificados</option>
                  <option value="sem_categoria">Sem Categoria</option>
                  <option value="arquivo_expurgado">Espaço Liberado</option>
                  <option value="erro">Com Erro</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </HStack>

            <Box position="relative" w={{ base: 'full', md: '250px' }}>
              <Box
                position="absolute"
                left={2.5}
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
                zIndex={2}
                color="fg.subtle"
              >
                <Search size={13} />
              </Box>
              <Input
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setPagina(1)
                }}
                placeholder="Buscar título, arquivo, hash..."
                bg="bg.muted"
                borderColor="border.subtle"
                fontSize="xs"
                h={8}
                pl={8}
                pr={busca ? 7 : 3}
                borderRadius="xl"
              />
              {busca && (
                <Box
                  position="absolute"
                  right={2}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                  cursor="pointer"
                  onClick={() => setBusca('')}
                  color="fg.subtle"
                  _hover={{ color: 'fg' }}
                >
                  <X size={13} />
                </Box>
              )}
            </Box>
          </Flex>
        </VStack>

        <Box key={`${modoVisualizacao}-${origemFiltro}-${pagina}`} className="tab-pane-fade" w="full">
          {modoVisualizacao === 'grid' ? (
            <GridCentralMidias
              itens={itens}
              carregando={isLoading}
              selecionados={selecionados}
              onToggleSelect={handleToggleSelect}
              onVisualizar={(it) => setItemVisualizar(it)}
              onCategorizar={(it) => {
                setItemCategorizarAlvo(it)
                setModalCategorizarAberto(true)
              }}
              onApagar={(uuid) => {
                setItemApagarAlvo(uuid)
                setModalConfirmarApagar(true)
              }}
              onLimparFiltros={handleLimparFiltros}
              temFiltrosAtivos={filtrosAtivos}
            />
          ) : (
            <TabelaCentralMidias
              itens={itens}
              carregando={isLoading}
              selecionados={selecionados}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onVisualizar={(it) => setItemVisualizar(it)}
              onCategorizar={(it) => {
                setItemCategorizarAlvo(it)
                setModalCategorizarAberto(true)
              }}
              onApagar={(uuid) => {
                setItemApagarAlvo(uuid)
                setModalConfirmarApagar(true)
              }}
            />
          )}
        </Box>

        <Flex
          justify="space-between"
          align="center"
          pt={4}
          pb={4}
          borderTopWidth="1px"
          borderColor="border.subtle"
          flexWrap="wrap"
          gap={3}
        >
          <HStack gap={3} flexWrap="wrap">
            <Text fontSize="xs" color="fg.subtle">
              Exibindo <Text as="span" fontWeight="bold" color="fg">{itens.length}</Text> de{' '}
              <Text as="span" fontWeight="bold" color="fg">{total}</Text> mídias
            </Text>

            <HStack gap={1} align="center">
              <Text fontSize="xs" color="fg.subtle">
                Por página:
              </Text>
              {[30, 60, 100].map((qtd) => (
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

          {totalPaginas > 1 && (
            <HStack gap={2}>
              <Button
                size="sm"
                variant="outline"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                borderRadius="lg"
              >
                <ChevronLeft size={14} style={{ marginRight: '4px' }} />
                Anterior
              </Button>

              <Text fontSize="xs" fontWeight="semibold" px={2}>
                Página {pagina} de {totalPaginas}
              </Text>

              <Button
                size="sm"
                variant="outline"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                borderRadius="lg"
              >
                Próxima
                <ChevronRight size={14} style={{ marginLeft: '4px' }} />
              </Button>
            </HStack>
          )}
        </Flex>
      </VStack>

      <ModalVisualizarMidiaCentral
        aberto={Boolean(itemVisualizar)}
        item={itemVisualizar}
        categorias={categorias}
        onFechar={() => setItemVisualizar(null)}
        onClassificar={(uuid, categoriaId) => {
          categorizarMidiaMutate({ uuid, categoriaId })
          if (itemVisualizar) {
            setItemVisualizar({
              ...itemVisualizar,
              categoriaId,
              categoria: categorias.find((c) => c.uuid === categoriaId) ?? null,
            })
          }
        }}
      />

      <ModalCategorizarMidia
        aberto={modalCategorizarAberto}
        quantidade={itemCategorizarAlvo ? 1 : selecionados.length}
        categorias={categorias}
        onFechar={() => {
          setModalCategorizarAberto(false)
          setItemCategorizarAlvo(null)
        }}
        onConfirmar={handleConfirmarCategorizar}
      />

      {selecionados.length > 0 && (
        <Box
          position="fixed"
          bottom={6}
          left="50%"
          transform="translateX(-50%)"
          zIndex={50}
          w="92%"
          maxW="xl"
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
            gap={3}
            p={3}
            px={5}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="cirqueira.brand.500/40"
            bg="bg.panel"
            backdropFilter="blur(20px)"
            shadow="2xl"
          >
            <HStack gap={2}>
              <Badge colorPalette="brand" px={2.5} py={1} borderRadius="lg" fontWeight="bold">
                {selecionados.length}
              </Badge>
              <Text as="span" fontSize="xs" fontWeight="semibold" color="fg">
                mídia(s) selecionada(s)
              </Text>
            </HStack>

            <HStack gap={1.5} flexWrap="wrap" justify="center">
              <Text as="span" fontSize="11px" color="fg.subtle" fontWeight="medium" display={{ base: 'none', lg: 'inline' }}>
                Atribuir:
              </Text>
              {categorias.slice(0, 3).map((cat, idx) => (
                <Button
                  key={cat.uuid}
                  size="xs"
                  variant="subtle"
                  colorPalette="brand"
                  onClick={() => {
                    categorizarLoteMutate({ uuids: selecionados, categoriaId: cat.uuid })
                    setSelecionados([])
                  }}
                  borderRadius="lg"
                  fontWeight="bold"
                  h={7}
                  px={2}
                  title={`Atalho do teclado: Pressione a tecla [${idx + 1}]`}
                >
                  <HStack gap={1}>
                    <Badge
                      size="xs"
                      variant="solid"
                      colorPalette="brand"
                      px={1}
                      py={0}
                      borderRadius="sm"
                      fontSize="9px"
                      lineHeight="normal"
                    >
                      {idx + 1}
                    </Badge>
                    <Text as="span">{cat.nome}</Text>
                  </HStack>
                </Button>
              ))}
            </HStack>

            <HStack gap={2} justify={{ base: 'flex-end', md: 'flex-start' }}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModalCategorizarAberto(true)}
                fontWeight="semibold"
                borderRadius="xl"
                h={8}
                fontSize="xs"
              >
                <FolderPlus size={13} style={{ marginRight: '5px' }} />
                <Text as="span">Mais...</Text>
              </Button>

              <Button
                size="sm"
                variant="subtle"
                colorPalette="red"
                onClick={() => {
                  setItemApagarAlvo(null)
                  setModalConfirmarApagar(true)
                }}
                fontWeight="semibold"
                borderRadius="xl"
                h={8}
                fontSize="xs"
              >
                <Trash2 size={13} style={{ marginRight: '5px' }} />
                <Text as="span">Excluir</Text>
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}

      <Dialog.Root
        open={modalConfirmarApagar}
        onOpenChange={(e) => !e.open && setModalConfirmarApagar(false)}
        size="sm"
      >
        <Dialog.Backdrop bg="cirqueira.grey.950/80" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="2xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
            <Dialog.Header pb={2}>
              <HStack gap={2} color="cirqueira.red.500">
                <AlertTriangle size={18} />
                <Dialog.Title fontSize="md" fontWeight="bold">
                  Confirmar Exclusão
                </Dialog.Title>
              </HStack>
            </Dialog.Header>

            <Dialog.Body py={3}>
              <Text fontSize="xs" color="fg.subtle">
                {itemApagarAlvo
                  ? 'Tem certeza de que deseja apagar esta mídia? O arquivo e seus registros serão excluídos permanentemente.'
                  : `Tem certeza de que deseja apagar as ${selecionados.length} mídias selecionadas? Esta ação é irreversível.`}
              </Text>
            </Dialog.Body>

            <Dialog.Footer pt={2}>
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
                onClick={handleConfirmarApagar}
                disabled={pendenteApagarLote}
                borderRadius="lg"
                fontWeight="bold"
              >
                {pendenteApagarLote ? 'Apagando...' : 'Sim, Excluir'}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  )
})

export default CentralMidias
export { CentralMidias as Component }
