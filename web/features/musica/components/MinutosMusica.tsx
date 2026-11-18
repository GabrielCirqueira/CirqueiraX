import { Box, HStack, Portal, Text, Tooltip, VStack } from '@chakra-ui/react'
import { type ReactNode, memo } from 'react'
import type { PorFonte } from '../types'
import { formatarMinutos, montarLinhasTooltipMinutos } from '../utils/formatadoresMusica'
import { MarcaEstimado } from './MarcaEstimado'

export interface TooltipMusicaProps {
  conteudo: ReactNode
  children: ReactNode
  desativado?: boolean
  openDelay?: number
  closeDelay?: number
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export const TooltipMusica = memo(function TooltipMusica({
  conteudo,
  children,
  desativado = false,
  openDelay = 200,
  closeDelay = 50,
  placement = 'top',
}: TooltipMusicaProps) {
  if (desativado) return <>{children}</>

  return (
    <Tooltip.Root
      openDelay={openDelay}
      closeDelay={closeDelay}
      positioning={{ placement }}
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content
            bg="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
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

export interface MinutosMusicaProps {
  minutos: number
  sufixo?: string
  porFonte?: PorFonte
  estimado?: boolean
}

export const MinutosMusica = memo(function MinutosMusica({
  minutos,
  sufixo,
  porFonte,
  estimado = false,
}: MinutosMusicaProps) {
  const texto = sufixo ? `${formatarMinutos(minutos)} ${sufixo}` : formatarMinutos(minutos)
  const linhas = montarLinhasTooltipMinutos(minutos, porFonte)

  return (
    <TooltipMusica
      conteudo={
        <VStack gap={0.5} align="start">
          {linhas.map((linha) => (
            <Text key={linha} as="span">
              {linha}
            </Text>
          ))}
        </VStack>
      }
      desativado={linhas.length === 0}
    >
      <HStack as="span" gap={1} cursor="default" whiteSpace="nowrap" display="inline-flex">
        <Box as="span">{texto}</Box>
        {estimado && <MarcaEstimado />}
      </HStack>
    </TooltipMusica>
  )
})
