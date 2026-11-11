import { Box, type BoxProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface TemaMusicaProps extends BoxProps {
  children: ReactNode
}

export function TemaMusica({ children, ...props }: TemaMusicaProps) {
  return (
    <Box
      data-theme="dark"
      colorPalette="green"
      bg="cirqueira.musica.fundo"
      color="cirqueira.musica.textoPrincipal"
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
