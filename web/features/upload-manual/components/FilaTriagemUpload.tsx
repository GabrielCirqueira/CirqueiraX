import type { MediaItem } from '@/features/downloads-video/types'
import { Badge, Box, Button, Card, Dialog, Flex, Grid, HStack, Input, Text, VStack } from '@chakra-ui/react'
import {
  CheckSquare,
  FileImage,
  FileVideo,
  FolderPlus,
  RefreshCw,
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

  const abasFiltro = [
    { value: 'todos', label: 'Todas' },
    { value: 'sem_categoria', label: 'Sem Categoria' },
    { value: 'classificado', label: 'Classificadas' },
    { value: 'erro', label: 'Com Erro' },
  ]

  return (
    <VStack w="full" gap={6}>
      <Flex
        w="full"
        direction={{ base: 'column', sm: 'row' }}
        align={{ base: 'stretch', sm: 'center' }}
        justify="space-between"
        gap={4}
        bg="bg.panel"
        p={4}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border.subtle"
        shadow="sm"
      >
        <HStack gap={1} bg="bg.muted" p={1} borderRadius="xl">
          {abasFiltro.map((aba) => (
            <Button
              key={aba.value}
              size="xs"
              variant={filtroStatus === aba.value ? 'solid' : 'ghost'}
              colorPalette={filtroStatus === aba.value ? 'brand' : 'gray'}
              onClick={() => onMudarFiltroStatus(aba.value)}
              px={3}
              py={1.5}
              fontSize="xs"
              fontWeight="semibold"
              borderRadius="lg"
            >
              {aba.label}
            </Button>
          ))}
        </HStack>

        <Box w={{ base: 'full', sm: '64' }}>
          <Input
            value={busca}
            onChange={(e) => onMudarBusca(e.target.value)}
            placeholder="Buscar por nome ou hash..."
            bg="bg.muted"
            borderColor="border.subtle"
            fontSize="xs"
            h={9}
            borderRadius="xl"
          />
        </Box>
      </Flex>

      {itens.length > 0 && (
        <Flex w="full" align="center" justify="space-between" px={1}>
          <Button
            variant="ghost"
            size="xs"
            onClick={onToggleSelectAll}
            fontSize="xs"
            fontWeight="semibold"
            color="fg.subtle"
            _hover={{ color: 'fg' }}
          >
            <HStack gap={2}>
              {todosSelecionados ? (
                <CheckSquare size={16} color="#8b5cf6" />
              ) : (
                <Square size={16} />
              )}
              <Text as="span">
                {todosSelecionados
                  ? 'Desmarcar todos'
                  : algunsSelecionados
                    ? `Selecionados (${selecionados.length}/${itens.length})`
                    : 'Selecionar todos'}
              </Text>
            </HStack>
          </Button>

          <Text fontSize="xs" color="fg.subtle" fontWeight="medium">
            Exibindo {itens.length} item(ns)
          </Text>
        </Flex>
      )}

      {carregando && (
        <Grid w="full" templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box
              key={`skeleton-${i + 1}`}
              h={48}
              borderRadius="2xl"
              bg="bg.muted"
            />
          ))}
        </Grid>
      )}

      {!carregando && itens.length === 0 && (
        <VStack
          w="full"
          align="center"
          justify="center"
          py={16}
          px={4}
          textAlign="center"
          borderRadius="2xl"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.subtle"
          bg="bg.panel"
          gap={3}
        >
          <Box p={4} borderRadius="full" bg="bg.muted" color="fg.subtle">
            <Upload size={32} strokeWidth={1.5} />
          </Box>
          <Text as="h3" fontSize="md" fontWeight="bold" color="fg">
            Nenhuma mídia encontrada na triagem
          </Text>
          <Text fontSize="xs" color="fg.subtle" maxW="sm">
            Envie arquivos no painel de upload manual acima ou selecione outros filtros.
          </Text>
        </VStack>
      )}

      {!carregando && itens.length > 0 && (
        <Grid w="full" templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          {itens.map((item) => {
            const ehSelecionado = selecionados.includes(item.uuid)
            const ehVideo =
              item.caminhoLocal?.endsWith('.mp4') ||
              item.caminhoLocal?.endsWith('.mkv') ||
              item.caminhoLocal?.endsWith('.webm')

            return (
              <Card.Root
                key={item.uuid}
                position="relative"
                borderRadius="2xl"
                borderWidth={ehSelecionado ? '2px' : '1px'}
                borderColor={ehSelecionado ? 'brand.500' : 'border.subtle'}
                bg="bg.panel"
                overflow="hidden"
                shadow="none"
                transition="all 0.2s"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                _hover={{ borderColor: ehSelecionado ? 'brand.500' : 'border.muted' }}
              >
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onToggleSelect(item.uuid)}
                  position="absolute"
                  top={3}
                  left={3}
                  zIndex={10}
                  p={1.5}
                  borderRadius="lg"
                  bg="blackAlpha.600"
                  _hover={{ bg: 'blackAlpha.800' }}
                  color="white"
                  backdropFilter="blur(8px)"
                  aria-label="Selecionar item"
                >
                  {ehSelecionado ? (
                    <CheckSquare size={16} color="#a78bfa" />
                  ) : (
                    <Square size={16} />
                  )}
                </Button>

                <Box position="relative" aspectRatio="16/9" w="full" bg="bg.muted" display="flex" alignItems="center" justifyContent="center" borderBottomWidth="1px" borderColor="border.subtle">
                  {ehVideo ? (
                    <FileVideo size={40} color="#6366f1" />
                  ) : (
                    <FileImage size={40} color="#10b981" />
                  )}

                  <Badge
                    variant="subtle"
                    colorPalette="gray"
                    position="absolute"
                    top={3}
                    right={3}
                    fontSize="10px"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    bg="blackAlpha.600"
                    color="white"
                    backdropFilter="blur(8px)"
                    borderWidth="0"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                  >
                    {item.origemDescricao ?? item.origem}
                  </Badge>
                </Box>

                <Card.Body p={4} gap={3} flex={1} display="flex" flexDirection="column" justifyContent="space-between">
                  <VStack gap={1.5} alignItems="flex-start" w="full">
                    <Text
                      as="h4"
                      fontWeight="bold"
                      fontSize="xs"
                      color="fg"
                      truncate
                      w="full"
                    >
                      {String(
                        item.metadata?.nome_original ??
                          item.caminhoLocal?.split('/').pop() ??
                          item.uuid
                      )}
                    </Text>

                    <HStack gap={2} w="full">
                      {item.categoria ? (
                        <Badge
                          variant="subtle"
                          colorPalette="brand"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          <HStack gap={1} alignItems="center">
                            <FolderPlus size={12} />
                            <span>{item.categoria.nome}</span>
                          </HStack>
                        </Badge>
                      ) : (
                        <Badge
                          variant="subtle"
                          colorPalette="amber"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          Sem Categoria
                        </Badge>
                      )}

                      <Text as="span" fontSize="10px" fontFamily="mono" color="fg.subtle">
                        {item.hash.substring(0, 8)}...
                      </Text>
                    </HStack>
                  </VStack>

                  <VStack gap={1} pt={2} borderTopWidth="1px" borderColor="border.subtle" alignItems="flex-start" w="full">
                    <Text
                      as="span"
                      fontSize="11px"
                      fontWeight="medium"
                      color="fg.subtle"
                    >
                      Atribuir Categoria:
                    </Text>
                    <select
                      value={item.categoriaId ?? ''}
                      onChange={(e) => onClassificarIndividual(item.uuid, e.target.value)}
                      style={{
                        width: '100%',
                        height: '32px',
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: 'var(--chakra-colors-bg-muted)',
                        borderColor: 'var(--chakra-colors-border-subtle)',
                        color: 'inherit',
                        borderWidth: '1px',
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
                  </VStack>
                </Card.Body>

                <HStack px={4} py={2.5} bg="bg.muted" borderTopWidth="1px" borderColor="border.subtle" justify="space-between" w="full">
                  <Text as="span" fontSize="11px" fontWeight="medium" color="fg.subtle">
                    {item.statusDescricao ?? item.status}
                  </Text>

                  <HStack gap={1}>
                    {item.status === 'erro' && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onRetentar(item.uuid)}
                        aria-label="Retentar processamento"
                        p={1.5}
                      >
                        <RefreshCw size={14} />
                      </Button>
                    )}
                  </HStack>
                </HStack>
              </Card.Root>
            )
          })}
        </Grid>
      )}

      {selecionados.length > 0 && (
        <Box position="fixed" bottom={6} left="50%" transform="translateX(-50%)" zIndex={50} w="92%" maxW="xl">
          <Flex align="center" justify="space-between" gap={3} p={3} px={5} borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" bg="bg.panel" backdropFilter="blur(16px)" shadow="2xl">
            <HStack gap={2}>
              <Badge colorPalette="brand" px={2} py={0.5} borderRadius="md" fontWeight="bold">
                {selecionados.length}
              </Badge>
              <Text as="span" fontSize="xs" fontWeight="semibold" color="fg">
                selecionado(s)
              </Text>
            </HStack>

            <HStack gap={2}>
              <Button
                size="sm"
                colorPalette="brand"
                onClick={() => setModalCategorizarAberto(true)}
                fontWeight="semibold"
                borderRadius="xl"
              >
                <FolderPlus size={14} style={{ marginRight: '4px' }} />
                <span>Categorizar</span>
              </Button>

              <Button
                size="sm"
                variant="subtle"
                colorPalette="red"
                onClick={onApagarEmLote}
                borderRadius="xl"
              >
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                <span>Apagar</span>
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}

      <Dialog.Root open={modalCategorizarAberto} onOpenChange={(e) => setModalCategorizarAberto(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.panel" borderWidth="1px" borderColor="border.subtle" color="fg" borderRadius="2xl" p={4} maxW="md">
            <Dialog.Header>
              <Dialog.Title fontSize="md" fontWeight="bold">
                Categorizar {selecionados.length} item(ns) em lote
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body py={4}>
              <VStack gap={4} alignItems="stretch">
                <Text fontSize="xs" color="fg.subtle">
                  Escolha a categoria que será atribuída a todas as mídias selecionadas:
                </Text>

                <select
                  value={categoriaLoteId}
                  onChange={(e) => setCategoriaLoteId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: 'var(--chakra-colors-bg-muted)',
                    borderColor: 'var(--chakra-colors-border-subtle)',
                    color: 'inherit',
                    borderWidth: '1px',
                    outline: 'none',
                  }}
                >
                  <option value="">Selecione a categoria...</option>
                  {categorias.map((cat) => (
                    <option key={cat.uuid} value={cat.uuid}>
                      {cat.nome}
                    </option>
                  ))}
                </select>

                <HStack justify="flex-end" gap={2} pt={2}>
                  <Button size="sm" variant="ghost" onClick={() => setModalCategorizarAberto(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="brand"
                    disabled={!categoriaLoteId}
                    onClick={handleConfirmarCategorizarLote}
                    fontWeight="bold"
                    borderRadius="xl"
                  >
                    Aplicar Categoria
                  </Button>
                </HStack>
              </VStack>
            </Dialog.Body>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
  )
})