import { Badge, Box, Button, Flex, HStack, Portal, Text } from '@chakra-ui/react'
import { CalendarClock, DownloadCloud, FolderMinus, FolderPlus, Loader2, Trash2, X } from 'lucide-react'
import { memo } from 'react'

export interface BarraAcoesEmLoteProps {
  totalSelecionados: number
  selecionados: string[]
  onLimparSelecao: () => void
  onDistribuirHorariosLote?: () => void
  onCategorizarLote: () => void
  onRemoverCategoriaLote: () => void
  onRebaixarLote: () => void
  onApagarLote: () => void
  processando?: boolean
}

export const BarraAcoesEmLote = memo(function BarraAcoesEmLote({
  totalSelecionados,
  onLimparSelecao,
  onDistribuirHorariosLote,
  onCategorizarLote,
  onRemoverCategoriaLote,
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
        w="max-content"
        maxW="calc(100vw - 32px)"
        pointerEvents="auto"
      >
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          justify="space-between"
          gap={{ base: 2.5, sm: 3 }}
          p={2.5}
          px={{ base: 3, sm: 4 }}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="cirqueira.brand.500/40"
          bg="rgba(18, 22, 20, 0.96)"
          shadow="0 20px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(0, 186, 156, 0.2)"
        >
          <HStack gap={2} flexShrink={0} align="center">
            <Badge colorPalette="brand" px={2} py={0.5} borderRadius="md" fontWeight="bold">
              {totalSelecionados}
            </Badge>
            <Text
              as="span"
              fontSize="xs"
              fontWeight="semibold"
              color="fg"
              whiteSpace="nowrap"
            >
              {totalSelecionados === 1 ? 'item selecionado' : 'itens selecionados'}
            </Text>
            <Button
              size="xs"
              variant="ghost"
              disabled={processando}
              onClick={onLimparSelecao}
              aria-label="Desmarcar todos"
              p={1}
              h={6}
              w={6}
              minW={6}
              borderRadius="md"
              color="fg.subtle"
              _hover={{ color: 'fg', bg: 'whiteAlpha.100' }}
              title="Desmarcar todos"
            >
              <X size={14} />
            </Button>
          </HStack>

          <Box
            display={{ base: 'none', sm: 'block' }}
            w="1px"
            h="20px"
            bg="border.subtle"
            flexShrink={0}
          />

          <HStack
            gap={2}
            w={{ base: 'full', sm: 'auto' }}
            justify={{ base: 'center', sm: 'flex-end' }}
            align="center"
            flexWrap={{ base: 'wrap', md: 'nowrap' }}
          >
            {onDistribuirHorariosLote && (
              <Button
                size="sm"
                variant="subtle"
                colorPalette="brand"
                disabled={processando}
                onClick={onDistribuirHorariosLote}
                borderRadius="lg"
                whiteSpace="nowrap"
                flexShrink={0}
              >
                <CalendarClock size={14} style={{ marginRight: '6px' }} />
                <Text as="span" whiteSpace="nowrap">Distribuir Horários</Text>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              disabled={processando}
              onClick={onCategorizarLote}
              borderRadius="lg"
              whiteSpace="nowrap"
              flexShrink={0}
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
              <Text as="span" whiteSpace="nowrap">Categorizar</Text>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled={processando}
              onClick={onRemoverCategoriaLote}
              borderRadius="lg"
              whiteSpace="nowrap"
              flexShrink={0}
            >
              <Box as="span" color="cirqueira.amber.500" display="inline-flex" mr={1.5}>
                <FolderMinus size={14} color="currentColor" />
              </Box>
              <Text as="span" whiteSpace="nowrap">Remover categoria</Text>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled={processando}
              onClick={onRebaixarLote}
              borderRadius="lg"
              whiteSpace="nowrap"
              flexShrink={0}
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
              <Text as="span" whiteSpace="nowrap">Rebaixar</Text>
            </Button>

            <Button
              size="sm"
              variant="subtle"
              colorPalette="red"
              disabled={processando}
              onClick={onApagarLote}
              borderRadius="lg"
              whiteSpace="nowrap"
              flexShrink={0}
            >
              {processando ? (
                <Loader2
                  size={14}
                  style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                />
              ) : (
                <Trash2 size={14} style={{ marginRight: '6px' }} />
              )}
              <Text as="span" whiteSpace="nowrap">Apagar</Text>
            </Button>
          </HStack>
        </Flex>
      </Box>
    </Portal>
  )
})
