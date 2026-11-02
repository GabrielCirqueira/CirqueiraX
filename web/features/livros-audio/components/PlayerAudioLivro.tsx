import { Badge, Box, Button, Flex, HStack, IconButton, Slider, Text } from '@chakra-ui/react'
import {
  FastForward,
  ListMusic,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { obterUrlStreamBloco } from '../api'
import type { LivroAudio, LivroAudioBloco } from '../types'
import {
  calcularPaginaPorTempoBloco,
  encontrarBlocoPorPagina,
  formatarTempoAudio,
} from '../utils/sincronizacao'

interface PlayerAudioLivroProps {
  livro: LivroAudio
  blocos: LivroAudioBloco[]
  paginaAtualLeitor: number
  acompanharAudio: boolean
  onAlternarAcompanharAudio: () => void
  onMudarPaginaLeitor: (pagina: number) => void
  onSalvarPosicao: (pagina: number, bloco: number, segundos: number) => void
}

const VELOCIDADES = [0.75, 1, 1.25, 1.5, 2]

export const PlayerAudioLivro = memo(function PlayerAudioLivro({
  livro,
  blocos,
  paginaAtualLeitor,
  acompanharAudio,
  onAlternarAcompanharAudio,
  onMudarPaginaLeitor,
  onSalvarPosicao,
}: PlayerAudioLivroProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ultimoSalvamentoRef = useRef<number>(0)
  const [tocando, setTocando] = useState(false)
  const [tempoAtual, setTempoAtual] = useState(0)
  const [duracao, setDuracao] = useState(0)
  const [indiceVelocidade, setIndiceVelocidade] = useState(1)
  const [mostrarListaCapitulos, setMostrarListaCapitulos] = useState(false)

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

  const salvarProgresso = useCallback(
    (segundos: number) => {
      if (!blocoAtivo) return
      const paginaCalculada = calcularPaginaPorTempoBloco(blocoAtivo, segundos)
      onSalvarPosicao(paginaCalculada, blocoAtivo.numeroBloco, Math.floor(segundos))
    },
    [blocoAtivo, onSalvarPosicao]
  )

  useEffect(() => {
    if (livro.segundosNoBloco > 0 && audioRef.current && audioUrl) {
      audioRef.current.currentTime = livro.segundosNoBloco
      setTempoAtual(livro.segundosNoBloco)
    }
  }, [audioUrl, livro.segundosNoBloco])

  useEffect(() => {
    if (!acompanharAudio || !blocoAtivo) return
    const blocoDaPagina = encontrarBlocoPorPagina(blocos, paginaAtualLeitor)
    if (blocoDaPagina?.isPronto && blocoDaPagina.numeroBloco !== blocoAtivo.numeroBloco) {
      setBlocoAtivo(blocoDaPagina)
      setTempoAtual(0)
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
    }
  }, [paginaAtualLeitor, acompanharAudio, blocos, blocoAtivo])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !blocoAtivo) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: livro.titulo,
      artist: `Bloco ${blocoAtivo.numeroBloco} (Págs. ${blocoAtivo.paginaInicio}-${blocoAtivo.paginaFim})`,
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
    function handleBeforeUnload() {
      if (audioRef.current && blocoAtivo) {
        salvarProgresso(audioRef.current.currentTime)
      }
    }
    window.addEventListener('pagehide', handleBeforeUnload)
    return () => {
      window.removeEventListener('pagehide', handleBeforeUnload)
      handleBeforeUnload()
    }
  }, [salvarProgresso, blocoAtivo])

  function alternarPlayPause() {
    if (!audioRef.current || !audioUrl) return
    if (tocando) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
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
    const vel = VELOCIDADES[proximoIndice] ?? 1
    if (audioRef.current) {
      audioRef.current.playbackRate = vel
    }
  }

  function selecionarBloco(novoBloco: LivroAudioBloco) {
    if (!novoBloco.isPronto) return
    if (blocoAtivo && audioRef.current) {
      salvarProgresso(audioRef.current.currentTime)
    }
    setBlocoAtivo(novoBloco)
    setTempoAtual(0)
    setMostrarListaCapitulos(false)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    }
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

  const temAnterior = Boolean(
    blocoAtivo && blocos.some((b) => b.numeroBloco === blocoAtivo.numeroBloco - 1 && b.isPronto)
  )
  const temProximo = Boolean(
    blocoAtivo && blocos.some((b) => b.numeroBloco === blocoAtivo.numeroBloco + 1 && b.isPronto)
  )

  return (
    <Box
      bg="cirqueira.grey.950"
      borderTop="1px solid"
      borderColor="cirqueira.grey.900"
      px={4}
      py={2.5}
      position="relative"
      zIndex={40}
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onPlay={() => {
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
              audioRef.current.playbackRate = VELOCIDADES[indiceVelocidade] ?? 1
            }
          }}
          onTimeUpdate={() => {
            if (!audioRef.current || !blocoAtivo) return
            const atual = audioRef.current.currentTime
            setTempoAtual(atual)

            if (acompanharAudio) {
              const paginaAlvo = calcularPaginaPorTempoBloco(blocoAtivo, atual)
              if (paginaAlvo !== paginaAtualLeitor) {
                onMudarPaginaLeitor(paginaAlvo)
              }
            }

            const agora = Date.now()
            if (agora - ultimoSalvamentoRef.current > 6000) {
              ultimoSalvamentoRef.current = agora
              salvarProgresso(atual)
            }
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

      {mostrarListaCapitulos && (
        <Box
          position="absolute"
          bottom="100%"
          left={4}
          right={4}
          maxH="280px"
          bg="cirqueira.grey.900"
          border="1px solid"
          borderColor="cirqueira.grey.800"
          borderRadius="lg"
          p={3}
          mb={2}
          overflowY="auto"
          boxShadow="2xl"
          zIndex={50}
        >
          <HStack justify="space-between" mb={2}>
            <Text fontSize="xs" fontWeight="bold" color="cirqueira.grey.200">
              Capítulos e Blocos de Áudio
            </Text>
            <Button
              size="xs"
              variant="ghost"
              color="cirqueira.grey.400"
              onClick={() => setMostrarListaCapitulos(false)}
            >
              Fechar
            </Button>
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
                  h="36px"
                  px={3}
                >
                  <HStack gap={2}>
                    <Text fontWeight="bold">Bloco {bloco.numeroBloco}</Text>
                    <Text color="cirqueira.grey.400">
                      (Págs. {bloco.paginaInicio} a {bloco.paginaFim})
                    </Text>
                  </HStack>
                  <HStack gap={2}>
                    {bloco.duracaoSegundos && (
                      <Text color="cirqueira.grey.300">
                        {formatarTempoAudio(bloco.duracaoSegundos)}
                      </Text>
                    )}
                    <Badge
                      size="sm"
                      variant="outline"
                      colorPalette={bloco.isPronto ? 'green' : bloco.isErro ? 'red' : 'yellow'}
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

      <Flex
        direction={{ base: 'column', md: 'row' }}
        align="center"
        justify="space-between"
        gap={2.5}
        maxW="1400px"
        mx="auto"
      >
        <HStack gap={2} minW={{ base: 'auto', md: '220px' }}>
          <Volume2 size={16} color="var(--chakra-colors-cirqueira-brand-500)" />
          <Box minW={0}>
            <Text fontSize="xs" fontWeight="bold" color="cirqueira.grey.100" lineClamp={1}>
              {blocoAtivo ? `Capítulo ${blocoAtivo.numeroBloco}` : 'Sem áudio disponível'}
            </Text>
            <Text fontSize="10px" color="cirqueira.grey.400">
              {blocoAtivo
                ? `Páginas ${blocoAtivo.paginaInicio} a ${blocoAtivo.paginaFim}`
                : 'Aguardando sintetização'}
            </Text>
          </Box>
        </HStack>

        <Flex direction="column" align="center" gap={1} flex={1} maxW="600px" w="full">
          <HStack gap={1}>
            <IconButton
              aria-label="Capítulo anterior"
              size="xs"
              variant="ghost"
              color="cirqueira.grey.300"
              disabled={!temAnterior}
              onClick={retrocederBloco}
            >
              <SkipBack size={14} />
            </IconButton>

            <IconButton
              aria-label="Voltar 15 segundos"
              size="xs"
              variant="ghost"
              color="cirqueira.grey.300"
              disabled={!audioUrl}
              onClick={() => pularTempo(-15)}
            >
              <RotateCcw size={14} />
            </IconButton>

            <IconButton
              aria-label={tocando ? 'Pausar áudio' : 'Reproduzir áudio'}
              size="sm"
              variant="solid"
              colorPalette="brand"
              borderRadius="full"
              disabled={!audioUrl}
              onClick={alternarPlayPause}
            >
              {tocando ? <Pause size={16} /> : <Play size={16} />}
            </IconButton>

            <IconButton
              aria-label="Avançar 15 segundos"
              size="xs"
              variant="ghost"
              color="cirqueira.grey.300"
              disabled={!audioUrl}
              onClick={() => pularTempo(15)}
            >
              <RotateCw size={14} />
            </IconButton>

            <IconButton
              aria-label="Próximo capítulo"
              size="xs"
              variant="ghost"
              color="cirqueira.grey.300"
              disabled={!temProximo}
              onClick={avancarBloco}
            >
              <SkipForward size={14} />
            </IconButton>
          </HStack>

          <HStack w="full" gap={2}>
            <Text fontSize="10px" color="cirqueira.grey.400" minW="35px" textAlign="right">
              {formatarTempoAudio(tempoAtual)}
            </Text>

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
                <Slider.Track bg="cirqueira.grey.800">
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Control>
            </Slider.Root>

            <Text fontSize="10px" color="cirqueira.grey.400" minW="35px">
              {formatarTempoAudio(duracao)}
            </Text>
          </HStack>
        </Flex>

        <HStack
          gap={1.5}
          justify={{ base: 'center', md: 'flex-end' }}
          minW={{ base: 'auto', md: '220px' }}
        >
          <Button
            size="xs"
            variant={acompanharAudio ? 'solid' : 'subtle'}
            colorPalette={acompanharAudio ? 'brand' : 'gray'}
            onClick={onAlternarAcompanharAudio}
            fontSize="10px"
            h="26px"
            px={2}
            title={
              acompanharAudio
                ? 'Acompanhamento automático ativado: as páginas viram com o áudio'
                : 'Acompanhamento desativado: folheie o livro livremente sem mexer no áudio'
            }
          >
            {acompanharAudio ? 'Seguir áudio' : 'Folhear livre'}
          </Button>

          <Button
            size="xs"
            variant="ghost"
            color="cirqueira.grey.300"
            onClick={alternarVelocidade}
            fontSize="10px"
            h="26px"
            px={1.5}
          >
            <FastForward size={12} style={{ marginRight: '3px' }} />
            {VELOCIDADES[indiceVelocidade]}x
          </Button>

          <Button
            size="xs"
            variant="ghost"
            color="cirqueira.grey.300"
            onClick={() => setMostrarListaCapitulos((prev) => !prev)}
            fontSize="10px"
            h="26px"
            px={1.5}
          >
            <ListMusic size={12} style={{ marginRight: '3px' }} />
            Capítulos
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
})
