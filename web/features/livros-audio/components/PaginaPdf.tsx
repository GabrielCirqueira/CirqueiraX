import { Box, Center, Spinner, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import {
  type PDFDocumentProxy,
  type TarefaRenderizacaoPagina,
  renderizarPaginaEmCanvas,
} from '../utils/pdf'

interface PaginaPdfProps {
  documento: PDFDocumentProxy
  numeroPagina: number
  escala?: number
}

export function PaginaPdf({ documento, numeroPagina, escala = 1.5 }: PaginaPdfProps) {
  const tarefaRef = useRef<TarefaRenderizacaoPagina | null>(null)

  const {
    data: paginaPdf,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['pdf-page', documento.fingerprints?.[0] ?? 'doc', numeroPagina],
    queryFn: () => documento.getPage(numeroPagina),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const atribuirRefCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (tarefaRef.current) {
        tarefaRef.current.cancelar()
        tarefaRef.current = null
      }

      if (canvas && paginaPdf) {
        tarefaRef.current = renderizarPaginaEmCanvas(paginaPdf, canvas, escala)
      }
    },
    [paginaPdf, escala]
  )

  if (isError) {
    return (
      <Center
        w="full"
        minH="400px"
        bg="cirqueira.grey.900"
        borderRadius="xl"
        border="1px solid"
        borderColor="cirqueira.red.500/30"
        p={6}
      >
        <Text color="cirqueira.red.400" fontSize="sm">
          Não foi possível carregar a página {numeroPagina}.
        </Text>
      </Center>
    )
  }

  return (
    <Box position="relative" display="inline-block" maxW="full">
      {isLoading && (
        <Center
          position="absolute"
          inset={0}
          bg="rgba(255, 255, 255, 0.7)"
          backdropFilter="blur(2px)"
          zIndex={2}
        >
          <Spinner size="lg" color="cirqueira.brand.500" />
        </Center>
      )}

      <Box
        as="canvas"
        ref={atribuirRefCanvas}
        display="block"
        maxW="full"
        h="auto"
        bg="transparent"
      />
    </Box>
  )
}
