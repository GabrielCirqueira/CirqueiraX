import {
  apagarLote,
  categorizarLote,
  classificarCategoriaIndividual,
  listarCategorias,
  listarMediaItens,
  retentarMediaItem,
} from '@/features/downloads-video/api'
import { AppContainer } from '@/layouts'
import { addToast } from '@/shared/components/ui/toaster'
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FolderCheck,
  RefreshCw,
  UploadCloud,
  Zap,
} from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '@/shared/hooks'
import { DropzoneUpload } from './components/DropzoneUpload'
import { FilaTriagemUpload } from './components/FilaTriagemUpload'
import { ModalConfirmarSincronizacaoDuplicado } from './components/ModalConfirmarSincronizacaoDuplicado'
import { useUploadManual } from './hooks/useUploadManual'

const UploadManual = memo(function UploadManual() {
  useSEO({
    title: 'Upload Manual & Triagem',
    description: 'Envio manual de arquivos, detecção de duplicados e distribuição automática em lotes.',
    keywords: 'upload manual, triagem de midias, cirqueirax',
  })

  const queryClient = useQueryClient()
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState<string>('')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [modalConfirmarApagar, setModalConfirmarApagar] = useState(false)
  const [itemApagarAlvo, setItemApagarAlvo] = useState<string | null>(null)

  const {
    fila,
    estaProcessando,
    categoriaPadraoId,
    itemDuplicadoPendente,
    sincronizandoDuplicado,
    setCategoriaPadraoId,
    adicionarArquivos,
    removerArquivo,
    atualizarCategoriaItem,
    aplicarCategoriaParaTodos,
    aplicarCategoriaParaSelecionados,
    aplicarCategoriaParaSemCategoria,
    limparConcluidos,
    enviarTodosPendentes,
    reenviarItemIndividual,
    abrirConfirmacaoDuplicado,
    fecharConfirmacaoDuplicado,
    confirmarSincronizacaoDuplicado,
  } = useUploadManual()

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
  })

  const {
    data: respostaMedia,
    isLoading: carregandoMedia,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['media-itens', 'upload-manual', filtroStatus, busca],
    queryFn: () =>
      listarMediaItens({
        origem: 'manual',
        status:
          filtroStatus === 'todos' || filtroStatus === 'sem_categoria' ? undefined : filtroStatus,
        categoriaId: filtroStatus === 'sem_categoria' ? 'none' : undefined,
        busca: busca.trim() || undefined,
        porPagina: 50,
      }),
  })

  const itensMedia = useMemo(() => respostaMedia?.data ?? [], [respostaMedia])

  const totalTriagem = itensMedia.length
  const semCategoriaCount = useMemo(
    () => itensMedia.filter((i) => !i.categoriaId).length,
    [itensMedia]
  )
  const classificadosCount = useMemo(
    () => itensMedia.filter((i) => Boolean(i.categoriaId)).length,
    [itensMedia]
  )
  const errosCount = useMemo(
    () => itensMedia.filter((i) => i.status === 'erro').length,
    [itensMedia]
  )

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files)
        const mediaFiles = files.filter(
          (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
        )
        if (mediaFiles.length > 0) {
          e.preventDefault()
          adicionarArquivos(mediaFiles)
          addToast({
            title: `${mediaFiles.length} mídia(s) colada(s) via clipboard!`,
            color: 'success',
          })
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [adicionarArquivos])

  const mutationClassificar = useMutation({
    mutationFn: ({ uuid, categoriaId }: { uuid: string; categoriaId: string }) =>
      classificarCategoriaIndividual(uuid, categoriaId),
    onSuccess: () => {
      addToast({ title: 'Categoria atribuída com sucesso!', color: 'success' })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao atribuir categoria.', color: 'danger' })
    },
  })

  const mutationCategorizarLote = useMutation({
    mutationFn: ({ uuids, categoriaId }: { uuids: string[]; categoriaId: string }) =>
      categorizarLote({ uuids, categoriaId }),
    onSuccess: (itens) => {
      addToast({ title: `${itens.length} mídia(s) categorizada(s) com sucesso!`, color: 'success' })
      setSelecionados([])
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao categorizar itens em lote.', color: 'danger' })
    },
  })

  const mutationApagarLote = useMutation({
    mutationFn: (uuids: string[]) => apagarLote({ uuids }),
    onSuccess: (res) => {
      addToast({
        title: `${res.removidos.length} item(ns) apagado(s) com sucesso!`,
        color: 'success',
      })
      setSelecionados([])
      setItemApagarAlvo(null)
      setModalConfirmarApagar(false)
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao apagar itens selecionados.', color: 'danger' })
    },
  })

  const mutationRetentar = useMutation({
    mutationFn: (uuid: string) => retentarMediaItem(uuid),
    onSuccess: () => {
      addToast({ title: 'Item reenviado para o motor de mensagens!', color: 'success' })
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      addToast({ title: 'Falha ao retentar processamento do item.', color: 'danger' })
    },
  })

  const handleToggleSelect = useCallback((uuid: string) => {
    setSelecionados((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    )
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    setSelecionados((prev) =>
      prev.length === itensMedia.length ? [] : itensMedia.map((i) => i.uuid)
    )
  }, [itensMedia])

  const handleCategorizarTodasSemCategoria = useCallback(
    (categoriaId: string) => {
      const uuidsSemCategoria = itensMedia
        .filter((i) => !i.categoriaId)
        .map((i) => i.uuid)
      if (uuidsSemCategoria.length > 0) {
        mutationCategorizarLote.mutate({ uuids: uuidsSemCategoria, categoriaId })
      }
    },
    [itensMedia, mutationCategorizarLote]
  )

  const handleSelecionarTodasSemCategoria = useCallback(() => {
    const uuidsSemCategoria = itensMedia
      .filter((i) => !i.categoriaId)
      .map((i) => i.uuid)
    setSelecionados(uuidsSemCategoria)
  }, [itensMedia])

  const handleConfirmarApagar = () => {
    if (itemApagarAlvo) {
      mutationApagarLote.mutate([itemApagarAlvo])
    } else if (selecionados.length > 0) {
      mutationApagarLote.mutate(selecionados)
    }
  }

  return (
    <AppContainer maxWidth="full" paddingX="0" paddingY="0">
      <Box w="full" maxW="1680px" mx="auto" py={{ base: 4, md: 6 }} px={{ base: 3, md: 6 }}>
        <VStack w="full" gap={6} alignItems="stretch">
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', sm: 'center' }}
            gap={4}
          >
            <VStack align="start" gap={1.5}>
              <Link
                to="/downloads"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'inherit',
                  opacity: 0.75,
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={14} />
                <span>Voltar para Downloads</span>
              </Link>

              <HStack gap={2.5} align="center" flexWrap="wrap">
                <Box
                  p={2}
                  borderRadius="xl"
                  bg="cirqueira.brand.500/15"
                  color="cirqueira.brand.400"
                  display="inline-flex"
                >
                  <UploadCloud size={22} strokeWidth={2.2} />
                </Box>

                <Text as="h1" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black" color="fg">
                  Upload Manual & Triagem
                </Text>

                <HStack gap={1.5} pl={1} flexWrap="wrap">
                  <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="md">
                    {totalTriagem} {totalTriagem === 1 ? 'mídia' : 'mídias'}
                  </Badge>

                  {semCategoriaCount > 0 && (
                    <Badge size="sm" variant="subtle" colorPalette="amber" borderRadius="md">
                      {semCategoriaCount} sem categoria
                    </Badge>
                  )}

                  {classificadosCount > 0 && (
                    <Badge size="sm" variant="subtle" colorPalette="green" borderRadius="md">
                      {classificadosCount} classificadas
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
                Envie fotos ou vídeos locais com classificação instantânea. Cole diretamente com Ctrl+V em qualquer lugar.
              </Text>
            </VStack>

            <HStack gap={2} flexWrap="wrap" alignSelf={{ base: 'flex-start', sm: 'center' }}>
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
                <Text as="span">Pipeline de Upload • Multi-arquivo Ativo</Text>
                <Box as="span" color="cirqueira.green.500" display="inline-flex">
                  <CheckCircle2 size={11} color="currentColor" />
                </Box>
              </HStack>

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

          <DropzoneUpload
            fila={fila}
            estaProcessando={estaProcessando}
            categorias={categorias}
            categoriaPadraoId={categoriaPadraoId}
            onSetCategoriaPadraoId={setCategoriaPadraoId}
            onAdicionarArquivos={adicionarArquivos}
            onRemoverArquivo={removerArquivo}
            onAtualizarCategoriaItem={atualizarCategoriaItem}
            onAplicarCategoriaParaTodos={aplicarCategoriaParaTodos}
            onAplicarCategoriaParaSelecionados={aplicarCategoriaParaSelecionados}
            onAplicarCategoriaParaSemCategoria={aplicarCategoriaParaSemCategoria}
            onLimparConcluidos={limparConcluidos}
            onEnviarTodos={enviarTodosPendentes}
            onReenviarItem={reenviarItemIndividual}
            onAbrirConfirmacaoDuplicado={abrirConfirmacaoDuplicado}
          />

          <VStack gap={4} pt={2} alignItems="stretch">
            <HStack justify="space-between" align="center" flexWrap="wrap">
              <HStack gap={2}>
                <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                  <FolderCheck size={20} color="currentColor" />
                </Box>
                <Text as="h2" fontSize="md" fontWeight="bold" color="fg">
                  Triagem de Mídias Recebidas
                </Text>
                <Badge size="xs" variant="subtle" colorPalette="brand" borderRadius="md">
                  {totalTriagem} total
                </Badge>
              </HStack>

              {semCategoriaCount > 0 && (
                <Text fontSize="xs" color="cirqueira.amber.500" fontWeight="medium">
                  {semCategoriaCount} mídia(s) aguardando atribuição de categoria
                </Text>
              )}
            </HStack>

            {semCategoriaCount > 0 && (
              <Box
                p={3}
                px={4}
                borderRadius="xl"
                bg="cirqueira.amber.500/10"
                borderWidth="1px"
                borderColor="cirqueira.amber.500/25"
              >
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  align={{ base: 'flex-start', md: 'center' }}
                  justify="space-between"
                  gap={2.5}
                >
                  <HStack gap={2} flexWrap="wrap">
                    <Badge colorPalette="amber" variant="solid" size="sm" borderRadius="md" fontWeight="bold">
                      <HStack gap={1}>
                        <Zap size={12} />
                        <Text as="span">{semCategoriaCount} sem categoria</Text>
                      </HStack>
                    </Badge>
                    <Text fontSize="xs" fontWeight="semibold" color="fg">
                      Definir todas as {semCategoriaCount} de uma vez:
                    </Text>
                  </HStack>

                  <HStack gap={1.5} flexWrap="wrap">
                    {categorias.map((cat) => (
                      <Button
                        key={cat.uuid}
                        size="xs"
                        variant="subtle"
                        colorPalette="amber"
                        disabled={mutationCategorizarLote.isPending}
                        onClick={() => handleCategorizarTodasSemCategoria(cat.uuid)}
                        borderRadius="md"
                        fontSize="11px"
                        h="26px"
                        fontWeight="semibold"
                      >
                        {cat.nome}
                      </Button>
                    ))}
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={handleSelecionarTodasSemCategoria}
                      borderRadius="md"
                      fontSize="11px"
                      h="26px"
                      color="fg.subtle"
                    >
                      Selecionar todas ({semCategoriaCount})
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            )}

            <FilaTriagemUpload
              itens={itensMedia}
              carregando={carregandoMedia}
              categorias={categorias}
              selecionados={selecionados}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onClassificarIndividual={(uuid, categoriaId) =>
                mutationClassificar.mutate({ uuid, categoriaId })
              }
              onCategorizarEmLote={(categoriaId) =>
                mutationCategorizarLote.mutate({ uuids: selecionados, categoriaId })
              }
              onApagarEmLote={() => {
                setItemApagarAlvo(null)
                setModalConfirmarApagar(true)
              }}
              onApagarIndividual={(uuid) => {
                setItemApagarAlvo(uuid)
                setModalConfirmarApagar(true)
              }}
              onRetentar={(uuid) => mutationRetentar.mutate(uuid)}
              onForcarGoogleFotos={(item) =>
                abrirConfirmacaoDuplicado({
                  nome:
                    item.metadata?.titulo ||
                    (item.caminhoLocal ? item.caminhoLocal.split('/').pop() || '' : '') ||
                    item.hash,
                  tamanhoBytes: item.tamanhoBytes ?? undefined,
                  previewUrl: item.thumbnailUrl,
                  mediaItem: item,
                })
              }
              filtroStatus={filtroStatus}
              onMudarFiltroStatus={setFiltroStatus}
              busca={busca}
              onMudarBusca={setBusca}
            />
          </VStack>
        </VStack>

        <ModalConfirmarSincronizacaoDuplicado
          aberto={Boolean(itemDuplicadoPendente)}
          item={itemDuplicadoPendente}
          categorias={categorias}
          carregando={sincronizandoDuplicado}
          onFechar={fecharConfirmacaoDuplicado}
          onConfirmar={async (categoriaId) => {
            await confirmarSincronizacaoDuplicado(categoriaId)
            queryClient.invalidateQueries({ queryKey: ['media-itens'] })
          }}
        />

        <Dialog.Root
          open={modalConfirmarApagar}
          onOpenChange={(e) => !e.open && setModalConfirmarApagar(false)}
          size="sm"
          placement="center"
        >
          <Portal>
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
                    ? 'Tem certeza de que deseja apagar esta mídia? Os arquivos e metadados serão excluídos permanentemente.'
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
                  disabled={mutationApagarLote.isPending}
                  borderRadius="lg"
                  fontWeight="bold"
                >
                  {mutationApagarLote.isPending ? 'Apagando...' : 'Sim, Excluir'}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      </Box>
    </AppContainer>
  )
})

export default UploadManual
export { UploadManual as Component }
