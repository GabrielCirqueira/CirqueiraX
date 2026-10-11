import { Box, Text, VStack } from '@chakra-ui/react'
import { Camera } from 'lucide-react'
import { memo } from 'react'
import type { MediaItem } from '../types'
import { CardPrint } from './CardPrint'

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
      <Box className="google-photos-grid" w="full">
        {Array.from({ length: 12 }).map((_, idx) => (
          <Box
            key={`sk-print-${idx + 1}`}
            className="google-photos-item"
            h={idx % 3 === 0 ? '220px' : idx % 2 === 0 ? '160px' : '280px'}
            bg="bg.muted"
            borderRadius="md"
            animation="pulse 1.5s infinite"
          />
        ))}
      </Box>
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
          Tire capturas de tela no seu computador (Win + Shift + S ou PrintScreen) e o Agente
          CirqueiraX sincronizará seus prints automaticamente aqui.
        </Text>
      </VStack>
    )
  }

  return (
    <Box className="google-photos-grid" w="full">
      {itens.map((item) => (
        <Box key={item.uuid} className="google-photos-item">
          <CardPrint
            item={item}
            selecionado={selecionados.includes(item.uuid)}
            onToggleSelect={onToggleSelect}
            onVisualizar={onVisualizar}
            onCategorizar={onCategorizar}
            onApagar={onApagar}
          />
        </Box>
      ))}
    </Box>
  )
})
