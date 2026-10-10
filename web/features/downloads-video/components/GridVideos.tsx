import { Box, Button, Flex, Grid, HStack, Text, VStack } from '@chakra-ui/react'
import { CheckSquare, Film, Square } from 'lucide-react'
import { memo } from 'react'
import type { MediaItem } from '../types'
import { CardVideo } from './CardVideo'

export interface GridVideosProps {
  itens: MediaItem[]
  carregando?: boolean
  selecionados: string[]
  onToggleSelect: (uuid: string) => void
  onToggleSelectAll?: () => void
  onVisualizar?: (item: MediaItem) => void
  onEditarMetadata?: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onRebaixar?: (uuid: string) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
}

function SkeletonCard() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      borderRadius="xl"
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
  onToggleSelect,
  onToggleSelectAll,
  onVisualizar,
  onEditarMetadata,
  onCategorizar,
  onRebaixar,
  onRetentar,
  onApagar,
}: GridVideosProps) {
  const todosSelecionados = itens.length > 0 && selecionados.length === itens.length
  const algunsSelecionados = selecionados.length > 0 && !todosSelecionados

  if (carregando && itens.length === 0) {
    return (
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
        <Flex align="center" justify="space-between" px={1}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleSelectAll}
            fontSize="xs"
            fontWeight="medium"
            color="fg.subtle"
            _hover={{ color: 'fg' }}
            borderRadius="lg"
          >
            <HStack gap={2}>
              {todosSelecionados ? (
                <Box as="span" color="cirqueira.brand.500" display="inline-flex">
                  <CheckSquare size={15} color="currentColor" />
                </Box>
              ) : (
                <Square size={15} />
              )}
              <Text as="span">
                {todosSelecionados
                  ? 'Desmarcar todos'
                  : algunsSelecionados
                    ? `Selecionados (${selecionados.length}/${itens.length})`
                    : 'Selecionar todos os vídeos'}
              </Text>
            </HStack>
          </Button>

          <Text fontSize="xs" color="fg.subtle">
            {itens.length} {itens.length === 1 ? 'vídeo nesta página' : 'vídeos nesta página'}
          </Text>
        </Flex>
      )}

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
        {itens.map((item) => (
          <CardVideo
            key={item.uuid}
            item={item}
            selecionado={selecionados.includes(item.uuid)}
            onToggleSelect={onToggleSelect}
            onVisualizar={onVisualizar}
            onEditarMetadata={onEditarMetadata}
            onCategorizar={onCategorizar}
            onRebaixar={onRebaixar}
            onRetentar={onRetentar}
            onApagar={onApagar}
          />
        ))}
      </Grid>
    </VStack>
  )
})
