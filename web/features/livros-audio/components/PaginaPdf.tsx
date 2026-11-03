import { Box, Center, Spinner, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { LocalizacaoTrecho } from '../utils/localizacaoNarracao'
import {
  type PDFDocumentProxy,
  type TarefaRenderizacaoPagina,
  calcularRetangulosDestaque,
  obterItensTextoPagina,
  renderizarPaginaEmCanvas,
} from '../utils/pdf'

interface PaginaPdfProps {
  documento: PDFDocumentProxy
  numeroPagina: number
  escala?: number
  destaque?: LocalizacaoTrecho | null
  seguirDestaque?: boolean
}

export function PaginaPdf({
  documento,
  numeroPagina,
  escala = 1.5,
  destaque = null,
  seguirDestaque = false,
}: PaginaPdfProps) {
  const tarefaRef = useRef<TarefaRenderizacaoPagina | null>(null)
  const primeiroDestaqueRef = useRef<HTMLDivElement | null>(null)

  const {
    data: paginaPdf,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['pdf-page', documento.fingerprints?.[0] ?? 'doc', numeroPagina],
    queryFn: () => documento.getPage(numeroPagina),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const segmentosDaPagina = useMemo(
    () => destaque?.segmentos.filter((segmento) => segmento.pagina === numeroPagina) ?? [],
    [destaque, numeroPagina]
  )

  const { data: itensTexto } = useQuery({
    queryKey: ['pdf-texto', documento.fingerprints?.[0] ?? 'doc', numeroPagina],
    queryFn: () => obterItensTextoPagina(documento, numeroPagina),
    enabled: segmentosDaPagina.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const retangulosDestaque = useMemo(
    () =>
      paginaPdf && itensTexto && segmentosDaPagina.length > 0
        ? calcularRetangulosDestaque(paginaPdf, itensTexto, segmentosDaPagina)
        : [],
    [paginaPdf, itensTexto, segmentosDaPagina]
  )

  useEffect(() => {
    if (seguirDestaque && retangulosDestaque.length > 0) {
      primeiroDestaqueRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [retangulosDestaque, seguirDestaque])

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

      {retangulosDestaque.map((retangulo, indice) => (
        <Box
          key={`${retangulo.esquerda}-${retangulo.topo}`}
          ref={indice === 0 ? primeiroDestaqueRef : undefined}
          position="absolute"
          left={`${retangulo.esquerda}%`}
          top={`${retangulo.topo}%`}
          w={`${retangulo.largura}%`}
          h={`${retangulo.altura}%`}
          bg="cirqueira.brand.300/45"
          mixBlendMode="multiply"
          borderRadius="2px"
          pointerEvents="none"
          zIndex={1}
        />
      ))}
    </Box>
  )
}
