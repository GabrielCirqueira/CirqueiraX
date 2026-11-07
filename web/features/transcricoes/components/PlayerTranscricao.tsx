import { Box, HStack, IconButton, Slider, Text, VStack } from '@chakra-ui/react'
import { Download, Pause, Play, RotateCcw, RotateCw } from 'lucide-react'
import { type RefObject, memo, useState } from 'react'
import { obterUrlAudioTranscricao } from '../api'
import { formatarDuracao, proximaVelocidade } from '../utils'

const VELOCIDADES = [1, 1.25, 1.5, 2, 0.75] as const
const SALTO_SEGUNDOS = 5

export interface PlayerTranscricaoProps {
  uuid: string
  audioRef: RefObject<HTMLAudioElement | null>
  tempoAtual: number
  duracaoConhecida: number | null
  onTempoAtualizado: (segundos: number) => void
}

export const PlayerTranscricao = memo(function PlayerTranscricao({
  uuid,
  audioRef,
  tempoAtual,
  duracaoConhecida,
  onTempoAtualizado,
}: PlayerTranscricaoProps) {
  const [tocando, setTocando] = useState(false)
  const [velocidade, setVelocidade] = useState<number>(1)
  const [duracao, setDuracao] = useState<number | null>(duracaoConhecida)
  const url = obterUrlAudioTranscricao(uuid)

  function alternarReproducao() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
      return
    }
    audio.pause()
  }

  function saltar(segundos: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(
      0,
      Math.min(audio.duration || Number.POSITIVE_INFINITY, audio.currentTime + segundos)
    )
  }

  function mudarPosicao(segundos: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = segundos
    onTempoAtualizado(segundos)
  }

  function trocarVelocidade() {
    const nova = proximaVelocidade(velocidade, VELOCIDADES)
    setVelocidade(nova)
    if (audioRef.current) audioRef.current.playbackRate = nova
  }

  const duracaoTotal = Math.max(1, duracao ?? 1)

  return (
    <HStack
      gap={{ base: 2, md: 3 }}
      p={2.5}
      pr={{ base: 2.5, md: 4 }}
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="8px"
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => setTocando(false)}
        onLoadedMetadata={(evento) => setDuracao(evento.currentTarget.duration || duracaoConhecida)}
        onTimeUpdate={(evento) => onTempoAtualizado(evento.currentTarget.currentTime)}
      >
        <track kind="captions" />
      </audio>

      <IconButton
        colorPalette="brand"
        borderRadius="full"
        size="md"
        aria-label={tocando ? 'Pausar' : 'Ouvir'}
        onClick={alternarReproducao}
        flexShrink={0}
      >
        {tocando ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </IconButton>

      <IconButton
        size="xs"
        variant="ghost"
        borderRadius="full"
        aria-label="Voltar 5 segundos"
        title="Voltar 5 s"
        color="fg.muted"
        display={{ base: 'none', sm: 'inline-flex' }}
        onClick={() => saltar(-SALTO_SEGUNDOS)}
      >
        <RotateCcw size={14} />
      </IconButton>

      <VStack align="stretch" gap={0.5} flex={1} minW={0}>
        <Slider.Root
          size="sm"
          min={0}
          max={duracaoTotal}
          step={0.1}
          value={[Math.min(tempoAtual, duracaoTotal)]}
          onValueChange={({ value }) => mudarPosicao(value[0] ?? 0)}
          colorPalette="brand"
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumbs />
          </Slider.Control>
        </Slider.Root>
        <HStack justify="space-between">
          <Text fontSize="10px" color="fg.subtle" fontFamily="mono">
            {formatarDuracao(tempoAtual)}
          </Text>
          <Text fontSize="10px" color="fg.subtle" fontFamily="mono">
            {formatarDuracao(duracao)}
          </Text>
        </HStack>
      </VStack>

      <IconButton
        size="xs"
        variant="ghost"
        borderRadius="full"
        aria-label="Avançar 5 segundos"
        title="Avançar 5 s"
        color="fg.muted"
        display={{ base: 'none', sm: 'inline-flex' }}
        onClick={() => saltar(SALTO_SEGUNDOS)}
      >
        <RotateCw size={14} />
      </IconButton>

      <Box
        as="button"
        onClick={trocarVelocidade}
        px={2}
        py={1}
        borderRadius="full"
        fontSize="11px"
        fontWeight="bold"
        fontFamily="mono"
        color="fg.muted"
        bg="bg.muted"
        minW="42px"
        transition="all 0.15s ease"
        _hover={{ color: 'fg', bg: 'bg.emphasized' }}
        title="Velocidade"
      >
        {velocidade}x
      </Box>

      <IconButton
        asChild
        size="xs"
        variant="ghost"
        borderRadius="full"
        aria-label="Baixar áudio"
        title="Baixar áudio original"
        color="fg.muted"
      >
        <a href={url} download>
          <Download size={14} />
        </a>
      </IconButton>
    </HStack>
  )
})
