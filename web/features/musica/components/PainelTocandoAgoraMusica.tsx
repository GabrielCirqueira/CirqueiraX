import { CartaoTocandoAgora } from '@/features/spotify/components/CartaoTocandoAgora'
import { UltimaDetectadaYoutubeMusic } from '@/features/youtube-music/components/UltimaDetectadaYoutubeMusic'
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react'
import { ChevronDown, Radio } from 'lucide-react'
import { memo, useState } from 'react'
import type { FonteMusica } from '../types'

const CHAVE_OCULTO = 'cirqueirax:musica:tocando-agora-oculto'
const DURACAO_TRANSICAO = '0.35s'
const CURVA_TRANSICAO = 'cubic-bezier(0.22, 1, 0.36, 1)'

function lerOculto(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_OCULTO) === '1'
  } catch {
    return false
  }
}

function salvarOculto(oculto: boolean) {
  try {
    window.localStorage.setItem(CHAVE_OCULTO, oculto ? '1' : '0')
  } catch {
    return
  }
}

export interface PainelTocandoAgoraMusicaProps {
  conectada: boolean
  fonte: FonteMusica
}

export const PainelTocandoAgoraMusica = memo(function PainelTocandoAgoraMusica({
  conectada,
  fonte,
}: PainelTocandoAgoraMusicaProps) {
  const [oculto, setOculto] = useState(lerOculto)
  const mostrarSpotify = fonte !== 'youtube_music'
  const mostrarYoutube = fonte !== 'spotify'

  function alternar() {
    setOculto((atual) => {
      salvarOculto(!atual)
      return !atual
    })
  }

  return (
    <VStack align="stretch" gap={oculto ? 0 : 2}>
      <HStack justify="space-between">
        <HStack gap={2} color="cirqueira.musica.textoSecundario">
          <Radio size={14} />
          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
            Tocando agora
          </Text>
        </HStack>
        <Button
          size="xs"
          variant="ghost"
          borderRadius="full"
          color="cirqueira.musica.textoSecundario"
          _hover={{ color: 'cirqueira.musica.textoPrincipal', bg: 'cirqueira.musica.cartao' }}
          aria-expanded={!oculto}
          onClick={alternar}
        >
          {oculto ? 'Mostrar' : 'Ocultar'}
          <Box
            as="span"
            display="inline-flex"
            transform={oculto ? 'rotate(0deg)' : 'rotate(180deg)'}
            transition={`transform ${DURACAO_TRANSICAO} ${CURVA_TRANSICAO}`}
          >
            <ChevronDown size={14} />
          </Box>
        </Button>
      </HStack>
      <Box
        display="grid"
        gridTemplateRows={oculto ? '0fr' : '1fr'}
        opacity={oculto ? 0 : 1}
        visibility={oculto ? 'hidden' : 'visible'}
        transition={`grid-template-rows ${DURACAO_TRANSICAO} ${CURVA_TRANSICAO}, opacity ${DURACAO_TRANSICAO} ease, visibility ${DURACAO_TRANSICAO}`}
        aria-hidden={oculto}
      >
        <Box overflow="hidden" minH={0}>
          <VStack align="stretch" gap={3} pb={0.5}>
            {mostrarSpotify ? <CartaoTocandoAgora conectada={conectada} /> : null}
            {mostrarYoutube ? <UltimaDetectadaYoutubeMusic /> : null}
          </VStack>
        </Box>
      </Box>
    </VStack>
  )
})
