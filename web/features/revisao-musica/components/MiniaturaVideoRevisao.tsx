import { urlCapaExibicao } from '@/features/musica/utils/capaMusica'
import { Box, Image, Link } from '@chakra-ui/react'
import { Music, Play } from 'lucide-react'
import { memo } from 'react'
import { urlVideoYoutube } from '../utils'

export interface MiniaturaVideoRevisaoProps {
  imagem: string | null
  videoId: string | null
  titulo: string
  largura?: { base: string; sm: string }
  quadrada?: boolean
}

const LARGURA_PADRAO = { base: '104px', sm: '144px' }

export const MiniaturaVideoRevisao = memo(function MiniaturaVideoRevisao({
  imagem,
  videoId,
  titulo,
  largura = LARGURA_PADRAO,
  quadrada = false,
}: MiniaturaVideoRevisaoProps) {
  const endereco = urlCapaExibicao(imagem)
  const conteudo = (
    <Box
      position="relative"
      w={largura}
      flexShrink={0}
      borderRadius="8px"
      overflow="hidden"
      bg="cirqueira.musica.cartaoElevado"
      aspectRatio={quadrada ? 1 : 16 / 9}
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="cirqueira.musica.textoDesabilitado"
      className="group"
    >
      {endereco ? (
        <Image src={endereco} alt="" w="full" h="full" objectFit="cover" loading="lazy" />
      ) : (
        <Music size={24} />
      )}
      {videoId && (
        <Box
          position="absolute"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="blackAlpha.400"
          color="cirqueira.musica.textoPrincipal"
          opacity={0.85}
          transition="opacity 0.15s, background 0.15s"
          _groupHover={{ opacity: 1, bg: 'blackAlpha.600' }}
        >
          <Box borderRadius="full" bg="cirqueira.musica.fonteYoutubeMusic" p={2} display="flex">
            <Play size={14} fill="currentColor" />
          </Box>
        </Box>
      )}
    </Box>
  )

  if (!videoId) return conteudo

  return (
    <Link
      href={urlVideoYoutube(videoId)}
      target="_blank"
      rel="noopener noreferrer"
      flexShrink={0}
      aria-label={`Assistir ${titulo} no YouTube`}
    >
      {conteudo}
    </Link>
  )
})
