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
  onEditarMetadata?: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onRebaixar?: (uuid: string) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
}

function SkeletonCard() {
  return (
    <Box display="flex" flexDirection="column" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" bg="bg.panel" overflow="hidden" shadow="sm">
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
      <Grid w="full" templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
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
        borderRadius="2xl"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.subtle"
        bg="bg.panel"
        gap={2}
      >
        <Box p={4} borderRadius="full" bg="bg.muted" color="fg.subtle" mb={2}>
          <Film size={40} strokeWidth={1.5} />
        </Box>
        <Text as="h3" fontSize="md" fontWeight="semibold" color="fg">
          Nenhum vídeo encontrado
        </Text>
        <Text fontSize="sm" color="fg.subtle" maxW="sm">
          Cole o link de um vídeo do YouTube, TikTok, Twitter ou Instagram acima para iniciar o
          download.
        </Text>
      </VStack>
    )
  }

  return (
    <VStack w="full" gap={4} alignItems="stretch">
      {itens.length > 0 && onToggleSelectAll && (
        <Flex align="center" justify="space-between" px={1} py={1}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleSelectAll}
            fontSize="xs"
            fontWeight="medium"
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
        </Flex>
      )}

      <Grid w="full" templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
        {itens.map((item) => (
          <CardVideo
            key={item.uuid}
            item={item}
            selecionado={selecionados.includes(item.uuid)}
            onToggleSelect={onToggleSelect}
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

