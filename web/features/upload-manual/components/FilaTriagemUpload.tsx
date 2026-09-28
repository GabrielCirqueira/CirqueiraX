import type { MediaItem } from '@/features/downloads-video/types'
import { cn } from '@/shared/lib/cn'
import { Box, Flex, Grid, HStack, Text, VStack } from '@/shared/ui/layout'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Input,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalHeading,
  Tab,
  TabList,
  Tabs,
} from '@heroui/react'
import {
  CheckCircle2,
  CheckSquare,
  FileImage,
  FileVideo,
  FolderPlus,
  RefreshCw,
  Search,
  Square,
  Trash2,
  Upload,
} from 'lucide-react'
import { memo, useState } from 'react'

export interface FilaTriagemUploadProps {
  itens: MediaItem[]
  carregando: boolean
  categorias: Array<{ uuid: string; nome: string }>
  selecionados: string[]
  onToggleSelect: (uuid: string) => void
  onToggleSelectAll: () => void
  onClassificarIndividual: (uuid: string, categoriaId: string) => void
  onCategorizarEmLote: (categoriaId: string) => void
  onApagarEmLote: () => void
  onRetentar: (uuid: string) => void
  filtroStatus: string
  onMudarFiltroStatus: (status: string) => void
  busca: string
  onMudarBusca: (busca: string) => void
}

export const FilaTriagemUpload = memo(function FilaTriagemUpload({
  itens,
  carregando,
  categorias,
  selecionados,
  onToggleSelect,
  onToggleSelectAll,
  onClassificarIndividual,
  onCategorizarEmLote,
  onApagarEmLote,
  onRetentar,
  filtroStatus,
  onMudarFiltroStatus,
  busca,
  onMudarBusca,
}: FilaTriagemUploadProps) {
  const [modalCategorizarAberto, setModalCategorizarAberto] = useState(false)
  const [categoriaLoteId, setCategoriaLoteId] = useState('')

  const todosSelecionados = itens.length > 0 && selecionados.length === itens.length
  const algunsSelecionados = selecionados.length > 0 && !todosSelecionados

  const handleConfirmarCategorizarLote = () => {
    if (!categoriaLoteId) return
    onCategorizarEmLote(categoriaLoteId)
    setModalCategorizarAberto(false)
    setCategoriaLoteId('')
  }

  return (
    <VStack className="w-full gap-6">
      {/* Filtros e Busca */}
      <Flex className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Abas de Filtro usando HeroUI Tabs */}
        <Tabs selectedKey={filtroStatus} onSelectionChange={(k) => onMudarFiltroStatus(String(k))}>
          <TabList className="gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <Tab id="todos" className="px-3 py-1.5 text-xs font-semibold rounded-lg">
              Todas
            </Tab>
            <Tab id="sem_categoria" className="px-3 py-1.5 text-xs font-semibold rounded-lg">
              Sem Categoria
            </Tab>
            <Tab id="classificado" className="px-3 py-1.5 text-xs font-semibold rounded-lg">
              Classificadas
            </Tab>
            <Tab id="erro" className="px-3 py-1.5 text-xs font-semibold rounded-lg">
              Com Erro
            </Tab>
          </TabList>
        </Tabs>

        {/* Input de Busca usando HeroUI Input */}
        <Box className="w-full sm:w-64">
          <Input
            value={busca}
            onChange={(e) => onMudarBusca(e.target.value)}
            placeholder="Buscar por nome ou hash..."
            className="w-full"
          />
        </Box>
      </Flex>

      {/* Seleção em Lote & Status */}
      {itens.length > 0 && (
        <Flex className="items-center justify-between px-1">
          <Button
            variant="quiet"
            size="sm"
            onPress={onToggleSelectAll}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {todosSelecionados ? (
              <CheckSquare className="size-4 text-brand-500" />
            ) : (
              <Square className="size-4" />
            )}
            <Text as="span">
              {todosSelecionados
                ? 'Desmarcar todos'
                : algunsSelecionados
                  ? `Selecionados (${selecionados.length}/${itens.length})`
                  : 'Selecionar todos'}
            </Text>
          </Button>

          <Text className="text-xs text-zinc-400 font-medium">
            Exibindo {itens.length} item(ns)
          </Text>
        </Flex>
      )}

      {/* Estado de Carregamento */}
      {carregando && (
        <Grid className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Box
              key={`skeleton-${i + 1}`}
              className="h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </Grid>
      )}

      {/* Fila Vazia */}
      {!carregando && itens.length === 0 && (
        <VStack className="items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 gap-3">
          <Box className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
            <Upload className="size-8" strokeWidth={1.5} />
          </Box>
          <Text as="h3" className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Nenhuma mídia encontrada na triagem
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
            Envie arquivos no painel de upload manual acima ou selecione outros filtros.
          </Text>
        </VStack>
      )}

      {/* Grid de Cards de Mídia */}
      {!carregando && itens.length > 0 && (
        <Grid className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {itens.map((item) => {
            const ehSelecionado = selecionados.includes(item.uuid)
            const ehVideo =
              item.caminhoLocal?.endsWith('.mp4') ||
              item.caminhoLocal?.endsWith('.mkv') ||
              item.caminhoLocal?.endsWith('.webm')

            return (
              <Card
                key={item.uuid}
                className={cn(
                  'relative rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden shadow-none transition-all flex flex-col justify-between',
                  ehSelecionado
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                )}
              >
                {/* Seleção Checkbox Overlay */}
                <Button
                  size="sm"
                  variant="quiet"
                  isIconOnly
                  onPress={() => onToggleSelect(item.uuid)}
                  className="absolute top-3 left-3 z-10 p-1 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
                  aria-label="Selecionar item"
                >
                  {ehSelecionado ? (
                    <CheckSquare className="size-4 text-brand-400" />
                  ) : (
                    <Square className="size-4" />
                  )}
                </Button>

                {/* Header / Thumbnail Placeholder */}
                <Box className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800">
                  {ehVideo ? (
                    <FileVideo className="size-10 text-indigo-500/80" />
                  ) : (
                    <FileImage className="size-10 text-emerald-500/80" />
                  )}

                  {/* Origem Badge */}
                  <Chip
                    size="sm"
                    className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-black/50 text-white backdrop-blur-md border-0"
                  >
                    {item.origemDescricao ?? item.origem}
                  </Chip>
                </Box>

                {/* Corpo do Card */}
                <CardContent className="p-4 gap-3 flex-1 flex flex-col justify-between">
                  <VStack className="gap-1.5">
                    <Text
                      as="h4"
                      className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate"
                    >
                      {item.metadata?.nome_original ??
                        item.caminhoLocal?.split('/').pop() ??
                        item.uuid}
                    </Text>

                    <HStack className="gap-2">
                      {item.categoria ? (
                        <Chip
                          size="sm"
                          variant="soft"
                          className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20"
                        >
                          <HStack className="gap-1 items-center">
                            <FolderPlus className="size-3" />
                            <span>{item.categoria.nome}</span>
                          </HStack>
                        </Chip>
                      ) : (
                        <Chip
                          size="sm"
                          variant="soft"
                          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        >
                          Sem Categoria
                        </Chip>
                      )}

                      <Text as="span" className="text-[10px] font-mono text-zinc-400">
                        {item.hash.substring(0, 8)}...
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Seletor Rápido de Categoria */}
                  <VStack className="gap-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Text
                      as="label"
                      className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
                    >
                      Atribuir Categoria:
                    </Text>
                    <select
                      value={item.categoriaId ?? ''}
                      onChange={(e) => onClassificarIndividual(item.uuid, e.target.value)}
                      className="w-full h-8 px-2 rounded-lg text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categorias.map((cat) => (
                        <option key={cat.uuid} value={cat.uuid}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  </VStack>
                </CardContent>

                {/* Footer do Card com Ações */}
                <HStack className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 justify-between">
                  <Text as="span" className="text-[11px] font-medium text-zinc-400">
                    {item.statusDescricao ?? item.status}
                  </Text>

                  <HStack className="gap-1">
                    {item.status === 'erro' && (
                      <Button
                        size="sm"
                        variant="quiet"
                        isIconOnly
                        onPress={() => onRetentar(item.uuid)}
                        aria-label="Retentar processamento"
                      >
                        <RefreshCw className="size-3.5 text-zinc-400 hover:text-brand-500" />
                      </Button>
                    )}
                  </HStack>
                </HStack>
              </Card>
            )
          })}
        </Grid>
      )}

      {/* Barra Flutuante de Ações em Lote */}
      {selecionados.length > 0 && (
        <Box className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <Flex className="items-center justify-between gap-3 p-3 px-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg shadow-2xl">
            <HStack className="gap-2">
              <Chip size="sm" className="bg-brand-500 text-white font-bold">
                {selecionados.length}
              </Chip>
              <Text as="span" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                selecionado(s)
              </Text>
            </HStack>

            <HStack className="gap-2">
              <Button
                size="sm"
                onPress={() => setModalCategorizarAberto(true)}
                className="bg-brand-500 text-white font-semibold"
              >
                <FolderPlus className="size-3.5" />
                <span>Categorizar</span>
              </Button>

              <Button
                size="sm"
                variant="quiet"
                onPress={onApagarEmLote}
                className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100"
              >
                <Trash2 className="size-3.5" />
                <span>Apagar</span>
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}

      {/* Modal de Categorização em Lote usando HeroUI Modal */}
      <Modal isOpen={modalCategorizarAberto} onOpenChange={setModalCategorizarAberto}>
        <ModalBackdrop />
        <ModalContainer>
          <ModalDialog className="max-w-md">
            <ModalHeader>
              <ModalHeading className="text-base font-bold">
                Categorizar {selecionados.length} item(ns) em lote
              </ModalHeading>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                Escolha a categoria que será atribuída a todas as mídias selecionadas:
              </Text>

              <select
                value={categoriaLoteId}
                onChange={(e) => setCategoriaLoteId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="">Selecione a categoria...</option>
                {categorias.map((cat) => (
                  <option key={cat.uuid} value={cat.uuid}>
                    {cat.nome}
                  </option>
                ))}
              </select>

              <HStack className="justify-end gap-2 pt-2">
                <Button size="sm" variant="quiet" onPress={() => setModalCategorizarAberto(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  isDisabled={!categoriaLoteId}
                  onPress={handleConfirmarCategorizarLote}
                  className="bg-brand-500 text-white font-bold"
                >
                  Aplicar Categoria
                </Button>
              </HStack>
            </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </Modal>
    </VStack>
  )
})
