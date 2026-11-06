import { Box, Center, Spinner, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { type MouseEvent, useCallback, useEffect, useMemo, useRef } from 'react'
import type { MarcacaoLivro, TemaPagina } from '../types'
import type { LocalizacaoTrecho } from '../utils/localizacaoNarracao'
import {
  type PDFDocumentProxy,
  type PosicaoNoTexto,
  type SegmentoDestaque,
  type TarefaRenderizacaoPagina,
  calcularRetangulosDestaque,
  localizarPosicaoNoTexto,
  obterItensTextoPagina,
  renderizarPaginaEmCanvas,
} from '../utils/pdf'

export interface CliqueTextoPagina {
  pagina: number
  posicao: PosicaoNoTexto
  x: number
  y: number
}

export const FILTRO_TEMA_PAGINA: Record<TemaPagina, string | undefined> = {
  claro: undefined,
  sepia: 'sepia(0.55) saturate(1.15) brightness(0.95) contrast(0.95)',
  escuro: 'invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(0.92)',
}

export const FUNDO_TEMA_PAGINA: Record<TemaPagina, string> = {
  claro: 'white',
  sepia: '#efe3c8',
  escuro: '#1c1c1e',
}

const COR_MARCACAO: Record<string, string> = {
  destaque: 'rgba(250, 204, 21, 0.38)',
  nota: 'rgba(251, 146, 60, 0.38)',
}

interface PaginaPdfProps {
  documento: PDFDocumentProxy
  numeroPagina: number
  escala?: number
  destaque?: LocalizacaoTrecho | null
  destaquePalavra?: LocalizacaoTrecho | null
  seguirDestaque?: boolean
  tema?: TemaPagina
  marcacoes?: MarcacaoLivro[]
  destaqueBusca?: SegmentoDestaque[]
  onClicarTexto?: (clique: CliqueTextoPagina) => void
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
  tema = 'claro',
  marcacoes = [],
  destaqueBusca = [],
  onClicarTexto,
}: PaginaPdfProps) {
  const escuro = tema === 'escuro'
  const mistura = escuro ? 'screen' : 'multiply'
  const buscaDaPagina = useMemo(
    () => destaqueBusca.filter((segmento) => segmento.pagina === numeroPagina),
    [destaqueBusca, numeroPagina]
  )
  const retangulosMarcacoes = useMemo(
    () =>
      marcacoes.flatMap((marcacao) =>
        marcacao.retangulos
          .filter((retangulo) => retangulo.pagina === numeroPagina)
          .map((retangulo, indice) => ({
            ...retangulo,
            chave: `${marcacao.uuid}-${indice}`,
            tipo: marcacao.tipo,
          }))
      ),
    [marcacoes, numeroPagina]
  )
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
    enabled:
      segmentosDaPagina.length > 0 || segmentosPalavra.length > 0 || buscaDaPagina.length > 0,
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

  const retangulosBusca = useMemo(
    () =>
      paginaPdf && itensTexto && buscaDaPagina.length > 0
        ? calcularRetangulosDestaque(paginaPdf, itensTexto, buscaDaPagina)
        : [],
    [paginaPdf, itensTexto, buscaDaPagina]
  )

  async function tratarClique(evento: MouseEvent<HTMLDivElement>) {
    if (!onClicarTexto || !paginaPdf) return
    const area = evento.currentTarget.getBoundingClientRect()
    const x = ((evento.clientX - area.left) / area.width) * 100
    const y = ((evento.clientY - area.top) / area.height) * 100
    const { clientX, clientY } = evento
    const itens = await obterItensTextoPagina(documento, numeroPagina)
    const posicao = localizarPosicaoNoTexto(paginaPdf, itens, x, y)
    if (posicao) onClicarTexto({ pagina: numeroPagina, posicao, x: clientX, y: clientY })
  }

  useEffect(() => {
    if (seguirDestaque && retangulosDestaque.length > 0) {
      primeiroDestaqueRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [retangulosDestaque, seguirDestaque])

  const primeiroResultadoRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (retangulosBusca.length > 0) {
      primeiroResultadoRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [retangulosBusca])

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
        borderRadius="8px"
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
    <Box
      position="relative"
      display="inline-block"
      maxW="full"
      cursor={onClicarTexto ? 'text' : undefined}
      onClick={tratarClique}
    >
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
        filter={FILTRO_TEMA_PAGINA[tema]}
        transition="filter 0.25s ease"
      />

      {retangulosMarcacoes.map((retangulo) => (
        <Box
          key={retangulo.chave}
          position="absolute"
          left={`${retangulo.esquerda}%`}
          top={`${retangulo.topo}%`}
          w={`${retangulo.largura}%`}
          h={`${retangulo.altura}%`}
          bg={COR_MARCACAO[retangulo.tipo] ?? COR_MARCACAO.destaque}
          mixBlendMode={mistura}
          borderBottom={retangulo.tipo === 'nota' ? '2px solid rgba(234, 88, 12, 0.8)' : undefined}
          borderRadius="2px"
          pointerEvents="none"
          zIndex={1}
        />
      ))}

      {retangulosBusca.map((retangulo, indice) => (
        <Box
          key={`busca-${indice}`}
          ref={indice === 0 ? primeiroResultadoRef : undefined}
          position="absolute"
          left={`${retangulo.esquerda}%`}
          top={`${retangulo.topo}%`}
          w={`${retangulo.largura}%`}
          h={`${retangulo.altura}%`}
          border="2px solid rgba(249, 115, 22, 0.9)"
          bg="rgba(249, 115, 22, 0.18)"
          borderRadius="3px"
          pointerEvents="none"
          animation="fade-in 0.2s ease-out"
          zIndex={2}
        />
      ))}

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
          mixBlendMode={mistura}
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
          mixBlendMode={mistura}
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
