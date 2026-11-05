import { Box, type BoxProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface TemaSpotifyProps extends BoxProps {
  children: ReactNode
}

export function TemaSpotify({ children, ...props }: TemaSpotifyProps) {
  return (
    <Box
      data-theme="dark"
      colorPalette="green"
      bg="cirqueira.spotify.fundo"
      color="cirqueira.spotify.textoPrincipal"
      fontFamily="inter"
      minH="100%"
      w="100%"
      transition="background-color 0.2s ease, color 0.2s ease"
      {...props}
    >
      {children}
    </Box>
  )
}
