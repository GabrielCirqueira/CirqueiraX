import { HStack, Link } from '@chakra-ui/react'
import { ExternalLink, Music2, Tv } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import { urlCanalYoutube, urlVideoYoutube, urlVideoYoutubeMusicRevisao } from '../utils'

export interface AtalhosVideoRevisaoProps {
  videoId: string | null
  canal?: string
  canalId?: string | null
  children?: ReactNode
}

const PROPS_ATALHO = {
  target: '_blank',
  rel: 'noopener noreferrer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  px: 2.5,
  py: 1,
  borderRadius: 'full',
  fontSize: 'xs',
  fontWeight: 'semibold',
  bg: 'cirqueira.musica.fundo',
  color: 'cirqueira.musica.textoPrincipal',
  textDecoration: 'none',
  _hover: { color: 'cirqueira.musica.verde' },
} as const

export const AtalhosVideoRevisao = memo(function AtalhosVideoRevisao({
  videoId,
  canal,
  canalId,
  children,
}: AtalhosVideoRevisaoProps) {
  return (
    <HStack gap={1.5} wrap="wrap">
      {videoId && (
        <Link href={urlVideoYoutube(videoId)} {...PROPS_ATALHO}>
          <ExternalLink size={12} /> Abrir no YouTube
        </Link>
      )}
      {videoId && (
        <Link href={urlVideoYoutubeMusicRevisao(videoId)} {...PROPS_ATALHO}>
          <Music2 size={12} /> YouTube Music
        </Link>
      )}
      {canal && (
        <Link href={urlCanalYoutube(canalId, canal)} {...PROPS_ATALHO}>
          <Tv size={12} /> Canal
        </Link>
      )}
      {children}
    </HStack>
  )
})
