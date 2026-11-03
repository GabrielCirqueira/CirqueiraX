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
  destaquePalavra?: LocalizacaoTrecho | null
  seguirDestaque?: boolean
}

const TRANSICAO_FRASE =
  'left 0.28s ease-out, top 0.28s ease-out, width 0.28s ease-out, height 0.28s ease-out, background-color 0.2s ease'
const TRANSICAO_PALAVRA =
  'left 0.14s ease-out, top 0.14s ease-out, width 0.14s ease-out, height 0.14s ease-out'

function filtrarSegmentos(destaque: LocalizacaoTrecho | null, numeroPagina: number) {
  return destaque?.segmentos.filter((segmento) => segmento.pagina === numeroPagina) ?? []
}

export function PaginaPdf({
  documento,
  numeroPagina,
  escala = 1.5,
  destaque = null,
  destaquePalavra = null,
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
    () => filtrarSegmentos(destaque, numeroPagina),
    [destaque, numeroPagina]
  )
  const segmentosPalavra = useMemo(
    () => filtrarSegmentos(destaquePalavra, numeroPagina),
    [destaquePalavra, numeroPagina]
  )
  const modoPalavra = destaquePalavra !== null

  const { data: itensTexto } = useQuery({
    queryKey: ['pdf-texto', documento.fingerprints?.[0] ?? 'doc', numeroPagina],
    queryFn: () => obterItensTextoPagina(documento, numeroPagina),
    enabled: segmentosDaPagina.length > 0 || segmentosPalavra.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const retangulosDestaque = useMemo(
    () =>
      paginaPdf && itensTexto && segmentosDaPagina.length > 0
        ? calcularRetangulosDestaque(paginaPdf, itensTexto, segmentosDaPagina)
        : [],
    [paginaPdf, itensTexto, segmentosDaPagina]
  )

  const retangulosPalavra = useMemo(
    () =>
      paginaPdf && itensTexto && segmentosPalavra.length > 0
        ? calcularRetangulosDestaque(paginaPdf, itensTexto, segmentosPalavra)
        : [],
    [paginaPdf, itensTexto, segmentosPalavra]
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
          key={`frase-${indice}`}
          ref={indice === 0 ? primeiroDestaqueRef : undefined}
          position="absolute"
          left={`${retangulo.esquerda}%`}
          top={`${retangulo.topo}%`}
          w={`${retangulo.largura}%`}
          h={`${retangulo.altura}%`}
          bg={modoPalavra ? 'cirqueira.brand.200/25' : 'cirqueira.brand.300/45'}
          mixBlendMode="multiply"
          borderRadius="3px"
          pointerEvents="none"
          transition={TRANSICAO_FRASE}
          animation="fade-in 0.25s ease-out"
          zIndex={1}
        />
      ))}

      {retangulosPalavra.map((retangulo, indice) => (
        <Box
          key={`palavra-${indice}`}
          position="absolute"
          left={`${retangulo.esquerda}%`}
          top={`${retangulo.topo}%`}
          w={`${retangulo.largura}%`}
          h={`${retangulo.altura}%`}
          bg="cirqueira.brand.400/55"
          mixBlendMode="multiply"
          borderRadius="4px"
          pointerEvents="none"
          transition={TRANSICAO_PALAVRA}
          animation="fade-in 0.15s ease-out"
          zIndex={1}
        />
      ))}
    </Box>
  )
}
