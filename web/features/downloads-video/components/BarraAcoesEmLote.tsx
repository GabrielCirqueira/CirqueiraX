import { Badge, Box, Button, Flex, HStack, Text } from '@chakra-ui/react'
import { DownloadCloud, FolderPlus, Loader2, Trash2, X } from 'lucide-react'
import { memo } from 'react'

export interface BarraAcoesEmLoteProps {
  totalSelecionados: number
  selecionados: string[]
  onLimparSelecao: () => void
  onCategorizarLote: () => void
  onRebaixarLote: () => void
  onApagarLote: () => void
  processando?: boolean
}

export const BarraAcoesEmLote = memo(function BarraAcoesEmLote({
  totalSelecionados,
  onLimparSelecao,
  onCategorizarLote,
  onRebaixarLote,
  onApagarLote,
  processando = false,
}: BarraAcoesEmLoteProps) {
  if (totalSelecionados === 0) {
    return null
  }

  return (
    <Box
      position="fixed"
      bottom={6}
      left="50%"
      transform="translateX(-50%)"
      zIndex={50}
      w="92%"
      maxW="2xl"
    >
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align="center"
        justify="space-between"
        gap={3}
        p={3}
        px={{ sm: 5 }}
        py={{ sm: 3.5 }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
        backdropFilter="blur(16px)"
        shadow="2xl"
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
          >
            <X size={16} />
          </Button>
        </HStack>

        <HStack gap={2} w={{ base: 'full', sm: 'auto' }} justify="flex-end">
          <Button
            size="sm"
            variant="ghost"
            disabled={processando}
            onClick={onCategorizarLote}
            borderRadius="xl"
          >
            {processando ? (
              <Loader2
                size={14}
                style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
              />
            ) : (
              <FolderPlus size={14} color="#8b5cf6" style={{ marginRight: '6px' }} />
            )}
            <Text as="span">Categorizar</Text>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={processando}
            onClick={onRebaixarLote}
            borderRadius="xl"
          >
            {processando ? (
              <Loader2
                size={14}
                style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
              />
            ) : (
              <DownloadCloud size={14} color="#3b82f6" style={{ marginRight: '6px' }} />
            )}
            <Text as="span">Rebaixar</Text>
          </Button>

          <Button
            size="sm"
            variant="subtle"
            colorPalette="red"
            disabled={processando}
            onClick={onApagarLote}
            borderRadius="xl"
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
  )
})
