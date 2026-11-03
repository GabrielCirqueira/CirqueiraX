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
      p={{ base: 3, md: 8 }}
      pb={{ base: 24, md: 28 }}
      bg="cirqueira.grey.950"
      backgroundImage="radial-gradient(ellipse at 50% 30%, #252a28 0%, #191b1a 60%, #121313 100%), radial-gradient(1.5px 1.5px at 12% 18%, rgba(0, 186, 156, 0.25), transparent), radial-gradient(1px 1px at 28% 68%, rgba(255, 255, 255, 0.12), transparent), radial-gradient(1.5px 1.5px at 75% 22%, rgba(0, 186, 156, 0.2), transparent), radial-gradient(1px 1px at 88% 70%, rgba(255, 255, 255, 0.12), transparent), radial-gradient(2px 2px at 92% 38%, rgba(0, 186, 156, 0.25), transparent)"
      userSelect="none"
    >
      <IconButton
        position="fixed"
        left={{ base: 3, md: 6, lg: 8 }}
        top="50%"
        transform="translateY(-50%)"
        zIndex={30}
        size="lg"
        w={{ base: '44px', md: '52px' }}
        h={{ base: '44px', md: '52px' }}
        borderRadius="full"
        bg="cirqueira.grey.900/85"
        backdropFilter="blur(16px)"
        border="1px solid"
        borderColor="cirqueira.grey.800"
        color="cirqueira.grey.100"
        shadow="0 10px 30px rgba(0, 0, 0, 0.7)"
        _hover={{
          bg: 'cirqueira.grey.800',
          color: 'white',
          transform: 'translateY(-50%) scale(1.08)',
          borderColor: 'cirqueira.brand.500',
        }}
        disabled={paginaAtual <= 1}
        onClick={onVoltar}
        aria-label="Página anterior"
        title="Página anterior (←)"
      >
        <ChevronLeft size={26} />
      </IconButton>

      <Center minH="full" w="full" py={2}>
        {modoDuplo ? (
          <Box position="relative">
            <Box
              position="absolute"
              inset="-10px"
              bg="cirqueira.grey.900"
              borderRadius="28px"
              boxShadow="0 30px 80px -15px rgba(0, 0, 0, 0.95), 0 10px 30px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.05)"
              border="1px solid"
              borderColor="cirqueira.grey.800"
              zIndex={0}
            />

            <Box
              position="absolute"
              bottom="-15px"
              left="50%"
              transform="translateX(-50%)"
              w="36px"
              h="12px"
              bg="cirqueira.grey.950"
              borderRadius="0 0 8px 8px"
              boxShadow="0 4px 8px rgba(0, 0, 0, 0.9)"
              zIndex={1}
            />

            <HStack position="relative" align="flex-start" justify="center" gap={0} zIndex={2}>
              <Box
                position="relative"
                bg="#ffffff"
                borderTopLeftRadius="18px"
                borderBottomLeftRadius="18px"
                borderTopRightRadius={0}
                borderBottomRightRadius={0}
                overflow="hidden"
                boxShadow="-2px 0 0 #e4dfd7, -4px 1px 0 #cfc9be, -6px 2px 0 #bcaba0, 0 4px 0 #e4dfd7, 0 7px 0 #cfc9be, 0 10px 0 #bcaba0, -18px 20px 40px rgba(0, 0, 0, 0.6)"
              >
                <PaginaPdf documento={documento} numeroPagina={paginaEsquerda} escala={escala} />

                <Box
                  position="absolute"
                  top={0}
                  bottom={0}
                  right={0}
                  w="55px"
                  pointerEvents="none"
                  background="linear-gradient(to left, rgba(0, 0, 0, 0.24) 0%, rgba(0, 0, 0, 0.1) 25%, rgba(0, 0, 0, 0.02) 65%, transparent 100%)"
                  zIndex={3}
                />

                <Box position="absolute" bottom="10px" left="18px" pointerEvents="none" zIndex={4}>
                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color="#71717a"
                    fontVariantNumeric="tabular-nums"
                  >
                    {paginaEsquerda}
                  </Text>
                </Box>
              </Box>

              <Box
                w="6px"
                alignSelf="stretch"
                background="linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.4) 100%)"
                boxShadow="inset 0 0 6px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)"
                zIndex={5}
              />

              <Box
                position="relative"
                bg="#ffffff"
                borderTopRightRadius="18px"
                borderBottomRightRadius="18px"
                borderTopLeftRadius={0}
                borderBottomLeftRadius={0}
                overflow="hidden"
                boxShadow="2px 0 0 #e4dfd7, 4px 1px 0 #cfc9be, 6px 2px 0 #bcaba0, 0 4px 0 #e4dfd7, 0 7px 0 #cfc9be, 0 10px 0 #bcaba0, 18px 20px 40px rgba(0, 0, 0, 0.6)"
              >
                {paginaDireita ? (
                  <>
                    <PaginaPdf documento={documento} numeroPagina={paginaDireita} escala={escala} />

                    <Box
                      position="absolute"
                      top={0}
                      bottom={0}
                      left={0}
                      w="55px"
                      pointerEvents="none"
                      background="linear-gradient(to right, rgba(0, 0, 0, 0.24) 0%, rgba(0, 0, 0, 0.1) 25%, rgba(0, 0, 0, 0.02) 65%, transparent 100%)"
                      zIndex={3}
                    />

                    <Box
                      position="absolute"
                      bottom="10px"
                      right="18px"
                      pointerEvents="none"
                      zIndex={4}
                    >
                      <Text
                        fontSize="11px"
                        fontWeight="600"
                        color="#71717a"
                        fontVariantNumeric="tabular-nums"
                      >
                        {paginaDireita}
                      </Text>
                    </Box>
                  </>
                ) : (
                  <Center w="400px" minH="580px" bg="#faf8f5" p={6} borderLeft="1px solid #e4dfd7">
                    <Text color="#a1a1aa" fontSize="sm" fontWeight="medium">
                      Fim do livro
                    </Text>
                  </Center>
                )}
              </Box>
            </HStack>
          </Box>
        ) : (
          <Box
            position="relative"
            bg="#ffffff"
            borderRadius="18px"
            overflow="hidden"
            boxShadow="0 4px 0 #e4dfd7, 0 8px 0 #cfc9be, 0 12px 0 #bcaba0, 0 25px 60px rgba(0, 0, 0, 0.75)"
          >
            <PaginaPdf documento={documento} numeroPagina={paginaAtual} escala={escala} />

            <Box position="absolute" bottom="12px" right="20px" pointerEvents="none" zIndex={4}>
              <Text
                fontSize="11px"
                fontWeight="600"
                color="#71717a"
                fontVariantNumeric="tabular-nums"
              >
                {paginaAtual}
              </Text>
            </Box>
          </Box>
        )}
      </Center>

      <IconButton
        position="fixed"
        right={{ base: 3, md: 6, lg: 8 }}
        top="50%"
        transform="translateY(-50%)"
        zIndex={30}
        size="lg"
        w={{ base: '44px', md: '52px' }}
        h={{ base: '44px', md: '52px' }}
        borderRadius="full"
        bg="cirqueira.grey.900/85"
        backdropFilter="blur(16px)"
        border="1px solid"
        borderColor="cirqueira.grey.800"
        color="cirqueira.grey.100"
        shadow="0 10px 30px rgba(0, 0, 0, 0.7)"
        _hover={{
          bg: 'cirqueira.grey.800',
          color: 'white',
          transform: 'translateY(-50%) scale(1.08)',
          borderColor: 'cirqueira.brand.500',
        }}
        disabled={paginaAtual >= totalPaginas}
        onClick={onAvancar}
        aria-label="Próxima página"
        title="Próxima página (→)"
      >
        <ChevronRight size={26} />
      </IconButton>
    </Box>
  )
})
