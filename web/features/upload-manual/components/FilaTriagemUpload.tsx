import type { MediaItem } from '@/features/downloads-video/types'
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
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  CheckSquare,
  FolderPlus,
  LayoutGrid,
  List,
  Search,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import { CardItemTriagem } from './CardItemTriagem'
import { ModalVisualizarMidiaManual } from './ModalVisualizarMidiaManual'
import { TabelaTriagemUpload } from './TabelaTriagemUpload'
import { identificarTipoMidia } from '../utils/arquivosUpload'

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
  onApagarIndividual?: (uuid: string) => void
  onRetentar: (uuid: string) => void
  onForcarGoogleFotos?: (item: MediaItem) => void
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
  onApagarIndividual,
  onRetentar,
  onForcarGoogleFotos,
  filtroStatus,
  onMudarFiltroStatus,
  busca,
  onMudarBusca,
}: FilaTriagemUploadProps) {
  const [modalCategorizarAberto, setModalCategorizarAberto] = useState(false)
  const [categoriaLoteId, setCategoriaLoteId] = useState('')
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'tabela'>('grid')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'imagem' | 'video'>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')
  const [itemVisualizar, setItemVisualizar] = useState<MediaItem | null>(null)

  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      if (filtroTipo !== 'todos') {
        const tipoInfo = identificarTipoMidia(item)
        if (filtroTipo === 'video' && !tipoInfo.isVideo) return false
        if (filtroTipo === 'imagem' && tipoInfo.isVideo) return false
      }

      if (filtroCategoria) {
        if (filtroCategoria === 'sem_categoria' && item.categoriaId) return false
        if (filtroCategoria !== 'sem_categoria' && item.categoriaId !== filtroCategoria) return false
      }

      return true
    })
  }, [itens, filtroTipo, filtroCategoria])

  const todosSelecionados = itensFiltrados.length > 0 && selecionados.length === itensFiltrados.length
  const algunsSelecionados = selecionados.length > 0 && !todosSelecionados

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
        onToggleSelectAll()
        return
      }

      if (selecionados.length > 0 && /^[1-9]$/.test(e.key)) {
        const index = Number(e.key) - 1
        const categoriaAlvo = categorias[index]
        if (categoriaAlvo) {
          e.preventDefault()
          onCategorizarEmLote(categoriaAlvo.uuid)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selecionados, categorias, onCategorizarEmLote, onToggleSelectAll])

  const handleConfirmarCategorizarLote = () => {
    if (!categoriaLoteId) return
    onCategorizarEmLote(categoriaLoteId)
    setModalCategorizarAberto(false)
    setCategoriaLoteId('')
  }

  const abasFiltro = [
    { value: 'todos', label: 'Todas' },
    { value: 'sem_categoria', label: 'Sem Categoria' },
    { value: 'classificado', label: 'Classificadas' },
    { value: 'erro', label: 'Com Erro' },
  ]

  return (
    <VStack w="full" gap={5}>
      <Flex
        w="full"
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={3}
        bg="bg.panel"
        p={3.5}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border.subtle"
        shadow="none"
      >
        <HStack gap={1} bg="bg.muted" p={1} borderRadius="xl" overflowX="auto">
          {abasFiltro.map((aba) => (
            <Button
              key={aba.value}
              size="xs"
              variant={filtroStatus === aba.value ? 'solid' : 'ghost'}
              colorPalette={filtroStatus === aba.value ? 'brand' : undefined}
              onClick={() => onMudarFiltroStatus(aba.value)}
              fontWeight="semibold"
              borderRadius="lg"
              px={3}
              h={7}
            >
              {aba.label}
            </Button>
          ))}
        </HStack>

        <HStack gap={2} flexWrap="wrap" justify={{ base: 'stretch', md: 'flex-end' }}>
          <NativeSelect.Root size="sm" w={{ base: 'full', sm: '180px' }}>
            <NativeSelect.Field
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              bg="bg.muted"
              borderColor="border.subtle"
              borderRadius="xl"
              fontSize="xs"
              h={8}
            >
              <option value="">Todas as Categorias</option>
              <option value="sem_categoria">Apenas Sem Categoria</option>
              {categorias.map((cat) => (
                <option key={cat.uuid} value={cat.uuid}>
                  {cat.nome}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>

          <NativeSelect.Root size="sm" w={{ base: 'full', sm: '130px' }}>
            <NativeSelect.Field
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'imagem' | 'video')}
              bg="bg.muted"
              borderColor="border.subtle"
              borderRadius="xl"
              fontSize="xs"
              h={8}
            >
              <option value="todos">Todos Tipos</option>
              <option value="imagem">Fotos</option>
              <option value="video">Vídeos</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>

          <Box position="relative" w={{ base: 'full', sm: '220px' }}>
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
              onChange={(e) => onMudarBusca(e.target.value)}
              placeholder="Buscar nome ou hash..."
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
                onClick={() => onMudarBusca('')}
                color="fg.subtle"
                _hover={{ color: 'fg' }}
              >
                <X size={13} />
              </Box>
            )}
          </Box>

          <HStack gap={1} bg="bg.muted" p={1} borderRadius="xl" borderWidth="1px" borderColor="border.subtle">
            <IconButton
              size="xs"
              variant={modoVisualizacao === 'grid' ? 'solid' : 'ghost'}
              colorPalette={modoVisualizacao === 'grid' ? 'brand' : undefined}
              onClick={() => setModoVisualizacao('grid')}
              aria-label="Visualização em Grade"
              title="Visualização em Grade"
              borderRadius="lg"
              h={6}
              w={6}
            >
              <LayoutGrid size={14} />
            </IconButton>
            <IconButton
              size="xs"
              variant={modoVisualizacao === 'tabela' ? 'solid' : 'ghost'}
              colorPalette={modoVisualizacao === 'tabela' ? 'brand' : undefined}
              onClick={() => setModoVisualizacao('tabela')}
              aria-label="Visualização em Tabela"
              title="Visualização em Tabela"
              borderRadius="lg"
              h={6}
              w={6}
            >
              <List size={14} />
            </IconButton>
          </HStack>
        </HStack>
      </Flex>

      {itensFiltrados.length > 0 && (
        <Flex w="full" justify="space-between" align="center" px={1}>
          <HStack gap={3}>
            <Button
              size="xs"
              variant="ghost"
              onClick={onToggleSelectAll}
              fontSize="xs"
              fontWeight="semibold"
              color="fg.subtle"
              _hover={{ color: 'fg' }}
              borderRadius="lg"
            >
              <HStack gap={1.5}>
                {todosSelecionados ? (
                  <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                    <CheckSquare size={15} />
                  </Box>
                ) : (
                  <Square size={15} />
                )}
                <Text as="span">
                  {todosSelecionados
                    ? 'Desmarcar todos'
                    : algunsSelecionados
                      ? `Selecionados (${selecionados.length}/${itensFiltrados.length})`
                      : 'Selecionar todos'}
                </Text>
              </HStack>
            </Button>

            {selecionados.length > 0 && (
              <Badge colorPalette="brand" size="sm" borderRadius="md">
                {selecionados.length} selecionado{selecionados.length > 1 ? 's' : ''}
              </Badge>
            )}
          </HStack>

          <Text fontSize="xs" color="fg.subtle">
            Exibindo {itensFiltrados.length} {itensFiltrados.length === 1 ? 'mídia' : 'mídias'}
          </Text>
        </Flex>
      )}

      {carregando && itensFiltrados.length === 0 ? (
        <Grid
          w="full"
          templateColumns={{
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          }}
          gap={4}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Card.Root
              key={`sk-${i + 1}`}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.subtle"
              bg="bg.panel"
              h={64}
              p={3}
            >
              <VStack h="full" justify="space-between" align="stretch">
                <Box h={36} bg="bg.muted" borderRadius="lg" />
                <Box h={4} bg="bg.muted" borderRadius="md" w="80%" />
                <Box h={7} bg="bg.muted" borderRadius="md" />
              </VStack>
            </Card.Root>
          ))}
        </Grid>
      ) : itensFiltrados.length === 0 ? (
        /* Estado Vazio Elegante */
        <VStack
          w="full"
          py={16}
          px={6}
          borderRadius="2xl"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.subtle"
          bg="bg.panel"
          gap={3}
          textAlign="center"
        >
          <Box
            p={4}
            borderRadius="2xl"
            bg="cirqueira.brand.500/10"
            color="cirqueira.brand.400"
            display="inline-flex"
          >
            <Upload size={36} strokeWidth={2} />
          </Box>
          <VStack gap={1} maxW="md">
            <Text as="h3" fontWeight="bold" fontSize="base" color="fg">
              Nenhuma mídia encontrada na triagem
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              {busca || filtroCategoria || filtroTipo !== 'todos'
                ? 'Nenhum resultado corresponde aos filtros selecionados. Tente limpar os filtros para ver todas as mídias.'
                : 'Arraste fotos e vídeos na caixa de upload acima ou cole com Ctrl+V para iniciar a triagem e categorização.'}
            </Text>
          </VStack>

          {(busca || filtroCategoria || filtroTipo !== 'todos') && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                onMudarBusca('')
                setFiltroCategoria('')
                setFiltroTipo('todos')
              }}
              borderRadius="lg"
              mt={1}
            >
              Limpar Todos os Filtros
            </Button>
          )}
        </VStack>
      ) : modoVisualizacao === 'grid' ? (
        /* Visualização em Grade de Cards 16:9 */
        <Grid
          w="full"
          templateColumns={{
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
            xl: 'repeat(4, 1fr)',
          }}
          gap={4}
        >
          {itensFiltrados.map((item) => (
            <CardItemTriagem
              key={item.uuid}
              item={item}
              categorias={categorias}
              selecionado={selecionados.includes(item.uuid)}
              onToggleSelect={onToggleSelect}
              onClassificar={onClassificarIndividual}
              onVisualizar={(it) => setItemVisualizar(it)}
              onForcarGoogleFotos={onForcarGoogleFotos}
              onRetentar={onRetentar}
              onApagar={onApagarIndividual}
            />
          ))}
        </Grid>
      ) : (
        /* Visualização em Tabela Compacta */
        <TabelaTriagemUpload
          itens={itensFiltrados}
          categorias={categorias}
          selecionados={selecionados}
          onToggleSelect={onToggleSelect}
          onToggleSelectAll={onToggleSelectAll}
          onClassificar={onClassificarIndividual}
          onVisualizar={(it) => setItemVisualizar(it)}
          onForcarGoogleFotos={onForcarGoogleFotos}
          onRetentar={onRetentar}
          onApagar={onApagarIndividual}
        />
      )}

      <ModalVisualizarMidiaManual
        aberto={Boolean(itemVisualizar)}
        item={itemVisualizar}
        categorias={categorias}
        onFechar={() => setItemVisualizar(null)}
        onClassificar={onClassificarIndividual}
        onForcarGoogleFotos={onForcarGoogleFotos}
      />

      {selecionados.length > 0 && (
        <Portal>
          <Box
            position="fixed"
            bottom={{ base: 4, md: 6 }}
            left="50%"
            transform="translateX(-50%)"
            zIndex={1100}
            w="92%"
            maxW="xl"
            pointerEvents="auto"
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
              bg="rgba(20, 25, 23, 0.94)"
              backdropFilter="blur(20px)"
              shadow="0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 186, 156, 0.2)"
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
                {categorias.slice(0, 4).map((cat, idx) => (
                  <Button
                    key={cat.uuid}
                    size="xs"
                    variant="subtle"
                    colorPalette="brand"
                    onClick={() => onCategorizarEmLote(cat.uuid)}
                    borderRadius="lg"
                    fontWeight="bold"
                    h={7}
                    px={2}
                    title={`Atalho rápido: Pressione a tecla [${idx + 1}]`}
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
                  onClick={onApagarEmLote}
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
        </Portal>
      )}

      <Dialog.Root
        open={modalCategorizarAberto}
        onOpenChange={(e) => !e.open && setModalCategorizarAberto(false)}
        size="sm"
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop bg="cirqueira.grey.950/80" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
              <Dialog.Header pb={2}>
                <Dialog.Title fontSize="md" fontWeight="bold" color="fg">
                  Categorizar Mídias em Lote
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body py={4}>
                <VStack gap={3} align="stretch">
                  <Text fontSize="xs" color="fg.subtle">
                    Selecione a categoria para aplicar a todas as {selecionados.length} mídias selecionadas:
                  </Text>

                  <NativeSelect.Root size="sm" w="full">
                    <NativeSelect.Field
                      value={categoriaLoteId}
                      onChange={(e) => setCategoriaLoteId(e.target.value)}
                      bg="bg.muted"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      fontSize="xs"
                      h={9}
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categorias.map((cat) => (
                        <option key={cat.uuid} value={cat.uuid}>
                          {cat.nome}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer pt={2}>
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
                  disabled={!categoriaLoteId}
                  onClick={handleConfirmarCategorizarLote}
                  borderRadius="lg"
                  fontWeight="semibold"
                >
                  Aplicar Categoria
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </VStack>
  )
})
