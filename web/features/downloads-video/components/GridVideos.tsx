import { Badge, Box, Button, Flex, Grid, HStack, Text, VStack } from '@chakra-ui/react'
import { CheckSquare, Film, FolderCheck, Square, Tag, X } from 'lucide-react'
import { memo, useMemo } from 'react'
import type { MediaItem } from '../types'
import {
  bloquearSelecaoDeTextoComShift,
  interceptarCliqueComShift,
} from '../utils/selecaoIntervalo'
import { CardVideo, type VarianteCardVideo } from './CardVideo'

export interface GridVideosProps {
  itens: MediaItem[]
  carregando?: boolean
  selecionados: string[]
  variante?: VarianteCardVideo
  colunas?: number
  categoriaFiltro?: string
  nomeCategoriaFiltro?: string
  onToggleSelect: (uuid: string) => void
  onSelecionarIntervalo?: (uuid: string) => void
  onToggleSelectAll?: () => void
  onSelectSomenteSemCategoria?: () => void
  onSelectSomenteCategorizados?: () => void
  onLimparSelecao?: () => void
  onVisualizar?: (item: MediaItem) => void
  onEditarMetadata?: (item: MediaItem, abaInicial?: 'geral' | 'data' | 'duracao' | 'capa') => void
  onCategorizar?: (item: MediaItem) => void
  onRebaixar?: (uuid: string) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
  onForcarGoogleFotos?: (item: MediaItem) => void
}

function SkeletonCard() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      overflow="hidden"
      shadow="sm"
    >
      <Box aspectRatio="16/9" w="full" bg="bg.muted" />
      <VStack p={4} gap={3} alignItems="stretch">
        <Box h={4} bg="bg.muted" borderRadius="md" w="80%" />
        <Box h={3} bg="bg.muted" borderRadius="md" w="50%" />
        <Flex pt={2} justify="space-between">
          <Box h={3} bg="bg.muted" borderRadius="md" w="30%" />
          <Box h={3} bg="bg.muted" borderRadius="md" w="25%" />
        </Flex>
      </VStack>
    </Box>
  )
}

export const GridVideos = memo(function GridVideos({
  itens,
  carregando = false,
  selecionados,
  variante = 'grid',
  colunas = 5,
  categoriaFiltro = '',
  nomeCategoriaFiltro = '',
  onToggleSelect,
  onSelecionarIntervalo,
  onToggleSelectAll,
  onSelectSomenteSemCategoria,
  onSelectSomenteCategorizados,
  onLimparSelecao,
  onVisualizar,
  onEditarMetadata,
  onCategorizar,
  onRebaixar,
  onRetentar,
  onApagar,
  onForcarGoogleFotos,
}: GridVideosProps) {
  const todosSelecionados = itens.length > 0 && selecionados.length === itens.length
  const algunsSelecionados = selecionados.length > 0 && !todosSelecionados

  const templateColunas = useMemo(() => {
    if (variante === 'compacto') {
      const colsCompacto = Math.min(3, Math.max(1, colunas))
      return {
        base: '1fr',
        md: colsCompacto >= 2 ? 'repeat(2, 1fr)' : '1fr',
        xl: `repeat(${colsCompacto}, 1fr)`,
      }
    }

    const colsSeguras = Math.min(6, Math.max(2, colunas))
    return {
      base: '1fr',
      sm: 'repeat(2, 1fr)',
      md: `repeat(${Math.min(3, colsSeguras)}, 1fr)`,
      lg: `repeat(${Math.min(4, colsSeguras)}, 1fr)`,
      xl: `repeat(${colsSeguras}, 1fr)`,
    }
  }, [variante, colunas])

  const semCategoriaNaPagina = useMemo(
    () => itens.filter((it) => !it.categoriaId && !it.categoria),
    [itens]
  )
  const categorizadosNaPagina = useMemo(
    () => itens.filter((it) => Boolean(it.categoriaId || it.categoria)),
    [itens]
  )

  const todosSemCategoriaMarcados =
    semCategoriaNaPagina.length > 0 &&
    semCategoriaNaPagina.every((it) => selecionados.includes(it.uuid))

  const todosCategorizadosMarcados =
    categorizadosNaPagina.length > 0 &&
    categorizadosNaPagina.every((it) => selecionados.includes(it.uuid))

  const labelBotaoPrincipal = useMemo(() => {
    if (todosSelecionados) return 'Desmarcar todos'
    if (algunsSelecionados) return `Selecionados (${selecionados.length}/${itens.length})`
    if (categoriaFiltro === 'sem_categoria')
      return `Selecionar todos sem categoria (${itens.length})`
    if (categoriaFiltro === 'com_categoria')
      return `Selecionar todos categorizados (${itens.length})`
    if (nomeCategoriaFiltro) return `Selecionar todos de "${nomeCategoriaFiltro}" (${itens.length})`
    return `Selecionar todos os vídeos (${itens.length})`
  }, [
    todosSelecionados,
    algunsSelecionados,
    selecionados.length,
    itens.length,
    categoriaFiltro,
    nomeCategoriaFiltro,
  ])

  if (carregando && itens.length === 0) {
    return (
      <Grid w="full" templateColumns={templateColunas} gap={colunas >= 6 ? 3 : 4}>
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index + 1}`} />
        ))}
      </Grid>
    )
  }

  if (!carregando && itens.length === 0) {
    return (
      <VStack
        w="full"
        align="center"
        justify="center"
        py={16}
        px={4}
        textAlign="center"
        borderRadius="xl"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.subtle"
        bg="bg.panel"
        gap={2}
      >
        <Box
          p={3.5}
          borderRadius="lg"
          bg="cirqueira.brand.500/10"
          color="cirqueira.brand.500"
          mb={2}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
        >
          <Film size={36} strokeWidth={1.5} />
        </Box>
        <Text as="h3" fontSize="md" fontWeight="bold" color="fg">
          Nenhum vídeo encontrado
        </Text>
        <Text fontSize="xs" color="fg.subtle" maxW="md">
          Cole o link de um vídeo do YouTube, TikTok, Instagram ou X acima para iniciar a ingestão e
          download automático.
        </Text>
      </VStack>
    )
  }

  return (
    <VStack w="full" gap={4} alignItems="stretch">
      {itens.length > 0 && onToggleSelectAll && (
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
          gap={2.5}
          p={2}
          px={3}
          borderRadius="xl"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <HStack gap={2} flexWrap="wrap" align="center">
            <Button
              size="sm"
              variant={todosSelecionados ? 'subtle' : 'ghost'}
              colorPalette={todosSelecionados ? 'brand' : 'gray'}
              onClick={onToggleSelectAll}
              fontSize="xs"
              fontWeight="semibold"
              borderRadius="lg"
              h={8}
              px={2.5}
            >
              <HStack gap={2}>
                {todosSelecionados ? (
                  <Box as="span" color="cirqueira.brand.500" display="inline-flex">
                    <CheckSquare size={15} color="currentColor" />
                  </Box>
                ) : (
                  <Square size={15} />
                )}
                <Text as="span">{labelBotaoPrincipal}</Text>
              </HStack>
            </Button>

            {semCategoriaNaPagina.length > 0 && onSelectSomenteSemCategoria && (
              <Button
                size="xs"
                variant={todosSemCategoriaMarcados ? 'solid' : 'subtle'}
                colorPalette={todosSemCategoriaMarcados ? 'amber' : 'gray'}
                onClick={onSelectSomenteSemCategoria}
                borderRadius="lg"
                fontSize="xs"
                h={7}
                px={2.5}
                title="Selecionar ou desmarcar todos os vídeos sem categoria desta página"
              >
                <HStack gap={1.5}>
                  <Tag size={12} />
                  <Text as="span">Sem categoria ({semCategoriaNaPagina.length})</Text>
                </HStack>
              </Button>
            )}

            {categorizadosNaPagina.length > 0 && onSelectSomenteCategorizados && (
              <Button
                size="xs"
                variant={todosCategorizadosMarcados ? 'solid' : 'subtle'}
                colorPalette={todosCategorizadosMarcados ? 'purple' : 'gray'}
                onClick={onSelectSomenteCategorizados}
                borderRadius="lg"
                fontSize="xs"
                h={7}
                px={2.5}
                title="Selecionar ou desmarcar todos os vídeos categorizados desta página"
              >
                <HStack gap={1.5}>
                  <FolderCheck size={12} />
                  <Text as="span">Categorizados ({categorizadosNaPagina.length})</Text>
                </HStack>
              </Button>
            )}

            {selecionados.length > 0 && onLimparSelecao && (
              <Button
                size="xs"
                variant="ghost"
                onClick={onLimparSelecao}
                borderRadius="lg"
                fontSize="xs"
                h={7}
                px={2}
                color="fg.subtle"
                _hover={{ color: 'fg' }}
              >
                <HStack gap={1}>
                  <X size={12} />
                  <Text as="span">Limpar ({selecionados.length})</Text>
                </HStack>
              </Button>
            )}
          </HStack>

          <HStack
            gap={2}
            fontSize="xs"
            color="fg.subtle"
            justify={{ base: 'flex-start', md: 'flex-end' }}
          >
            <Text as="span">
              {itens.length} {itens.length === 1 ? 'vídeo nesta página' : 'vídeos nesta página'}
            </Text>
            {semCategoriaNaPagina.length > 0 && (
              <Badge size="xs" variant="subtle" colorPalette="amber" borderRadius="md">
                {semCategoriaNaPagina.length} sem categoria
              </Badge>
            )}
          </HStack>
        </Flex>
      )}

      <Grid
        w="full"
        templateColumns={templateColunas}
        gap={variante === 'compacto' ? 3 : colunas >= 6 ? 3 : 4}
      >
        {itens.map((item) => (
          <Box
            key={item.uuid}
            display="contents"
            onMouseDownCapture={bloquearSelecaoDeTextoComShift}
            onClickCapture={(evento) =>
              interceptarCliqueComShift(evento, () => onSelecionarIntervalo?.(item.uuid))
            }
          >
            <CardVideo
              item={item}
              selecionado={selecionados.includes(item.uuid)}
              variante={variante}
              colunas={colunas}
              onToggleSelect={onToggleSelect}
              onVisualizar={onVisualizar}
              onEditarMetadata={onEditarMetadata}
              onCategorizar={onCategorizar}
              onRebaixar={onRebaixar}
              onRetentar={onRetentar}
              onApagar={onApagar}
              onForcarGoogleFotos={onForcarGoogleFotos}
            />
          </Box>
        ))}
      </Grid>
    </VStack>
  )
})
