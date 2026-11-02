import { Badge, Box, Button, HStack, IconButton, Slider, Text } from '@chakra-ui/react'
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { memo } from 'react'

interface BarraInferiorLeitorProps {
  paginaAtual: number
  totalPaginas: number
  marcadorSalvo: number
  salvando: boolean
  onMudarPagina: (pagina: number) => void
  onAvancar: () => void
  onVoltar: () => void
  onSalvarMarcador: () => void
}

export const BarraInferiorLeitor = memo(function BarraInferiorLeitor({
  paginaAtual,
  totalPaginas,
  marcadorSalvo,
  salvando,
  onMudarPagina,
  onAvancar,
  onVoltar,
  onSalvarMarcador,
}: BarraInferiorLeitorProps) {
  const percentual = totalPaginas > 0 ? Math.round((paginaAtual / totalPaginas) * 100) : 0
  const isPosicaoSalva = paginaAtual === marcadorSalvo

  return (
    <Box
      w="full"
      py={3}
      px={{ base: 3, md: 6 }}
      bg="cirqueira.grey.950"
      borderTop="1px solid"
      borderColor="cirqueira.grey.900"
      zIndex={20}
    >
      <HStack
        w="full"
        maxW="1200px"
        mx="auto"
        justify="space-between"
        align="center"
        gap={{ base: 3, md: 6 }}
      >
        <HStack gap={2} align="center">
          <IconButton
            size="sm"
            variant="ghost"
            borderRadius="lg"
            color="cirqueira.grey.300"
            _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
            disabled={paginaAtual <= 1}
            onClick={onVoltar}
            aria-label="Página anterior (Seta esquerda)"
            title="Página anterior (←)"
          >
            <ChevronLeft size={20} />
          </IconButton>

          <Text
            fontSize="xs"
            color="cirqueira.grey.300"
            fontWeight="bold"
            minW="90px"
            textAlign="center"
            fontVariantNumeric="tabular-nums"
          >
            {paginaAtual} / {totalPaginas}
          </Text>

          <IconButton
            size="sm"
            variant="ghost"
            borderRadius="lg"
            color="cirqueira.grey.300"
            _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
            disabled={paginaAtual >= totalPaginas}
            onClick={onAvancar}
            aria-label="Próxima página (Seta direita)"
            title="Próxima página (→)"
          >
            <ChevronRight size={20} />
          </IconButton>
        </HStack>

        <Box flex={1} maxW="600px">
          <Slider.Root
            size="sm"
            min={1}
            max={Math.max(1, totalPaginas)}
            step={1}
            value={[paginaAtual]}
            onValueChange={({ value }) => {
              const [novaPagina = paginaAtual] = value
              onMudarPagina(novaPagina)
            }}
            colorPalette="brand"
          >
            <Slider.Control>
              <Slider.Track bg="cirqueira.grey.900" h={1.5} borderRadius="full">
                <Slider.Range borderRadius="full" />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
        </Box>

        <HStack gap={3} align="center">
          <Badge
            size="sm"
            variant="outline"
            colorPalette="brand"
            borderRadius="md"
            px={2}
            py={0.5}
            fontVariantNumeric="tabular-nums"
          >
            {percentual}% lido
          </Badge>

          <Button
            size="xs"
            variant={isPosicaoSalva ? 'subtle' : 'solid'}
            colorPalette={isPosicaoSalva ? 'green' : 'brand'}
            bg={isPosicaoSalva ? 'cirqueira.green.500/15' : 'cirqueira.brand.500'}
            color={isPosicaoSalva ? 'cirqueira.green.400' : 'cirqueira.grey.0'}
            borderRadius="lg"
            px={3}
            disabled={salvando}
            onClick={onSalvarMarcador}
            title={isPosicaoSalva ? 'Marcador salvo nesta página' : 'Salvar marcador nesta página'}
          >
            {isPosicaoSalva ? (
              <HStack gap={1}>
                <BookmarkCheck size={13} />
                <Text as="span" display={{ base: 'none', sm: 'inline' }}>
                  Marcador Salvo
                </Text>
              </HStack>
            ) : (
              <HStack gap={1}>
                <Bookmark size={13} />
                <Text as="span" display={{ base: 'none', sm: 'inline' }}>
                  {salvando ? 'Salvando...' : 'Salvar Marcador'}
                </Text>
              </HStack>
            )}
          </Button>
        </HStack>
      </HStack>
    </Box>
  )
})
