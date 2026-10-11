import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Camera } from 'lucide-react'
import { memo } from 'react'
import { CardPrint } from './CardPrint'
import type { MediaItem } from '../types'

export interface GridPrintsProps {
  itens: MediaItem[]
  carregando?: boolean
  selecionados: string[]
  onToggleSelect: (uuid: string) => void
  onVisualizar: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onApagar?: (uuid: string) => void
}

export const GridPrints = memo(function GridPrints({
  itens,
  carregando = false,
  selecionados,
  onToggleSelect,
  onVisualizar,
  onCategorizar,
  onApagar,
}: GridPrintsProps) {
  if (carregando && itens.length === 0) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={5}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <Box
            key={`sk-print-${idx + 1}`}
            h="240px"
            bg="bg.muted"
            borderRadius="xl"
            animation="pulse 1.5s infinite"
          />
        ))}
      </SimpleGrid>
    )
  }

  if (!carregando && itens.length === 0) {
    return (
      <VStack
        w="full"
        align="center"
        justify="center"
        py={20}
        px={4}
        textAlign="center"
        borderRadius="2xl"
        borderWidth="2px"
        borderStyle="dashed"
        borderColor="border.subtle"
        bg="bg.subtle/30"
      >
        <Box
          p={4}
          borderRadius="2xl"
          bg="cirqueira.brand.500/10"
          color="cirqueira.brand.400"
          mb={2}
        >
          <Camera size={38} strokeWidth={1.5} />
        </Box>
        <Text fontSize="lg" fontWeight="bold" color="fg">
          Nenhum print sincronizado
        </Text>
        <Text fontSize="sm" color="fg.subtle" maxW="md">
          Tire capturas de tela no seu computador (Win + Shift + S ou PrintScreen) e o Agente CirqueiraX sincronizará seus prints automaticamente aqui.
        </Text>
      </VStack>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={5}>
      {itens.map((item) => (
        <CardPrint
          key={item.uuid}
          item={item}
          selecionado={selecionados.includes(item.uuid)}
          onToggleSelect={onToggleSelect}
          onVisualizar={onVisualizar}
          onCategorizar={onCategorizar}
          onApagar={onApagar}
        />
      ))}
    </SimpleGrid>
  )
})
