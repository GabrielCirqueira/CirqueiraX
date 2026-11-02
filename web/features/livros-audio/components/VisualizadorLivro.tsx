import { Box, Center, HStack, IconButton, Text } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type KeyboardEvent, memo, useRef } from 'react'
import type { PDFDocumentProxy } from '../utils/pdf'
import { PaginaPdf } from './PaginaPdf'

interface VisualizadorLivroProps {
  documento: PDFDocumentProxy
  paginaAtual: number
  totalPaginas: number
  escala: number
  modoDuplo: boolean
  onAvancar: () => void
  onVoltar: () => void
}

export const VisualizadorLivro = memo(function VisualizadorLivro({
  documento,
  paginaAtual,
  totalPaginas,
  escala,
  modoDuplo,
  onAvancar,
  onVoltar,
}: VisualizadorLivroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const paginaEsquerda = paginaAtual
  const paginaDireita = modoDuplo && paginaAtual + 1 <= totalPaginas ? paginaAtual + 1 : null

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault()
      onAvancar()
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault()
      onVoltar()
    }
  }

  return (
    <Box
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      outline="none"
      position="relative"
      flex={1}
      w="full"
      h="full"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="auto"
      p={{ base: 2, md: 6 }}
      bg="cirqueira.grey.950"
      userSelect="none"
    >
      <IconButton
        position="absolute"
        left={{ base: 2, md: 4 }}
        top="50%"
        transform="translateY(-50%)"
        zIndex={10}
        size="lg"
        variant="ghost"
        borderRadius="full"
        bg="cirqueira.grey.900/60"
        backdropFilter="blur(6px)"
        border="1px solid"
        borderColor="cirqueira.grey.800"
        color="cirqueira.grey.300"
        _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.800' }}
        disabled={paginaAtual <= 1}
        onClick={onVoltar}
        aria-label="Página anterior"
        title="Página anterior (←)"
      >
        <ChevronLeft size={24} />
      </IconButton>

      <Center minH="full" w="full" py={4}>
        {modoDuplo ? (
          <HStack
            align="flex-start"
            justify="center"
            gap={0}
            bg="cirqueira.grey.900"
            p={1}
            borderRadius="2xl"
            shadow="2xl"
            border="1px solid"
            borderColor="cirqueira.grey.800"
            position="relative"
          >
            <Box position="relative">
              <PaginaPdf documento={documento} numeroPagina={paginaEsquerda} escala={escala} />
            </Box>

            <Box
              w="12px"
              alignSelf="stretch"
              bg="linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.1), rgba(0,0,0,0.5))"
              boxShadow="inset 0 0 10px rgba(0,0,0,0.6)"
              zIndex={5}
            />

            <Box position="relative">
              {paginaDireita ? (
                <PaginaPdf documento={documento} numeroPagina={paginaDireita} escala={escala} />
              ) : (
                <Center
                  w="400px"
                  h="600px"
                  bg="cirqueira.grey.950"
                  borderRadius="xl"
                  border="1px dashed"
                  borderColor="cirqueira.grey.800"
                  p={6}
                >
                  <Text color="cirqueira.grey.500" fontSize="sm">
                    Fim do livro
                  </Text>
                </Center>
              )}
            </Box>
          </HStack>
        ) : (
          <Box
            p={1}
            borderRadius="2xl"
            shadow="2xl"
            border="1px solid"
            borderColor="cirqueira.grey.800"
            bg="cirqueira.grey.900"
          >
            <PaginaPdf documento={documento} numeroPagina={paginaAtual} escala={escala} />
          </Box>
        )}
      </Center>

      <IconButton
        position="absolute"
        right={{ base: 2, md: 4 }}
        top="50%"
        transform="translateY(-50%)"
        zIndex={10}
        size="lg"
        variant="ghost"
        borderRadius="full"
        bg="cirqueira.grey.900/60"
        backdropFilter="blur(6px)"
        border="1px solid"
        borderColor="cirqueira.grey.800"
        color="cirqueira.grey.300"
        _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.800' }}
        disabled={paginaAtual >= totalPaginas}
        onClick={onAvancar}
        aria-label="Próxima página"
        title="Próxima página (→)"
      >
        <ChevronRight size={24} />
      </IconButton>
    </Box>
  )
})
