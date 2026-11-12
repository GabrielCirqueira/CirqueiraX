import { IconeFonteMusica } from '@/features/musica/components/IconeFonteMusica'
import { useRelogioSpotify } from '@/features/spotify/hooks'
import { HStack, Text } from '@chakra-ui/react'
import { memo } from 'react'
import { useStatusYoutubeMusic } from '../hooks/useStatusYoutubeMusic'
import { descreverDeteccaoAproximada, descreverProgressoTocando } from '../utils'

export const UltimaDetectadaYoutubeMusic = memo(function UltimaDetectadaYoutubeMusic() {
  const { data } = useStatusYoutubeMusic()
  const agora = useRelogioSpotify()
  const ultima = data?.ultimaDetectada
  const tocando = data?.extensao?.tocandoAgora

  if (tocando) {
    return (
      <HStack
        gap={2.5}
        px={4}
        py={3}
        borderRadius="8px"
        bg="cirqueira.musica.cartao"
        border="1px solid"
        borderColor="cirqueira.musica.fonteYoutubeMusic"
        minW={0}
      >
        <IconeFonteMusica fonte="youtube_music" />
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate minW={0}>
          Tocando agora:{' '}
          <Text as="span" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
            {tocando.titulo}
          </Text>
          {tocando.canal ? ` · ${tocando.canal}` : ''} · {descreverProgressoTocando(tocando)}
        </Text>
      </HStack>
    )
  }

  if (!data?.conectada || !ultima) {
    return null
  }

  return (
    <HStack
      gap={2.5}
      px={4}
      py={3}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      minW={0}
    >
      <IconeFonteMusica fonte="youtube_music" />
      <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate minW={0}>
        Última detectada:{' '}
        <Text as="span" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
          {ultima.titulo}
        </Text>
        {ultima.canal ? ` · ${ultima.canal}` : ''}
        {ultima.tocadaEm ? `, ${descreverDeteccaoAproximada(ultima.tocadaEm, agora)}` : ''}
      </Text>
    </HStack>
  )
})
