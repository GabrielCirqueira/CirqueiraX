import { AppContainer } from '@/layouts/AppContainer'
import { Box, Button, Dialog, Flex, HStack, Input, Text, VStack } from '@chakra-ui/react'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Video,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { BarraAcoesEmLote } from './components/BarraAcoesEmLote'
import { CampoNovoLink } from './components/CampoNovoLink'
import { GridVideos } from './components/GridVideos'
import { ModalEditarMetadata } from './components/ModalEditarMetadata'
import { ModalVisualizarMidia } from './components/ModalVisualizarMidia'
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
  const temItensComErro = itens.some((item) => item.status === 'erro')

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
    <AppContainer maxWidth="7xl" paddingY="8" paddingX="6">
      <VStack w="full" gap={8} alignItems="stretch">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap={4}
          borderBottomWidth="1px"
          borderColor="border.subtle"
          pb={6}
        >
          <VStack gap={1} alignItems="flex-start">
            <HStack gap={2.5}>
              <Box p={2} borderRadius="xl" bg="cirqueira.brand.500/10" color="cirqueira.brand.500">
                <Video size={24} />
              </Box>
              <Text as="h1" fontSize="2xl" fontWeight="bold" color="fg">
                Downloads de Vídeo
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.subtle">
              Cole links de vídeos do YouTube, TikTok, Twitter e Instagram para ingestão e
              processamento automático.
            </Text>
          </VStack>

          <HStack gap={2}>
            {temItensComErro && (
              <Button
                size="sm"
                colorPalette="amber"
                variant="subtle"
                disabled={pendenteRetentarTodos}
                onClick={() => retentarTodosMutate()}
                borderRadius="xl"
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
              variant="ghost"
              disabled={isFetching}
              onClick={() => refetch()}
              borderRadius="xl"
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

        <CampoNovoLink onDownloadIniciado={() => refetch()} />

        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align={{ base: 'stretch', sm: 'center' }}
          justify="space-between"
          gap={3}
          bg="bg.panel"
          p={3}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <Box flex={1} maxW="md">
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
              h={10}
              borderRadius="xl"
            />
          </Box>

          <HStack gap={2}>
            <HStack gap={1} fontSize="xs" color="fg.subtle">
              <Filter size={14} />
              <Text as="span">Status:</Text>
            </HStack>
            <select
              value={statusFiltro}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setStatusFiltro(e.target.value)
                setPagina(1)
              }}
              style={{
                height: '2.5rem',
                padding: '0 0.75rem',
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: 'var(--chakra-colors-bg-muted)',
                borderColor: 'var(--chakra-colors-border-subtle)',
                color: 'inherit',
                borderWidth: '1px',
                borderStyle: 'solid',
                outline: 'none',
                cursor: 'pointer',
              }}
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
            </select>

            <select
              value={origemFiltro}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setOrigemFiltro(e.target.value)
                setPagina(1)
              }}
              style={{
                height: '2.5rem',
                padding: '0 0.75rem',
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: 'var(--chakra-colors-bg-muted)',
                borderColor: 'var(--chakra-colors-border-subtle)',
                color: 'inherit',
                borderWidth: '1px',
                borderStyle: 'solid',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Todas as origens</option>
              <option value="manual">Manual / Web</option>
              <option value="bot_telegram">Bot Telegram</option>
              <option value="print_empresa">Print Empresa</option>
              <option value="print_pessoal">Print Pessoal</option>
            </select>
          </HStack>
        </Flex>

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

        {total > 0 && (
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align="center"
            justify="space-between"
            gap={4}
            pt={4}
            borderTopWidth="1px"
            borderColor="border.subtle"
          >
            <Text fontSize="xs" color="fg.subtle">
              Mostrando {itens.length} de {total} registros (Página {pagina} de {totalPaginas})
            </Text>

            <HStack gap={2}>
              <Button
                size="sm"
                variant="ghost"
                disabled={pagina <= 1 || isFetching}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                borderRadius="xl"
              >
                <ChevronLeft size={16} style={{ marginRight: '4px' }} />
                <Text as="span">Anterior</Text>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                disabled={pagina >= totalPaginas || isFetching}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                borderRadius="xl"
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
              borderRadius="2xl"
              p={4}
              maxW="md"
            >
              <Dialog.Header>
                <Dialog.Title fontSize="md" fontWeight="bold">
                  {categoriaAlvoUuid
                    ? 'Categorizar Vídeo'
                    : `Categorizar ${selecionados.length} Itens`}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body py={4}>
                <VStack gap={4} alignItems="stretch">
                  <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
                    Selecione a Categoria de Destino
                  </Text>
                  <select
                    value={categoriaSelecionadaId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setCategoriaSelecionadaId(e.target.value)
                    }
                    style={{
                      width: '100%',
                      height: '2.75rem',
                      padding: '0 0.75rem',
                      borderRadius: '0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--chakra-colors-bg-muted)',
                      borderColor: 'var(--chakra-colors-border-subtle)',
                      color: 'inherit',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      outline: 'none',
                    }}
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categorias.map((cat) => (
                      <option key={cat.uuid} value={cat.uuid}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>

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
                      borderRadius="xl"
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
              borderRadius="2xl"
              p={4}
              maxW="md"
            >
              <Dialog.Header>
                <Dialog.Title fontSize="md" fontWeight="bold">
                  Confirmar Exclusão
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body py={4}>
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
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="red"
                      disabled={pendenteApagar}
                      onClick={handleConfirmarApagar}
                      fontWeight="semibold"
                      borderRadius="xl"
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
              borderRadius="2xl"
              p={4}
              maxW="md"
            >
              <Dialog.Header>
                <Dialog.Title fontSize="md" fontWeight="bold">
                  Rebaixar Vídeo(s)
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body py={4}>
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
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      disabled={pendenteRebaixar}
                      onClick={handleConfirmarRebaixar}
                      fontWeight="semibold"
                      borderRadius="xl"
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
    </AppContainer>
  )
}

export { DownloadsVideo as Component }
