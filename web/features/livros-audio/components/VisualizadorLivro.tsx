import { Box, Center, HStack, IconButton, Text } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type KeyboardEvent, type TouchEvent, memo, useEffect, useRef } from 'react'
import type { MarcacaoLivro, TemaPagina } from '../types'
import type { LocalizacaoTrecho } from '../utils/localizacaoNarracao'
import type { PDFDocumentProxy, SegmentoDestaque } from '../utils/pdf'
import { type CliqueTextoPagina, FUNDO_TEMA_PAGINA, PaginaPdf } from './PaginaPdf'

const DURACAO_VIRADA_MS = 380
const DISTANCIA_MINIMA_DESLIZE = 60
const TEMPO_MAXIMO_DESLIZE_MS = 700

function animarVirada(elemento: HTMLElement | null, avancando: boolean) {
  if (!elemento || typeof elemento.animate !== 'function') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const angulo = avancando ? -9 : 9
  const deslocamento = avancando ? '2.5%' : '-2.5%'
  elemento.style.transformOrigin = avancando ? 'left center' : 'right center'
  elemento.animate(
    [
      {
        transform: `perspective(1800px) translateX(${deslocamento}) rotateY(${angulo}deg)`,
        opacity: 0.35,
      },
      { transform: 'perspective(1800px) translateX(0) rotateY(0deg)', opacity: 1 },
    ],
    { duration: DURACAO_VIRADA_MS, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
  )
}

interface VisualizadorLivroProps {
  documento: PDFDocumentProxy
  paginaAtual: number
  totalPaginas: number
  escala: number
  modoDuplo: boolean
  destaque?: LocalizacaoTrecho | null
  destaquePalavra?: LocalizacaoTrecho | null
  seguirDestaque?: boolean
  tema?: TemaPagina
  marcacoes?: MarcacaoLivro[]
  destaqueBusca?: SegmentoDestaque[]
  onClicarTexto?: (clique: CliqueTextoPagina) => void
  onAvancar: () => void
  onVoltar: () => void
}

export const VisualizadorLivro = memo(function VisualizadorLivro({
  documento,
  paginaAtual,
  totalPaginas,
  escala,
  modoDuplo,
  destaque = null,
  destaquePalavra = null,
  seguirDestaque = false,
  tema = 'claro',
  marcacoes,
  destaqueBusca,
  onClicarTexto,
  onAvancar,
  onVoltar,
}: VisualizadorLivroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const paginasRef = useRef<HTMLDivElement | null>(null)
  const paginaAnteriorRef = useRef(paginaAtual)
  const fundoPagina = FUNDO_TEMA_PAGINA[tema]
  const toqueRef = useRef<{ x: number; y: number; momento: number } | null>(null)

  function iniciarToque(evento: TouchEvent<HTMLDivElement>) {
    const toque = evento.touches[0]
    toqueRef.current =
      evento.touches.length === 1 && toque
        ? { x: toque.clientX, y: toque.clientY, momento: Date.now() }
        : null
  }

  function terminarToque(evento: TouchEvent<HTMLDivElement>) {
    const inicio = toqueRef.current
    toqueRef.current = null
    const toque = evento.changedTouches[0]
    if (!inicio || !toque || Date.now() - inicio.momento > TEMPO_MAXIMO_DESLIZE_MS) return
    const dx = toque.clientX - inicio.x
    const dy = toque.clientY - inicio.y
    if (Math.abs(dx) < DISTANCIA_MINIMA_DESLIZE || Math.abs(dx) < Math.abs(dy) * 1.5) return
    const area = containerRef.current
    if (area && area.scrollWidth > area.clientWidth + 4) {
      if (dx < 0 && area.scrollLeft + area.clientWidth < area.scrollWidth - 4) return
      if (dx > 0 && area.scrollLeft > 4) return
    }
    if (dx < 0) onAvancar()
    else onVoltar()
  }

  useEffect(() => {
    const anterior = paginaAnteriorRef.current
    paginaAnteriorRef.current = paginaAtual
    if (anterior !== paginaAtual) animarVirada(paginasRef.current, paginaAtual > anterior)
  }, [paginaAtual])

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
      onTouchStart={iniciarToque}
      onTouchEnd={terminarToque}
      outline="none"
      position="relative"
      flex={1}
      w="full"
      h="full"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="auto"
      p={{ base: 2, md: 8 }}
      pb={{ base: '180px', md: 28 }}
      bg="cirqueira.grey.950"
      userSelect="none"
    >
      <IconButton
        display={{ base: 'none', md: 'inline-flex' }}
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

      <Center ref={paginasRef} minH="full" w="full" py={2}>
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
                bg={fundoPagina}
                borderTopLeftRadius="18px"
                borderBottomLeftRadius="18px"
                borderTopRightRadius={0}
                borderBottomRightRadius={0}
                overflow="hidden"
                boxShadow="-2px 0 0 rgba(0, 0, 0, 0.1), -4px 1px 0 rgba(0, 0, 0, 0.08), -6px 2px 0 rgba(0, 0, 0, 0.05), 0 4px 0 rgba(0, 0, 0, 0.1), 0 7px 0 rgba(0, 0, 0, 0.08), 0 10px 0 rgba(0, 0, 0, 0.05), -18px 20px 40px rgba(0, 0, 0, 0.6)"
              >
                <PaginaPdf
                  documento={documento}
                  numeroPagina={paginaEsquerda}
                  escala={escala}
                  destaque={destaque}
                  destaquePalavra={destaquePalavra}
                  seguirDestaque={seguirDestaque}
                  tema={tema}
                  marcacoes={marcacoes}
                  destaqueBusca={destaqueBusca}
                  onClicarTexto={onClicarTexto}
                />

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
                    color="cirqueira.grey.500"
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
                bg={fundoPagina}
                borderTopRightRadius="18px"
                borderBottomRightRadius="18px"
                borderTopLeftRadius={0}
                borderBottomLeftRadius={0}
                overflow="hidden"
                boxShadow="2px 0 0 rgba(0, 0, 0, 0.1), 4px 1px 0 rgba(0, 0, 0, 0.08), 6px 2px 0 rgba(0, 0, 0, 0.05), 0 4px 0 rgba(0, 0, 0, 0.1), 0 7px 0 rgba(0, 0, 0, 0.08), 0 10px 0 rgba(0, 0, 0, 0.05), 18px 20px 40px rgba(0, 0, 0, 0.6)"
              >
                {paginaDireita ? (
                  <>
                    <PaginaPdf
                      documento={documento}
                      numeroPagina={paginaDireita}
                      escala={escala}
                      destaque={destaque}
                      destaquePalavra={destaquePalavra}
                      seguirDestaque={seguirDestaque}
                      tema={tema}
                      marcacoes={marcacoes}
                      destaqueBusca={destaqueBusca}
                      onClicarTexto={onClicarTexto}
                    />

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
                        color="cirqueira.grey.500"
                        fontVariantNumeric="tabular-nums"
                      >
                        {paginaDireita}
                      </Text>
                    </Box>
                  </>
                ) : (
                  <Center
                    w="400px"
                    minH="580px"
                    bg="cirqueira.grey.50"
                    p={6}
                    borderLeft="1px solid"
                    borderColor="cirqueira.grey.200"
                  >
                    <Text color="cirqueira.grey.400" fontSize="sm" fontWeight="medium">
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
            bg={fundoPagina}
            borderRadius="18px"
            overflow="hidden"
            boxShadow="0 4px 0 rgba(0, 0, 0, 0.1), 0 8px 0 rgba(0, 0, 0, 0.08), 0 12px 0 rgba(0, 0, 0, 0.05), 0 25px 60px rgba(0, 0, 0, 0.75)"
          >
            <PaginaPdf
              documento={documento}
              numeroPagina={paginaAtual}
              escala={escala}
              destaque={destaque}
              destaquePalavra={destaquePalavra}
              seguirDestaque={seguirDestaque}
              tema={tema}
              marcacoes={marcacoes}
              destaqueBusca={destaqueBusca}
              onClicarTexto={onClicarTexto}
            />

            <Box position="absolute" bottom="12px" right="20px" pointerEvents="none" zIndex={4}>
              <Text
                fontSize="11px"
                fontWeight="600"
                color="cirqueira.grey.500"
                fontVariantNumeric="tabular-nums"
              >
                {paginaAtual}
              </Text>
            </Box>
          </Box>
        )}
      </Center>

      <IconButton
        display={{ base: 'none', md: 'inline-flex' }}
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
