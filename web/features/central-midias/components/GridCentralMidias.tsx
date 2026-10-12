import { Box, Button, Text, VStack } from '@chakra-ui/react'
import { FolderKanban } from 'lucide-react'
import { memo } from 'react'
import type { MediaItem } from '../types'
import { CardMidiaCentral } from './CardMidiaCentral'

export interface GridCentralMidiasProps {
  itens: MediaItem[]
  carregando?: boolean
  selecionados: string[]
  onToggleSelect: (uuid: string) => void
  onVisualizar: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onApagar?: (uuid: string) => void
  onLimparFiltros?: () => void
  temFiltrosAtivos?: boolean
}

export const GridCentralMidias = memo(function GridCentralMidias({
  itens,
  carregando = false,
  selecionados,
  onToggleSelect,
  onVisualizar,
  onCategorizar,
  onApagar,
  onLimparFiltros,
  temFiltrosAtivos = false,
}: GridCentralMidiasProps) {
  if (carregando && itens.length === 0) {
    return (
      <Box className="google-photos-grid" w="full">
        {Array.from({ length: 15 }).map((_, idx) => (
          <Box
            key={`sk-midia-${idx + 1}`}
            className="google-photos-item"
            h={idx % 4 === 0 ? '240px' : idx % 3 === 0 ? '180px' : idx % 2 === 0 ? '290px' : '210px'}
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
        bg="bg.panel"
      >
        <Box
          p={4}
          borderRadius="2xl"
          bg="cirqueira.brand.500/10"
          color="cirqueira.brand.400"
          mb={2}
        >
          <FolderKanban size={38} strokeWidth={1.5} />
        </Box>
        <Text fontSize="lg" fontWeight="bold" color="fg">
          Nenhuma mídia encontrada na central
        </Text>
        <Text fontSize="xs" color="fg.subtle" maxW="md">
          {temFiltrosAtivos
            ? 'Nenhuma mídia corresponde aos filtros de origem, tipo, categoria ou busca selecionados.'
            : 'Faça upload de fotos ou vídeos, baixe mídias de redes sociais ou sincronize prints para ver tudo reunido aqui.'}
        </Text>

        {temFiltrosAtivos && onLimparFiltros && (
          <Button size="xs" variant="outline" onClick={onLimparFiltros} borderRadius="lg" mt={2}>
            Limpar Todos os Filtros
          </Button>
        )}
      </VStack>
    )
  }

  return (
    <Box className="google-photos-grid" w="full">
      {itens.map((item) => (
        <Box key={item.uuid} className="google-photos-item">
          <CardMidiaCentral
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
