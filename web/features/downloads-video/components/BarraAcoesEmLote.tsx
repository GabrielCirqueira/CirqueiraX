import { Badge, Box, Button, Flex, HStack, Portal, Text } from '@chakra-ui/react'
import { CalendarClock, DownloadCloud, FolderPlus, Loader2, Trash2, X } from 'lucide-react'
import { memo } from 'react'

export interface BarraAcoesEmLoteProps {
  totalSelecionados: number
  selecionados: string[]
  onLimparSelecao: () => void
  onDistribuirHorariosLote?: () => void
  onCategorizarLote: () => void
  onRebaixarLote: () => void
  onApagarLote: () => void
  processando?: boolean
}

export const BarraAcoesEmLote = memo(function BarraAcoesEmLote({
  totalSelecionados,
  onLimparSelecao,
  onDistribuirHorariosLote,
  onCategorizarLote,
  onRebaixarLote,
  onApagarLote,
  processando = false,
}: BarraAcoesEmLoteProps) {
  if (totalSelecionados === 0) {
    return null
  }

  return (
    <Portal>
      <Box
        position="fixed"
        bottom={{ base: 4, md: 6 }}
        left="50%"
        transform="translateX(-50%)"
        zIndex={1100}
        w="92%"
        maxW="2xl"
        pointerEvents="auto"
      >
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          justify="space-between"
          gap={3}
          p={3}
          px={{ base: 3, sm: 5 }}
          py={{ base: 2.5, sm: 3 }}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="cirqueira.brand.500/40"
          bg="rgba(20, 25, 23, 0.94)"
          backdropFilter="blur(20px)"
          shadow="0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 186, 156, 0.2)"
        >
        <HStack gap={2.5}>
          <Badge colorPalette="brand" px={2} py={0.5} borderRadius="md" fontWeight="bold">
            {totalSelecionados}
          </Badge>
          <Text as="span" fontSize="sm" fontWeight="medium" color="fg">
            {totalSelecionados === 1 ? 'item selecionado' : 'itens selecionados'}
          </Text>
          <Button
            size="xs"
            variant="ghost"
            disabled={processando}
            onClick={onLimparSelecao}
            aria-label="Desmarcar todos"
            p={1}
            borderRadius="lg"
          >
            <X size={15} />
          </Button>
        </HStack>

        <HStack gap={2} w={{ base: 'full', sm: 'auto' }} justify="flex-end">
          {onDistribuirHorariosLote && (
            <Button
              size="sm"
              variant="subtle"
              colorPalette="brand"
              disabled={processando}
              onClick={onDistribuirHorariosLote}
              borderRadius="lg"
            >
              <CalendarClock size={14} style={{ marginRight: '6px' }} />
              <Text as="span">Distribuir Horários</Text>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            disabled={processando}
            onClick={onCategorizarLote}
            borderRadius="lg"
          >
            {processando ? (
              <Loader2
                size={14}
                style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
              />
            ) : (
              <Box as="span" color="cirqueira.purple.500" display="inline-flex" mr={1.5}>
                <FolderPlus size={14} color="currentColor" />
              </Box>
            )}
            <Text as="span">Categorizar</Text>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={processando}
            onClick={onRebaixarLote}
            borderRadius="lg"
          >
            {processando ? (
              <Loader2
                size={14}
                style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
              />
            ) : (
              <Box as="span" color="cirqueira.blue.500" display="inline-flex" mr={1.5}>
                <DownloadCloud size={14} color="currentColor" />
              </Box>
            )}
            <Text as="span">Rebaixar</Text>
          </Button>

          <Button
            size="sm"
            variant="subtle"
            colorPalette="red"
            disabled={processando}
            onClick={onApagarLote}
            borderRadius="lg"
          >
            {processando ? (
              <Loader2
                size={14}
                style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
              />
            ) : (
              <Trash2 size={14} style={{ marginRight: '6px' }} />
            )}
            <Text as="span">Apagar</Text>
          </Button>
        </HStack>
      </Flex>
    </Box>
  </Portal>
  )
})
