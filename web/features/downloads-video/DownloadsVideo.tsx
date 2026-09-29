import { AppContainer } from '@/layouts/AppContainer'
import { cn } from '@/shared/lib/cn'
import { Box, Container, Flex, HStack, Text, VStack } from '@/shared/ui/layout'
import {
  Button,
  Chip,
  Input,
  Label,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalHeading,
  TextField,
} from '@heroui/react'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  FolderPlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { BarraAcoesEmLote } from './components/BarraAcoesEmLote'
import { CampoNovoLink } from './components/CampoNovoLink'
import { GridVideos } from './components/GridVideos'
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
import type { FiltrosMediaItem, MediaItem } from './types'

export default function DownloadsVideo() {
  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string>('')
  const [origemFiltro, setOrigemFiltro] = useState<string>('')
  const [selecionados, setSelecionados] = useState<string[]>([])

  const [itemEditarMetadata, setItemEditarMetadata] = useState<MediaItem | null>(null)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoUploader, setNovoUploader] = useState('')

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
  const paginacao = respostaPaginada?.paginacao
  const totalPaginas = paginacao ? Math.ceil(paginacao.total / paginacao.porPagina) : 1
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
    setNovoTitulo(item.metadata?.titulo || '')
    setNovoUploader(item.metadata?.uploader || '')
  }

  const handleSalvarMetadata = () => {
    if (!itemEditarMetadata) return
    atualizarMetadataMutate(
      {
        uuid: itemEditarMetadata.uuid,
        input: {
          titulo: novoTitulo.trim(),
          uploader: novoUploader.trim(),
        },
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
      <Container size="full" className="space-y-8">
        <Flex className="flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <VStack className="gap-1">
            <HStack className="gap-2.5">
              <Box className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                <Video className="size-6" />
              </Box>
              <Text as="h1" className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Downloads de Vídeo
              </Text>
            </HStack>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Cole links de vídeos do YouTube, TikTok, Twitter e Instagram para ingestão e
              processamento automático.
            </Text>
          </VStack>

          <HStack className="gap-2">
            {temItensComErro && (
              <Button
                size="sm"
                isDisabled={pendenteRetentarTodos}
                onPress={() => retentarTodosMutate()}
                className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
              >
                {pendenteRetentarTodos ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                <span>Retentar Falhas</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              isDisabled={isFetching}
              onPress={() => refetch()}
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            >
              <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
              <span>Atualizar</span>
            </Button>
          </HStack>
        </Flex>

        <CampoNovoLink onDownloadIniciado={() => refetch()} />

        <Flex className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Box className="relative flex-1 max-w-md">
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setPagina(1)
              }}
              placeholder="Buscar por título, canal ou hash..."
              className="w-full"
            />
          </Box>

          <HStack className="gap-2">
            <HStack className="gap-1 text-xs text-zinc-500">
              <Filter className="size-3.5" />
              <span>Status:</span>
            </HStack>
            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value)
                setPagina(1)
              }}
              className="h-10 px-3 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer text-zinc-900 dark:text-zinc-100"
            >
              <option value="">Todos os status</option>
              <option value="baixando">Baixando</option>
              <option value="recebido">Recebido</option>
              <option value="em_fila">Em Fila</option>
              <option value="classificado">Classificado</option>
              <option value="distribuindo">Distribuindo</option>
              <option value="distribuido_local">Distribuído</option>
              <option value="enviando_google_fotos">Google Fotos</option>
              <option value="concluido">Concluído</option>
              <option value="erro">Com Erro</option>
            </select>

            <select
              value={origemFiltro}
              onChange={(e) => {
                setOrigemFiltro(e.target.value)
                setPagina(1)
              }}
              className="h-10 px-3 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer text-zinc-900 dark:text-zinc-100"
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
          onEditarMetadata={handleAbrirEditarMetadata}
          onCategorizar={handleAbrirCategorizarIndividual}
          onRebaixar={handleAbrirRebaixarIndividual}
          onRetentar={(uuid) => retentarItemMutate(uuid)}
          onApagar={handleAbrirApagarIndividual}
        />

        {paginacao && paginacao.total > 0 && (
          <Flex className="flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              Mostrando {itens.length} de {paginacao.total} registros (Página {pagina} de{' '}
              {totalPaginas})
            </Text>

            <HStack className="gap-2">
              <Button
                size="sm"
                variant="ghost"
                isDisabled={pagina <= 1 || isFetching}
                onPress={() => setPagina((p) => Math.max(1, p - 1))}
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              >
                <ChevronLeft className="size-4" />
                <span>Anterior</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                isDisabled={pagina >= totalPaginas || isFetching}
                onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              >
                <span>Próxima</span>
                <ChevronRight className="size-4" />
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

        {/* Modal Editar Metadados */}
        <Modal
          isOpen={Boolean(itemEditarMetadata)}
          onOpenChange={(open) => !open && setItemEditarMetadata(null)}
        >
          <ModalBackdrop isDismissable>
            <ModalContainer>
              <ModalDialog className="max-w-lg">
                <ModalHeader>
                  <ModalHeading className="text-base font-bold">Editar Metadados</ModalHeading>
                </ModalHeader>
                <ModalBody className="gap-4">
                  <VStack className="gap-3">
                    <TextField>
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Título
                      </Label>
                      <Input
                        type="text"
                        value={novoTitulo}
                        onChange={(e) => setNovoTitulo(e.target.value)}
                        className="w-full"
                      />
                    </TextField>

                    <TextField>
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Uploader / Canal
                      </Label>
                      <Input
                        type="text"
                        value={novoUploader}
                        onChange={(e) => setNovoUploader(e.target.value)}
                        className="w-full"
                      />
                    </TextField>
                  </VStack>

                  <HStack className="justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button size="sm" variant="ghost" onPress={() => setItemEditarMetadata(null)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      isDisabled={pendenteMetadata}
                      onPress={handleSalvarMetadata}
                      className="bg-brand-500 hover:bg-brand-600 text-white font-semibold"
                    >
                      {pendenteMetadata && <Loader2 className="size-3.5 animate-spin" />}
                      <span>Salvar Alterações</span>
                    </Button>
                  </HStack>
                </ModalBody>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>

        {/* Modal Categorizar */}
        <Modal isOpen={modalCategorizarAberto} onOpenChange={setModalCategorizarAberto}>
          <ModalBackdrop isDismissable>
            <ModalContainer>
              <ModalDialog className="max-w-md">
                <ModalHeader>
                  <ModalHeading className="text-base font-bold">
                    {categoriaAlvoUuid
                      ? 'Categorizar Vídeo'
                      : `Categorizar ${selecionados.length} Itens`}
                  </ModalHeading>
                </ModalHeader>
                <ModalBody className="gap-4">
                  <VStack className="gap-2">
                    <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Selecione a Categoria de Destino
                    </Text>
                    <select
                      value={categoriaSelecionadaId}
                      onChange={(e) => setCategoriaSelecionadaId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categorias.map((cat) => (
                        <option key={cat.uuid} value={cat.uuid}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  </VStack>

                  <HStack className="justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setModalCategorizarAberto(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      isDisabled={
                        !categoriaSelecionadaId ||
                        pendenteCategorizarLote ||
                        pendenteClassificarIndividual
                      }
                      onPress={handleConfirmarCategorizar}
                      className="bg-brand-500 hover:bg-brand-600 text-white font-semibold"
                    >
                      {(pendenteCategorizarLote || pendenteClassificarIndividual) && (
                        <Loader2 className="size-3.5 animate-spin" />
                      )}
                      <span>Confirmar Categoria</span>
                    </Button>
                  </HStack>
                </ModalBody>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>

        {/* Modal Confirmar Apagar */}
        <Modal isOpen={modalConfirmarApagar} onOpenChange={setModalConfirmarApagar}>
          <ModalBackdrop isDismissable>
            <ModalContainer>
              <ModalDialog className="max-w-md">
                <ModalHeader>
                  <ModalHeading className="text-base font-bold">Confirmar Exclusão</ModalHeading>
                </ModalHeader>
                <ModalBody className="gap-4">
                  <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                    Tem certeza que deseja apagar{' '}
                    <strong>
                      {itemApagarAlvo
                        ? 'este arquivo'
                        : `${selecionados.length} arquivos selecionados`}
                    </strong>
                    ? Esta ação removerá o arquivo físico e o registro do banco.
                  </Text>

                  <HStack className="justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setModalConfirmarApagar(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      isDisabled={pendenteApagar}
                      onPress={handleConfirmarApagar}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    >
                      {pendenteApagar && <Loader2 className="size-3.5 animate-spin" />}
                      <span>Sim, Apagar</span>
                    </Button>
                  </HStack>
                </ModalBody>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>

        {/* Modal Confirmar Rebaixar */}
        <Modal isOpen={modalConfirmarRebaixar} onOpenChange={setModalConfirmarRebaixar}>
          <ModalBackdrop isDismissable>
            <ModalContainer>
              <ModalDialog className="max-w-md">
                <ModalHeader>
                  <ModalHeading className="text-base font-bold">Rebaixar Vídeo(s)</ModalHeading>
                </ModalHeader>
                <ModalBody className="gap-4">
                  <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                    O download será reenfileirado a partir da URL original gravada nos metadados.
                  </Text>

                  <HStack className="justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setModalConfirmarRebaixar(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      isDisabled={pendenteRebaixar}
                      onPress={handleConfirmarRebaixar}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      {pendenteRebaixar && <Loader2 className="size-3.5 animate-spin" />}
                      <span>Confirmar Rebaixamento</span>
                    </Button>
                  </HStack>
                </ModalBody>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>
      </Container>
    </AppContainer>
  )
}

export { DownloadsVideo as Component }
