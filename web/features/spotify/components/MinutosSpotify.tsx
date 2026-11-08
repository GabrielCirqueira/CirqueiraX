import { Box, Portal, Tooltip } from '@chakra-ui/react'
import { type ReactNode, memo } from 'react'
import { formatarMinutos, formatarMinutosEmHorasExtenso } from '../utils/formatadoresSpotify'

const MINUTOS_EM_UMA_HORA = 60

export interface TooltipSpotifyProps {
  conteudo: ReactNode
  children: ReactNode
  desativado?: boolean
}

export const TooltipSpotify = memo(function TooltipSpotify({
  conteudo,
  children,
  desativado = false,
}: TooltipSpotifyProps) {
  if (desativado) return <>{children}</>

  return (
    <Tooltip.Root openDelay={200} closeDelay={50} positioning={{ placement: 'top' }}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content
            bg="cirqueira.spotify.cartaoElevado"
            color="cirqueira.spotify.textoPrincipal"
            fontFamily="inter"
            fontSize="sm"
            fontWeight="semibold"
            px={2}
            py={1}
            borderRadius="4px"
            boxShadow="lg"
            maxW="xs"
          >
            {conteudo}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  )
})

export interface MinutosSpotifyProps {
  minutos: number
  sufixo?: string
}

export const MinutosSpotify = memo(function MinutosSpotify({
  minutos,
  sufixo,
}: MinutosSpotifyProps) {
  const texto = sufixo ? `${formatarMinutos(minutos)} ${sufixo}` : formatarMinutos(minutos)

  return (
    <TooltipSpotify
      conteudo={formatarMinutosEmHorasExtenso(minutos)}
      desativado={Math.round(minutos) < MINUTOS_EM_UMA_HORA}
    >
      <Box as="span" cursor="default" whiteSpace="nowrap">
        {texto}
      </Box>
    </TooltipSpotify>
  )
})
