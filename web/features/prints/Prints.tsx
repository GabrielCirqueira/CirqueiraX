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
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Laptop,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { GridPrints } from './components/GridPrints'
import { ModalCategorizarPrint } from './components/ModalCategorizarPrint'
import { ModalVisualizarPrint } from './components/ModalVisualizarPrint'
import { TabelaPrints } from './components/TabelaPrints'
import { useSEO } from '@/shared/hooks'
import {
  useApagarLotePrints,
  useApagarPrint,
  useCategorias,
  useCategorizarLotePrints,
  useCategorizarPrint,
  usePrints,
} from './hooks/usePrints'
import type { FiltrosPrints, MediaItem } from './types'

export default function Prints() {
  useSEO({
    title: 'Galeria de Prints',
    description: 'Gestão e sincronização rápida de capturas de tela e prints de dispositivos sincronizados.',
    keywords: 'prints, screenshots, capturas de tela, cirqueirax',
  })

  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string>('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'lista'>('grid')

  const [itemVisualizar, setItemVisualizar] = useState<MediaItem | null>(null)
  const [modalCategorizarAberto, setModalCategorizarAberto] = useState(false)
  const [itemCategorizarAlvo, setItemCategorizarAlvo] = useState<MediaItem | null>(null)
  const [modalConfirmarApagar, setModalConfirmarApagar] = useState(false)
  const [itemApagarAlvo, setItemApagarAlvo] = useState<string | null>(null)

  const filtros = useMemo<FiltrosPrints>(() => {
    const obj: FiltrosPrints = {
      pagina,
      porPagina: 20,
      origem: 'prints',
    }
    if (busca.trim()) {
      obj.busca = busca.trim()
    }
    if (statusFiltro) {
      obj.status = statusFiltro
    }
    if (categoriaFiltro) {
      obj.categoriaId = categoriaFiltro
    }
    return obj
  }, [pagina, busca, statusFiltro, categoriaFiltro])

  const { data: respostaPaginada, isLoading, isFetching, refetch } = usePrints(filtros)
  const { data: categorias = [] } = useCategorias()

  const { mutate: categorizarPrintMutate } = useCategorizarPrint()
  const { mutate: categorizarLoteMutate, isPending: pendenteCategorizarLote } =
    useCategorizarLotePrints()
  const { mutate: apagarPrintMutate } = useApagarPrint()
  const { mutate: apagarLoteMutate, isPending: pendenteApagarLote } = useApagarLotePrints()

  const itens = respostaPaginada?.data ?? []
  const total = respostaPaginada?.total ?? 0
  const porPagina = respostaPaginada?.porPagina ?? 12
  const totalPaginas = Math.ceil(total / porPagina) || 1

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
    setStatusFiltro('')
    setCategoriaFiltro('')
    setPagina(1)
  }

  const handleConfirmarCategorizar = (categoriaId: string) => {
    if (itemCategorizarAlvo) {
      categorizarPrintMutate({ uuid: itemCategorizarAlvo.uuid, categoriaId })
      setItemCategorizarAlvo(null)
    } else if (selecionados.length > 0) {
      categorizarLoteMutate({ uuids: selecionados, categoriaId })
      setSelecionados([])
    }
  }

  const handleConfirmarApagar = () => {
    if (itemApagarAlvo) {
      apagarPrintMutate(itemApagarAlvo)
      setItemApagarAlvo(null)
    } else if (selecionados.length > 0) {
      apagarLoteMutate(selecionados)
      setSelecionados([])
    }
    setModalConfirmarApagar(false)
  }

  const filtrosAtivos = Boolean(busca.trim() || statusFiltro || categoriaFiltro)

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
                <Camera size={22} strokeWidth={2.2} />
              </Box>
              <Text as="h1" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black" color="fg">
                Prints & Capturas
              </Text>
              <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="md">
                {total} {total === 1 ? 'captura' : 'capturas'}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="fg.subtle">
              Capturas de tela sincronizadas automaticamente pelo agente do Windows e Linux
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
              <Laptop size={13} color="var(--chakra-colors-cirqueira-brand-400)" />
              <Text as="span">Agente: Notebook Pessoal</Text>
              <CheckCircle2 size={11} color="var(--chakra-colors-cirqueira-green-500)" />
            </HStack>

            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              borderRadius="lg"
            >
              <RefreshCw
                size={14}
                style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }}
              />
              <Text as="span" display={{ base: 'none', sm: 'inline' }}>
                {isFetching ? 'Atualizando...' : 'Atualizar'}
              </Text>
            </Button>
          </HStack>
        </Flex>

        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={3}
          bg="bg.panel"
          p={3.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <HStack gap={2} flex={1}>
            <Box position="relative" flex={1} maxW={{ base: 'full', md: '360px' }}>
              <Input
                size="sm"
                placeholder="Buscar prints por nome ou data..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setPagina(1)
                }}
                pl={8}
                borderRadius="lg"
                bg="bg.muted"
                borderColor="border.subtle"
              />
              <Box
                position="absolute"
                left={2.5}
                top="50%"
                transform="translateY(-50%)"
                color="fg.subtle"
              >
                <Search size={14} />
              </Box>
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

            {filtrosAtivos && (
              <Button size="xs" variant="ghost" onClick={handleLimparFiltros} borderRadius="lg">
                <X size={13} />
                <Text as="span">Limpar</Text>
              </Button>
            )}
          </HStack>

          <HStack gap={1}>
            <IconButton
              size="sm"
              variant={modoVisualizacao === 'grid' ? 'subtle' : 'ghost'}
              onClick={() => setModoVisualizacao('grid')}
              aria-label="Visualização em Grade"
              title="Grade"
              borderRadius="lg"
            >
              <LayoutGrid size={16} />
            </IconButton>

            <IconButton
              size="sm"
              variant={modoVisualizacao === 'lista' ? 'subtle' : 'ghost'}
              onClick={() => setModoVisualizacao('lista')}
              aria-label="Visualização em Lista"
              title="Lista"
              borderRadius="lg"
            >
              <List size={16} />
            </IconButton>
          </HStack>
        </Flex>

        {selecionados.length > 0 && (
          <Flex
            align="center"
            justify="space-between"
            bg="cirqueira.brand.500/15"
            borderWidth="1px"
            borderColor="cirqueira.brand.500/30"
            p={3}
            borderRadius="xl"
            gap={3}
          >
            <HStack gap={2}>
              <Badge size="sm" colorPalette="brand" borderRadius="md">
                {selecionados.length} selecionados
              </Badge>
              <Button size="xs" variant="ghost" onClick={() => setSelecionados([])}>
                Desmarcar todos
              </Button>
            </HStack>

            <HStack gap={2}>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setItemCategorizarAlvo(null)
                  setModalCategorizarAberto(true)
                }}
                borderRadius="lg"
              >
                <FolderPlus size={13} />
                <Text as="span">Categorizar</Text>
              </Button>

              <Button
                size="xs"
                colorPalette="red"
                variant="subtle"
                onClick={() => {
                  setItemApagarAlvo(null)
                  setModalConfirmarApagar(true)
                }}
                borderRadius="lg"
              >
                <Trash2 size={13} />
                <Text as="span">Apagar</Text>
              </Button>
            </HStack>
          </Flex>
        )}

        <Box key={`${modoVisualizacao}-${categoriaFiltro}-${pagina}`} className="tab-pane-fade" w="full">
          {modoVisualizacao === 'grid' ? (
            <GridPrints
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
            />
          ) : (
            <TabelaPrints
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

        {totalPaginas > 1 && (
          <Flex justify="space-between" align="center" pt={4}>
            <Text fontSize="xs" color="fg.subtle">
              Página {pagina} de {totalPaginas} ({total} prints no total)
            </Text>

            <HStack gap={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                borderRadius="lg"
              >
                <ChevronLeft size={16} />
                <Text as="span">Anterior</Text>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                borderRadius="lg"
              >
                <Text as="span">Próxima</Text>
                <ChevronRight size={16} />
              </Button>
            </HStack>
          </Flex>
        )}
      </VStack>

      <ModalVisualizarPrint
        item={itemVisualizar}
        aberto={Boolean(itemVisualizar)}
        onFechar={() => setItemVisualizar(null)}
        onCategorizar={(it) => {
          setItemCategorizarAlvo(it)
          setModalCategorizarAberto(true)
        }}
      />

      <ModalCategorizarPrint
        aberto={modalCategorizarAberto}
        onFechar={() => {
          setModalCategorizarAberto(false)
          setItemCategorizarAlvo(null)
        }}
        onConfirmar={handleConfirmarCategorizar}
        categorias={categorias}
        carregando={pendenteCategorizarLote}
        qtdSelecionados={itemCategorizarAlvo ? 1 : selecionados.length}
      />

      <Dialog.Root
        open={modalConfirmarApagar}
        onOpenChange={(e) => !e.open && setModalConfirmarApagar(false)}
        size="sm"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            borderRadius="xl"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <Dialog.Header p={4}>
              <Dialog.Title fontSize="md" fontWeight="bold">
                Excluir {itemApagarAlvo ? 'Print' : `${selecionados.length} Prints`}?
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body p={4}>
              <Text fontSize="sm" color="fg.subtle">
                Esta ação removerá permanentemente os prints selecionados do servidor e do banco de
                dados.
              </Text>
            </Dialog.Body>
            <Dialog.Footer p={4}>
              <HStack gap={2} justify="flex-end">
                <Button size="sm" variant="ghost" onClick={() => setModalConfirmarApagar(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  colorPalette="red"
                  onClick={handleConfirmarApagar}
                  disabled={pendenteApagarLote}
                >
                  Excluir Definitivamente
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  )
}

export { Prints as Component }
