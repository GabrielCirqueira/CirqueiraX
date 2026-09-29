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
import { Badge, Button, Container, HStack, Text, VStack } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FolderCheck, RefreshCw } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DropzoneUpload } from './components/DropzoneUpload'
import { FilaTriagemUpload } from './components/FilaTriagemUpload'
import { useUploadManual } from './hooks/useUploadManual'

const UploadManual = memo(function UploadManual() {
  const queryClient = useQueryClient()
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState<string>('')
  const [selecionados, setSelecionados] = useState<string[]>([])

  const {
    fila,
    estaProcessando,
    categoriaPadraoId,
    setCategoriaPadraoId,
    adicionarArquivos,
    removerArquivo,
    atualizarCategoriaItem,
    limparConcluidos,
    enviarTodosPendentes,
    reenviarItemIndividual,
  } = useUploadManual()

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
  })

  const { data: respostaMedia, isLoading: carregandoMedia } = useQuery({
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
      addToast({ title: `${res.removidos.length} item(ns) apagado(s) com sucesso!`, color: 'success' })
      setSelecionados([])
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

  return (
    <AppContainer>
      <Container maxW="6xl" py={8} spaceY={8}>
        <VStack gap={4} alignItems="stretch">
          <HStack justify="space-between">
            <Link
              to="/downloads"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}
            >
              <ArrowLeft size={16} />
              <span>Voltar para Downloads</span>
            </Link>

            <HStack gap={2}>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['media-itens'] })}
                aria-label="Atualizar lista"
                p={1.5}
              >
                <RefreshCw size={16} color="#d4d4d8" />
              </Button>
            </HStack>
          </HStack>

          <VStack gap={1} alignItems="flex-start">
            <HStack gap={2.5}>
              <Text as="h1" fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="900" color="white">
                Upload Manual & Triagem
              </Text>
              <Badge variant="subtle" colorPalette="purple" px={2} py={0.5} borderRadius="md">
                Feature 4
              </Badge>
            </HStack>
            <Text fontSize="sm" color="zinc.400">
              Envie fotos ou vídeos locais diretamente para o sistema e realize a classificação e
              triagem rápida por categorias.
            </Text>
          </VStack>
        </VStack>

        <DropzoneUpload
          fila={fila}
          estaProcessando={estaProcessando}
          categorias={categorias}
          categoriaPadraoId={categoriaPadraoId}
          onSetCategoriaPadraoId={setCategoriaPadraoId}
          onAdicionarArquivos={adicionarArquivos}
          onRemoverArquivo={removerArquivo}
          onAtualizarCategoriaItem={atualizarCategoriaItem}
          onLimparConcluidos={limparConcluidos}
          onEnviarTodos={enviarTodosPendentes}
          onReenviarItem={reenviarItemIndividual}
        />

        <VStack gap={4} pt={4} borderTop="1px solid" borderColor="zinc.800" alignItems="flex-start">
          <HStack gap={2}>
            <FolderCheck size={20} color="#8b5cf6" />
            <Text as="h2" fontSize="lg" fontWeight="bold" color="white">
              Triagem de Mídias Recebidas
            </Text>
          </HStack>

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
            onApagarEmLote={() => mutationApagarLote.mutate(selecionados)}
            onRetentar={(uuid) => mutationRetentar.mutate(uuid)}
            filtroStatus={filtroStatus}
            onMudarFiltroStatus={setFiltroStatus}
            busca={busca}
            onMudarBusca={setBusca}
          />
        </VStack>
      </Container>
    </AppContainer>
  )
})

export default UploadManual
export { UploadManual as Component }
