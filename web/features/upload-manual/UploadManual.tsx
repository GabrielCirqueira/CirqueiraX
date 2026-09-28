import {
  apagarLote,
  categorizarLote,
  classificarCategoriaIndividual,
  listarCategorias,
  listarMediaItens,
  retentarMediaItem,
} from '@/features/downloads-video/api'
import { AppContainer } from '@/layouts'
import { Container, HStack, Text, VStack } from '@/shared/ui/layout'
import { Button, Chip, toast } from '@heroui/react'
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

  // Buscar categorias cadastradas
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
  })

  // Buscar mídias enviadas via upload/triagem
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

  // Mutation: Classificar Individual
  const mutationClassificar = useMutation({
    mutationFn: ({ uuid, categoriaId }: { uuid: string; categoriaId: string }) =>
      classificarCategoriaIndividual(uuid, categoriaId),
    onSuccess: () => {
      toast.success('Categoria atribuída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao atribuir categoria.')
    },
  })

  // Mutation: Categorizar em Lote
  const mutationCategorizarLote = useMutation({
    mutationFn: ({ uuids, categoriaId }: { uuids: string[]; categoriaId: string }) =>
      categorizarLote({ uuids, categoriaId }),
    onSuccess: (itens) => {
      toast.success(`${itens.length} mídia(s) categorizada(s) com sucesso!`)
      setSelecionados([])
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao categorizar itens em lote.')
    },
  })

  // Mutation: Apagar em Lote
  const mutationApagarLote = useMutation({
    mutationFn: (uuids: string[]) => apagarLote({ uuids }),
    onSuccess: (res) => {
      toast.success(`${res.removidos.length} item(ns) apagado(s) com sucesso!`)
      setSelecionados([])
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao apagar itens selecionados.')
    },
  })

  // Mutation: Retentar Item
  const mutationRetentar = useMutation({
    mutationFn: (uuid: string) => retentarMediaItem(uuid),
    onSuccess: () => {
      toast.success('Item reenviado para o motor de mensagens!')
      queryClient.invalidateQueries({ queryKey: ['media-itens'] })
    },
    onError: () => {
      toast.danger('Falha ao retentar processamento do item.')
    },
  })

  // Callbacks de seleção
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
      <Container size="xl" className="py-8 space-y-8">
        {/* Top Header Navegação & Título */}
        <VStack className="gap-4">
          <HStack className="justify-between">
            <Link
              to="/downloads"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Voltar para Downloads</span>
            </Link>

            <HStack className="gap-2">
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                onPress={() => queryClient.invalidateQueries({ queryKey: ['media-itens'] })}
                aria-label="Atualizar lista"
              >
                <RefreshCw className="size-4 text-zinc-600 dark:text-zinc-300" />
              </Button>
            </HStack>
          </HStack>

          <VStack className="gap-1">
            <HStack className="gap-2.5">
              <Text
                as="h1"
                className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100"
              >
                Upload Manual & Triagem
              </Text>
              <Chip
                size="sm"
                variant="soft"
                className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20"
              >
                Feature 4
              </Chip>
            </HStack>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Envie fotos ou vídeos locais diretamente para o sistema e realize a classificação e
              triagem rápida por categorias.
            </Text>
          </VStack>
        </VStack>

        {/* Dropzone de Upload (Tópico 97) */}
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

        {/* Fila de Triagem & Mídias Enviadas (Tópico 98) */}
        <VStack className="gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <HStack className="gap-2">
            <FolderCheck className="size-5 text-brand-500" />
            <Text as="h2" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
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
