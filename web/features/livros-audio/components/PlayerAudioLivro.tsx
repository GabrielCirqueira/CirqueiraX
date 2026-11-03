import { Badge, Box, Button, Flex, HStack, IconButton, Slider, Text } from '@chakra-ui/react'
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  ListMusic,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { obterUrlPdfLivro, obterUrlStreamBloco } from '../api'
import { type NarracaoAtual, useNarracaoAtual } from '../hooks/useNarracaoAtual'
import type { LivroAudio, LivroAudioBloco, ModoDestaqueNarracao } from '../types'
import type { PDFDocumentProxy } from '../utils/pdf'
import { encontrarBlocoPorPagina, formatarTempoAudio } from '../utils/sincronizacao'

interface PlayerAudioLivroProps {
  livro: LivroAudio
  blocos: LivroAudioBloco[]
  documento?: PDFDocumentProxy | null
  modoDuplo?: boolean
  onNarracaoAtual?: (narracao: NarracaoAtual | null) => void
  paginaAtualLeitor: number
  totalPaginas: number
  marcadorSalvo?: number
  salvandoMarcador?: boolean
  acompanharAudio: boolean
  onAlternarAcompanharAudio: () => void
  modoDestaque?: ModoDestaqueNarracao
  onAlternarModoDestaque?: () => void
  onMudarPaginaLeitor: (pagina: number) => void
  onAvancarPaginaLeitor?: () => void
  onVoltarPaginaLeitor?: () => void
  onSalvarPosicao: (pagina: number, bloco?: number | null, segundos?: number) => void
  onSalvarMarcador?: () => void
}

const VELOCIDADES = [0.75, 1.0, 1.25, 1.5, 2.0]

export const PlayerAudioLivro = memo(function PlayerAudioLivro({
  livro,
  blocos,
  documento = null,
  modoDuplo = false,
  onNarracaoAtual,
  paginaAtualLeitor,
  totalPaginas,
  marcadorSalvo,
  salvandoMarcador = false,
  acompanharAudio,
  onAlternarAcompanharAudio,
  modoDestaque = 'frase',
  onAlternarModoDestaque,
  onMudarPaginaLeitor,
  onAvancarPaginaLeitor,
  onVoltarPaginaLeitor,
  onSalvarPosicao,
  onSalvarMarcador,
}: PlayerAudioLivroProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ultimoSalvamentoRef = useRef<number>(0)
  const ultimoTempoRef = useRef<number>(0)
  const posicaoRetomadaRef = useRef(false)
  const deveTocarAoCarregarRef = useRef(false)
  const [tocando, setTocando] = useState(false)
  const [tempoAtual, setTempoAtual] = useState(0)
  const [duracao, setDuracao] = useState(0)
  const [volume, setVolume] = useState(1)
  const [mutado, setMutado] = useState(false)
  const [mostrarVolume, setMostrarVolume] = useState(false)
  const [indiceVelocidade, setIndiceVelocidade] = useState(1)
  const [mostrarSumario, setMostrarSumario] = useState(false)

  const blocoInicial = useMemo(() => {
    if (blocos.length === 0) return null
    if (livro.blocoAtual) {
      const b = blocos.find((item) => item.numeroBloco === livro.blocoAtual)
      if (b?.isPronto) return b
    }
    const bPagina = encontrarBlocoPorPagina(blocos, livro.paginaAtual)
    if (bPagina?.isPronto) return bPagina
    return blocos.find((item) => item.isPronto) ?? blocos[0] ?? null
  }, [blocos, livro.blocoAtual, livro.paginaAtual])

  const [blocoAtivo, setBlocoAtivo] = useState<LivroAudioBloco | null>(blocoInicial ?? null)

  useEffect(() => {
    if (!blocoAtivo && blocoInicial) {
      setBlocoAtivo(blocoInicial)
    }
  }, [blocoAtivo, blocoInicial])

  const audioUrl = useMemo(() => {
    if (!blocoAtivo || !blocoAtivo.isPronto) return ''
    return obterUrlStreamBloco(livro.uuid, blocoAtivo.numeroBloco)
  }, [livro.uuid, blocoAtivo])

  const obterTempoAtual = useCallback(() => audioRef.current?.currentTime ?? null, [])
  const narracao = useNarracaoAtual({
    livroUuid: livro.uuid,
    bloco: blocoAtivo,
    documento,
    segundos: tempoAtual,
    tocando,
    obterTempoAtual,
  })
  const paginaNarrada = narracao?.pagina ?? null
  const paginaNarradaRef = useRef<number | null>(paginaNarrada)
  paginaNarradaRef.current = paginaNarrada
  const audioFoiUsadoRef = useRef(false)
  const onNarracaoAtualRef = useRef(onNarracaoAtual)
  onNarracaoAtualRef.current = onNarracaoAtual
  const paginaLeitorRef = useRef({ pagina: paginaAtualLeitor, modoDuplo, onMudarPaginaLeitor })
  paginaLeitorRef.current = { pagina: paginaAtualLeitor, modoDuplo, onMudarPaginaLeitor }

  useEffect(() => {
    onNarracaoAtualRef.current?.(audioFoiUsadoRef.current ? narracao : null)
  }, [narracao])

  useEffect(() => {
    if (!acompanharAudio || paginaNarrada === null || (!tocando && !audioFoiUsadoRef.current))
      return
    const leitor = paginaLeitorRef.current
    const visivel =
      paginaNarrada === leitor.pagina || (leitor.modoDuplo && paginaNarrada === leitor.pagina + 1)
    if (!visivel) {
      leitor.onMudarPaginaLeitor(paginaNarrada)
    }
  }, [paginaNarrada, acompanharAudio, tocando])

  const salvarProgresso = useCallback(
    (segundos: number) => {
      if (!blocoAtivo) return
      const pagina = paginaNarradaRef.current ?? blocoAtivo.paginaInicio
      onSalvarPosicao(pagina, blocoAtivo.numeroBloco, Math.floor(segundos))
    },
    [blocoAtivo, onSalvarPosicao]
  )

  const salvarProgressoRef = useRef(salvarProgresso)
  salvarProgressoRef.current = salvarProgresso

  useEffect(() => {
    if (!acompanharAudio || !blocoAtivo) return
    const blocoDaPagina = encontrarBlocoPorPagina(blocos, paginaAtualLeitor)
    if (blocoDaPagina?.isPronto && blocoDaPagina.numeroBloco !== blocoAtivo.numeroBloco) {
      deveTocarAoCarregarRef.current = tocando
      setBlocoAtivo(blocoDaPagina)
      setTempoAtual(0)
    }
  }, [paginaAtualLeitor, acompanharAudio, blocos, blocoAtivo, tocando])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !blocoAtivo) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: livro.titulo,
      artist: `Capítulo ${blocoAtivo.numeroBloco} (Págs. ${blocoAtivo.paginaInicio}-${blocoAtivo.paginaFim})`,
      album: 'CirqueiraX Livros',
    })

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause()
    })
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (audioRef.current)
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15)
    })
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (audioRef.current)
        audioRef.current.currentTime = Math.min(duracao, audioRef.current.currentTime + 15)
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      retrocederBloco()
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      avancarBloco()
    })
  }, [blocoAtivo, livro.titulo, duracao])

  useEffect(() => {
    function salvarAoSair() {
      if (ultimoTempoRef.current > 0) {
        salvarProgressoRef.current(ultimoTempoRef.current)
      }
    }
    window.addEventListener('pagehide', salvarAoSair)
    return () => {
      window.removeEventListener('pagehide', salvarAoSair)
      salvarAoSair()
    }
  }, [])

  function alternarPlayPause() {
    if (!audioRef.current || !audioUrl) return
    if (tocando) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }

  function pularTempo(segundosOffset: number) {
    if (!audioRef.current) return
    const novoTempo = Math.min(duracao, Math.max(0, audioRef.current.currentTime + segundosOffset))
    audioRef.current.currentTime = novoTempo
    setTempoAtual(novoTempo)
  }

  function alternarVelocidade() {
    const proximoIndice = (indiceVelocidade + 1) % VELOCIDADES.length
    setIndiceVelocidade(proximoIndice)
    const vel = VELOCIDADES[proximoIndice] ?? 1.0
    if (audioRef.current) {
      audioRef.current.playbackRate = vel
    }
  }

  function mudarVolume(novoVol: number) {
    setVolume(novoVol)
    setMutado(novoVol === 0)
    if (audioRef.current) {
      audioRef.current.volume = novoVol
    }
  }

  function alternarMudo() {
    if (mutado) {
      setMutado(false)
      const vol = volume > 0 ? volume : 1
      if (audioRef.current) audioRef.current.volume = vol
    } else {
      setMutado(true)
      if (audioRef.current) audioRef.current.volume = 0
    }
  }

  function selecionarBloco(novoBloco: LivroAudioBloco) {
    if (!novoBloco.isPronto) return
    if (blocoAtivo && audioRef.current) {
      salvarProgresso(audioRef.current.currentTime)
    }
    deveTocarAoCarregarRef.current = true
    ultimoTempoRef.current = 0
    setBlocoAtivo(novoBloco)
    setTempoAtual(0)
    setMostrarSumario(false)
    if (acompanharAudio) {
      onMudarPaginaLeitor(novoBloco.paginaInicio)
    }
  }

  function avancarBloco() {
    if (!blocoAtivo) return
    const proximo = blocos.find((b) => b.numeroBloco === blocoAtivo.numeroBloco + 1 && b.isPronto)
    if (proximo) {
      selecionarBloco(proximo)
    }
  }

  function retrocederBloco() {
    if (!blocoAtivo) return
    const anterior = blocos.find((b) => b.numeroBloco === blocoAtivo.numeroBloco - 1 && b.isPronto)
    if (anterior) {
      selecionarBloco(anterior)
    }
  }

  const temProximo = Boolean(
    blocoAtivo && blocos.some((b) => b.numeroBloco === blocoAtivo.numeroBloco + 1 && b.isPronto)
  )

  const isPosicaoSalva = marcadorSalvo !== undefined && paginaAtualLeitor === marcadorSalvo
  const urlDownloadPdf = obterUrlPdfLivro(livro.uuid)

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="cirqueira.grey.950/95"
      backdropFilter="blur(20px)"
      borderTop="1px solid"
      borderColor="cirqueira.grey.900"
      boxShadow="0 -10px 40px rgba(0, 0, 0, 0.7)"
      px={{ base: 3, md: 6 }}
      py={2.5}
      zIndex={45}
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onPlay={() => {
            audioFoiUsadoRef.current = true
            setTocando(true)
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
          }}
          onPause={() => {
            setTocando(false)
            if (audioRef.current) salvarProgresso(audioRef.current.currentTime)
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuracao(audioRef.current.duration || 0)
              audioRef.current.playbackRate = VELOCIDADES[indiceVelocidade] ?? 1.0
              if (!posicaoRetomadaRef.current) {
                posicaoRetomadaRef.current = true
                if (blocoAtivo?.numeroBloco === livro.blocoAtual && livro.segundosNoBloco > 0) {
                  audioRef.current.currentTime = livro.segundosNoBloco
                  setTempoAtual(livro.segundosNoBloco)
                }
              }
              if (deveTocarAoCarregarRef.current) {
                deveTocarAoCarregarRef.current = false
                audioRef.current.play().catch(() => {})
              }
            }
          }}
          onTimeUpdate={() => {
            if (!audioRef.current || !blocoAtivo) return
            const atual = audioRef.current.currentTime
            ultimoTempoRef.current = atual
            setTempoAtual(atual)

            const agora = Date.now()
            if (agora - ultimoSalvamentoRef.current > 6000) {
              ultimoSalvamentoRef.current = agora
              salvarProgresso(atual)
            }
          }}
          onSeeked={() => {
            audioFoiUsadoRef.current = true
          }}
          onEnded={() => {
            setTocando(false)
            if (temProximo) {
              avancarBloco()
            }
          }}
        >
          <track kind="captions" />
        </audio>
      )}

      {mostrarSumario && (
        <Box
          position="absolute"
          bottom="calc(100% + 8px)"
          right={{ base: 4, md: 24 }}
          w={{ base: 'calc(100vw - 32px)', sm: '380px' }}
          maxH="340px"
          bg="cirqueira.grey.900"
          border="1px solid"
          borderColor="cirqueira.grey.800"
          borderRadius="2xl"
          p={3.5}
          overflowY="auto"
          boxShadow="0 20px 50px rgba(0, 0, 0, 0.9), 0 0 0 1px var(--chakra-colors-cirqueira-brand-500)/20"
          zIndex={60}
        >
          <HStack
            justify="space-between"
            mb={2.5}
            pb={2}
            borderBottom="1px solid"
            borderColor="cirqueira.grey.800"
          >
            <HStack gap={2} color="cirqueira.brand.400">
              <ListMusic size={16} />
              <Text fontSize="xs" fontWeight="bold" color="white">
                Sumário e Capítulos
              </Text>
            </HStack>
            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              onClick={() => setMostrarSumario(false)}
              aria-label="Fechar sumário"
            >
              <X size={14} />
            </IconButton>
          </HStack>

          <Flex direction="column" gap={1.5}>
            {blocos.map((bloco) => {
              const isAtivo = blocoAtivo?.numeroBloco === bloco.numeroBloco
              return (
                <Button
                  key={bloco.uuid}
                  size="sm"
                  variant={isAtivo ? 'solid' : 'subtle'}
                  colorPalette={isAtivo ? 'brand' : 'gray'}
                  justifyContent="space-between"
                  disabled={!bloco.isPronto}
                  onClick={() => selecionarBloco(bloco)}
                  fontSize="xs"
                  h="38px"
                  px={3}
                  borderRadius="xl"
                  bg={isAtivo ? 'cirqueira.brand.500' : 'rgba(255, 255, 255, 0.04)'}
                  _hover={{ bg: isAtivo ? 'cirqueira.brand.600' : 'rgba(255, 255, 255, 0.08)' }}
                >
                  <HStack gap={2}>
                    <Text fontWeight="bold" color={isAtivo ? 'white' : 'cirqueira.grey.200'}>
                      Capítulo {bloco.numeroBloco}
                    </Text>
                    <Text
                      color={isAtivo ? 'rgba(255,255,255,0.7)' : 'cirqueira.grey.400'}
                      fontSize="11px"
                    >
                      (Págs. {bloco.paginaInicio}-{bloco.paginaFim})
                    </Text>
                  </HStack>
                  <HStack gap={2}>
                    {bloco.duracaoSegundos ? (
                      <Text color={isAtivo ? 'white' : 'cirqueira.grey.300'} fontSize="11px">
                        {formatarTempoAudio(bloco.duracaoSegundos)}
                      </Text>
                    ) : null}
                    <Badge
                      size="sm"
                      variant="outline"
                      colorPalette={bloco.isPronto ? 'green' : bloco.isErro ? 'red' : 'yellow'}
                      fontSize="10px"
                    >
                      {bloco.statusDescricao}
                    </Badge>
                  </HStack>
                </Button>
              )
            })}
          </Flex>
        </Box>
      )}

      {narracao && (audioFoiUsadoRef.current || tocando) && (
        <HStack
          as="button"
          maxW="1600px"
          w="full"
          mx="auto"
          mb={2}
          gap={2}
          minW={0}
          textAlign="left"
          cursor="pointer"
          onClick={() => onMudarPaginaLeitor(narracao.pagina)}
          title="Ir para a página que está sendo lida"
        >
          <Badge
            size="sm"
            variant="subtle"
            colorPalette="brand"
            borderRadius="md"
            flexShrink={0}
            fontVariantNumeric="tabular-nums"
          >
            {narracao.localizacao || !narracao.texto
              ? `Página ${narracao.pagina}`
              : `Perto da página ${narracao.pagina}`}
          </Badge>
          <Text fontSize="xs" color="cirqueira.grey.300" truncate minW={0}>
            {narracao.texto
              ? `Lendo agora: “${narracao.texto}”`
              : `Parte ${blocoAtivo?.numeroBloco ?? ''}, páginas ${blocoAtivo?.paginaInicio ?? ''} a ${blocoAtivo?.paginaFim ?? ''}`}
          </Text>
        </HStack>
      )}

      <Flex
        direction={{ base: 'column', lg: 'row' }}
        align="center"
        justify="space-between"
        gap={{ base: 2, lg: 4 }}
        maxW="1600px"
        mx="auto"
      >
        <HStack
          gap={3}
          minW={{ base: 'full', lg: '280px' }}
          justify={{ base: 'space-between', lg: 'flex-start' }}
        >
          <HStack gap={3} align="center">
            <IconButton
              aria-label={tocando ? 'Pausar áudio' : 'Reproduzir áudio'}
              w="44px"
              h="44px"
              borderRadius="full"
              bg="cirqueira.brand.500"
              color="white"
              boxShadow="0 4px 16px rgba(0, 151, 125, 0.45)"
              _hover={{
                bg: 'cirqueira.brand.600',
                transform: 'scale(1.06)',
                boxShadow: '0 6px 20px rgba(0, 151, 125, 0.6)',
              }}
              transition="all 0.15s ease"
              disabled={!audioUrl}
              onClick={alternarPlayPause}
            >
              {tocando ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
            </IconButton>

            <Box minW={0} maxW="190px">
              <Text fontSize="xs" fontWeight="bold" color="white" truncate>
                {tocando ? 'Ouvindo áudio' : 'Reproduzir áudio'}
              </Text>
              <Text fontSize="11px" color="cirqueira.grey.400" truncate title={livro.titulo}>
                {livro.titulo}
              </Text>
            </Box>
          </HStack>

          <HStack
            gap={1}
            align="center"
            position="relative"
            onMouseEnter={() => setMostrarVolume(true)}
            onMouseLeave={() => setMostrarVolume(false)}
          >
            <IconButton
              size="xs"
              variant="ghost"
              borderRadius="md"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              onClick={alternarMudo}
              aria-label={mutado ? 'Ativar som' : 'Silenciar'}
            >
              {mutado || volume === 0 ? (
                <VolumeX size={16} />
              ) : volume < 0.5 ? (
                <Volume1 size={16} />
              ) : (
                <Volume2 size={16} />
              )}
            </IconButton>

            {mostrarVolume && (
              <Box w="65px" px={1}>
                <Slider.Root
                  size="sm"
                  colorPalette="brand"
                  value={[mutado ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(d) => mudarVolume(d.value[0] ?? 1)}
                >
                  <Slider.Control>
                    <Slider.Track bg="rgba(255,255,255,0.1)">
                      <Slider.Range bg="cirqueira.brand.500" />
                    </Slider.Track>
                    <Slider.Thumb index={0} />
                  </Slider.Control>
                </Slider.Root>
              </Box>
            )}
          </HStack>
        </HStack>

        <Flex
          direction="column"
          align="center"
          gap={1}
          flex={1}
          maxW={{ base: 'full', lg: '560px' }}
          w="full"
        >
          <HStack w="full" gap={2} align="center">
            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              disabled={!audioUrl}
              onClick={() => pularTempo(-15)}
              aria-label="Voltar 15 segundos"
              title="Voltar 15s"
            >
              <RotateCcw size={14} />
            </IconButton>

            <Slider.Root
              size="sm"
              colorPalette="brand"
              value={[tempoAtual]}
              min={0}
              max={duracao || 1}
              step={0.5}
              disabled={!audioUrl}
              onValueChange={(detalhes) => {
                const novoTempo = detalhes.value[0] ?? 0
                setTempoAtual(novoTempo)
                if (audioRef.current) {
                  audioRef.current.currentTime = novoTempo
                }
              }}
              flex={1}
            >
              <Slider.Control>
                <Slider.Track bg="rgba(255, 255, 255, 0.1)" h="5px" borderRadius="full">
                  <Slider.Range bg="cirqueira.brand.500" borderRadius="full" />
                </Slider.Track>
                <Slider.Thumb
                  index={0}
                  boxSize="13px"
                  bg="white"
                  boxShadow="0 0 10px rgba(0, 151, 125, 0.8)"
                />
              </Slider.Control>
            </Slider.Root>

            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              disabled={!audioUrl}
              onClick={() => pularTempo(15)}
              aria-label="Avançar 15 segundos"
              title="Avançar 15s"
            >
              <RotateCw size={14} />
            </IconButton>

            <Text
              fontSize="xs"
              color="cirqueira.grey.300"
              minW="74px"
              textAlign="right"
              fontVariantNumeric="tabular-nums"
              fontWeight="medium"
            >
              {formatarTempoAudio(tempoAtual)} / {formatarTempoAudio(duracao)}
            </Text>
          </HStack>
        </Flex>

        <HStack
          gap={2}
          align="center"
          justify={{ base: 'center', lg: 'flex-end' }}
          minW={{ base: 'full', lg: '380px' }}
          flexWrap="wrap"
        >
          <Button
            size="xs"
            variant="ghost"
            borderRadius="lg"
            px={2.5}
            h="28px"
            color="cirqueira.grey.200"
            bg="cirqueira.grey.900"
            border="1px solid"
            borderColor="cirqueira.grey.800"
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            onClick={alternarVelocidade}
            fontSize="xs"
            fontWeight="semibold"
            title="Alterar velocidade da narração"
          >
            Velocidade: {VELOCIDADES[indiceVelocidade]}x
          </Button>

          <Button
            size="xs"
            variant="ghost"
            borderRadius="lg"
            px={2.5}
            h="28px"
            color={mostrarSumario ? 'cirqueira.brand.300' : 'cirqueira.grey.200'}
            bg={mostrarSumario ? 'cirqueira.brand.500/20' : 'cirqueira.grey.900'}
            border="1px solid"
            borderColor={mostrarSumario ? 'cirqueira.brand.500/40' : 'cirqueira.grey.800'}
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            onClick={() => setMostrarSumario((prev) => !prev)}
            fontSize="xs"
            fontWeight="semibold"
          >
            <ListMusic size={14} style={{ marginRight: '5px' }} />
            Sumário
          </Button>

          <HStack
            gap={1}
            bg="cirqueira.grey.900"
            border="1px solid"
            borderColor="cirqueira.grey.800"
            borderRadius="lg"
            px={1.5}
            py="2px"
            align="center"
          >
            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.300"
              _hover={{ color: 'white' }}
              disabled={paginaAtualLeitor <= 1}
              onClick={onVoltarPaginaLeitor}
              aria-label="Página anterior"
              title="Página anterior (←)"
            >
              <ChevronLeft size={16} />
            </IconButton>

            <Text
              fontSize="xs"
              color="white"
              fontWeight="bold"
              px={1.5}
              fontVariantNumeric="tabular-nums"
            >
              {paginaAtualLeitor} / {totalPaginas}
            </Text>

            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.300"
              _hover={{ color: 'white' }}
              disabled={paginaAtualLeitor >= totalPaginas}
              onClick={onAvancarPaginaLeitor}
              aria-label="Próxima página"
              title="Próxima página (→)"
            >
              <ChevronRight size={16} />
            </IconButton>
          </HStack>

          <a
            href={urlDownloadPdf}
            download={`${livro.titulo}.pdf`}
            style={{ textDecoration: 'none' }}
          >
            <Button
              size="xs"
              variant="ghost"
              borderRadius="lg"
              px={2.5}
              h="28px"
              color="cirqueira.grey.300"
              _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.08)' }}
              fontSize="xs"
              title="Baixar PDF original"
              display={{ base: 'none', xl: 'inline-flex' }}
            >
              <Download size={13} style={{ marginRight: '4px' }} />
              Baixar
            </Button>
          </a>

          <Button
            size="xs"
            variant="ghost"
            borderRadius="lg"
            px={2.5}
            h="28px"
            color={isPosicaoSalva ? 'cirqueira.brand.300' : 'cirqueira.grey.300'}
            bg={isPosicaoSalva ? 'cirqueira.brand.500/15' : 'transparent'}
            border="1px solid"
            borderColor={isPosicaoSalva ? 'cirqueira.brand.500/35' : 'transparent'}
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            disabled={salvandoMarcador}
            onClick={onSalvarMarcador}
            fontSize="xs"
            title={isPosicaoSalva ? 'Marcador salvo nesta página' : 'Salvar marcador nesta página'}
          >
            {isPosicaoSalva ? (
              <BookmarkCheck size={14} style={{ marginRight: '4px' }} />
            ) : (
              <Bookmark size={14} style={{ marginRight: '4px' }} />
            )}
            <Text as="span" display={{ base: 'none', sm: 'inline' }}>
              {isPosicaoSalva ? 'Marcado' : 'Favoritar'}
            </Text>
          </Button>

          <Button
            size="xs"
            variant={acompanharAudio ? 'solid' : 'subtle'}
            colorPalette={acompanharAudio ? 'brand' : 'gray'}
            onClick={onAlternarAcompanharAudio}
            fontSize="10px"
            h="26px"
            px={2}
            borderRadius="full"
            title={
              acompanharAudio
                ? 'Acompanhamento automático ativado: as páginas viram com o áudio'
                : 'Acompanhamento desativado: folheie o livro livremente sem mexer no áudio'
            }
          >
            {acompanharAudio ? 'Seguir áudio' : 'Folhear livre'}
          </Button>

          {onAlternarModoDestaque && (
            <Button
              size="xs"
              variant="subtle"
              colorPalette="gray"
              onClick={onAlternarModoDestaque}
              fontSize="10px"
              h="26px"
              px={2}
              borderRadius="full"
              title={
                modoDestaque === 'palavra'
                  ? 'Destacando a palavra falada. Clique para destacar a frase inteira'
                  : 'Destacando a frase inteira. Clique para destacar palavra por palavra'
              }
            >
              {modoDestaque === 'palavra' ? 'Por palavra' : 'Por frase'}
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  )
})
