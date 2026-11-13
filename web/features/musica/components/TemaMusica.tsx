import { Box, type BoxProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

const ESTILO_ROLAGEM_MUSICA = {
  colorScheme: 'dark',
  '& *': {
    scrollbarColor: 'var(--chakra-colors-cirqueira-musica-texto-desabilitado) transparent',
  },
  '& *::-webkit-scrollbar-thumb': {
    background: 'var(--chakra-colors-cirqueira-musica-texto-desabilitado)',
  },
  '& *:hover': {
    scrollbarColor: 'var(--chakra-colors-cirqueira-musica-texto-secundario) transparent',
  },
  '& *::-webkit-scrollbar-thumb:hover': {
    background: 'var(--chakra-colors-cirqueira-musica-texto-secundario)',
  },
} as const

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
      css={ESTILO_ROLAGEM_MUSICA}
      {...props}
    >
      {children}
    </Box>
  )
}
