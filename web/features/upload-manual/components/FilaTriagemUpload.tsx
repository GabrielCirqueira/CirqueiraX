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
  Input,
  NativeSelect,
  Text,
  VStack,
} from '@chakra-ui/react'
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
import {
  extrairHashCurto,
  extrairNomeExibicao,
  identificarTipoMidia,
} from '../utils/arquivosUpload'

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
              colorPalette={filtroStatus === aba.value ? 'brand' : undefined}
              onClick={() => onMudarFiltroStatus(aba.value)}
              fontWeight="semibold"
              borderRadius="lg"
            >
              {aba.label}
            </Button>
          ))}
        </HStack>

        <Box position="relative" maxW={{ base: 'full', sm: 'xs' }} w="full">
          <Input
            value={busca}
            onChange={(e) => onMudarBusca(e.target.value)}
            placeholder="Filtrar por nome ou hash..."
            bg="bg.muted"
            borderColor="border.subtle"
            fontSize="xs"
            h={8}
            borderRadius="xl"
          />
        </Box>
      </Flex>

      {itens.length > 0 && (
        <Flex w="full" justify="space-between" align="center" px={1}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleSelectAll}
            fontSize="xs"
            fontWeight="semibold"
            color="fg.subtle"
            _hover={{ color: 'fg' }}
          >
            <HStack gap={2}>
              {todosSelecionados ? (
                <Box as="span" color="cirqueira.purple.500" display="inline-flex">
                  <CheckSquare size={16} color="currentColor" />
                </Box>
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

          <Text fontSize="xs" color="fg.subtle">
            Exibindo {itens.length} registro(s)
          </Text>
        </Flex>
      )}

      {carregando && itens.length === 0 ? (
        <Grid
          w="full"
          templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={4}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Card.Root
              key={`sk-${i + 1}`}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="border.subtle"
              bg="bg.panel"
              h={56}
              p={4}
            >
              <VStack h="full" justify="space-between" align="stretch">
                <Box h={4} bg="bg.muted" borderRadius="md" w="70%" />
                <Box h={32} bg="bg.muted" borderRadius="xl" />
                <Box h={4} bg="bg.muted" borderRadius="md" w="40%" />
              </VStack>
            </Card.Root>
          ))}
        </Grid>
      ) : itens.length === 0 ? (
        <VStack
          w="full"
          py={16}
          px={4}
          borderRadius="2xl"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.subtle"
          bg="bg.panel"
          gap={2}
          textAlign="center"
        >
          <Box p={4} borderRadius="full" bg="bg.muted" color="fg.subtle" mb={2}>
            <Upload size={40} strokeWidth={1.5} />
          </Box>
          <Text as="h3" fontWeight="bold" fontSize="md" color="fg">
            Nenhuma mídia encontrada na triagem
          </Text>
          <Text fontSize="xs" color="fg.subtle" maxW="sm">
            {busca
              ? 'Tente remover os filtros de busca para visualizar os registros.'
              : 'Faça upload de arquivos acima para iniciar o processo de triagem e categorização.'}
          </Text>
        </VStack>
      ) : (
        <Grid
          w="full"
          templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={4}
        >
          {itens.map((item) => {
            const tipoInfo = identificarTipoMidia(item)
            const nomeExibicao = extrairNomeExibicao(item)
            const hashCurto = extrairHashCurto(item.hash)
            const isSelected = selecionados.includes(item.uuid)

            return (
              <Card.Root
                key={item.uuid}
                borderRadius="xl"
                borderWidth={isSelected ? '2px' : '1px'}
                borderColor={isSelected ? 'cirqueira.brand.500' : 'border.subtle'}
                bg="bg.panel"
                overflow="hidden"
                shadow="sm"
                transition="all 0.2s"
                _hover={{ borderColor: isSelected ? 'cirqueira.brand.500' : 'border.muted' }}
              >
                <Box position="relative" w="full" h={40} bg="bg.muted" overflow="hidden">
                  {item.metadata?.thumbnail ? (
                    <img
                      src={String(item.metadata.thumbnail)}
                      alt={item.hash}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <VStack h="full" w="full" align="center" justify="center" color="fg.subtle">
                      {tipoInfo.isVideo ? <FileVideo size={40} /> : <FileImage size={40} />}
                    </VStack>
                  )}

                  <Box position="absolute" top={2.5} left={2.5} zIndex={10}>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => onToggleSelect(item.uuid)}
                      bg="blackAlpha.600"
                      color="white"
                      _hover={{ bg: 'blackAlpha.800' }}
                      backdropFilter="blur(8px)"
                      borderRadius="lg"
                      p={1}
                      aria-label="Selecionar"
                    >
                      {isSelected ? (
                        <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                          <CheckSquare size={16} color="currentColor" />
                        </Box>
                      ) : (
                        <Square size={16} />
                      )}
                    </Button>
                  </Box>

                  <Box position="absolute" top={2.5} right={2.5} zIndex={10}>
                    <Badge
                      size="sm"
                      variant="subtle"
                      colorPalette={tipoInfo.colorPalette}
                      backdropFilter="blur(8px)"
                      borderRadius="md"
                    >
                      {tipoInfo.label}
                    </Badge>
                  </Box>
                </Box>

                <Card.Body
                  p={4}
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  gap={3}
                >
                  <VStack gap={1.5} alignItems="flex-start" w="full">
                    <Text as="h4" fontWeight="bold" fontSize="xs" color="fg" truncate w="full">
                      {nomeExibicao}
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
                            <Text as="span">{item.categoria.nome}</Text>
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
                        {hashCurto}...
                      </Text>
                    </HStack>
                  </VStack>

                  <VStack
                    gap={1}
                    pt={2}
                    borderTopWidth="1px"
                    borderColor="border.subtle"
                    alignItems="flex-start"
                    w="full"
                  >
                    <Text as="span" fontSize="11px" fontWeight="medium" color="fg.subtle">
                      Atribuir Categoria:
                    </Text>
                    <NativeSelect.Root size="sm" w="full">
                      <NativeSelect.Field
                        value={item.categoriaId ?? ''}
                        onChange={(e) => onClassificarIndividual(item.uuid, e.target.value)}
                        bg="bg.muted"
                        borderColor="border.subtle"
                        borderRadius="lg"
                        fontSize="xs"
                        h={8}
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
                </Card.Body>

                <HStack
                  px={4}
                  py={2.5}
                  bg="bg.muted"
                  borderTopWidth="1px"
                  borderColor="border.subtle"
                  justify="space-between"
                  w="full"
                >
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
            align="center"
            justify="space-between"
            gap={3}
            p={3}
            px={5}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
            backdropFilter="blur(16px)"
            shadow="2xl"
          >
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
                <Text as="span">Categorizar</Text>
              </Button>

              <Button
                size="sm"
                variant="subtle"
                colorPalette="red"
                onClick={onApagarEmLote}
                borderRadius="xl"
              >
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                <Text as="span">Apagar</Text>
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}

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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setCategoriaLoteId(e.target.value)
                  }
                  style={{
                    width: '100%',
                    height: '2.5rem',
                    padding: '0 0.75rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
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
