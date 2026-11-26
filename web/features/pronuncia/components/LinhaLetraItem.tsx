import { Box, Text } from '@chakra-ui/react'
import { memo } from 'react'
import type { LinhaLetra, ModoPronuncia } from '../types'
import { pronunciaDaAnalise } from '../utils'

export type EstadoLinhaLetra = 'passada' | 'ativa' | 'futura'

export interface LinhaLetraItemProps {
  linha: LinhaLetra
  indice: number
  estado: EstadoLinhaLetra
  selecionada: boolean
  modo: ModoPronuncia
  mostrarPronuncia: boolean
  mostrarTraducao: boolean
  onSelecionar: (indice: number) => void
  registrarElemento: (indice: number, elemento: HTMLDivElement | null) => void
}

export const LinhaLetraItem = memo(function LinhaLetraItem({
  linha,
  indice,
  estado,
  selecionada,
  modo,
  mostrarPronuncia,
  mostrarTraducao,
  onSelecionar,
  registrarElemento,
}: LinhaLetraItemProps) {
  const ativa = estado === 'ativa'
  const pronuncia = linha.analise ? pronunciaDaAnalise(linha.analise, modo) : null

  if (linha.texto === '') {
    return (
      <Box
        ref={(elemento: HTMLDivElement | null) => registrarElemento(indice, elemento)}
        py={2}
        px={4}
        color={ativa ? 'cirqueira.musica.verde' : 'fg.subtle'}
        fontSize="lg"
        aria-hidden
      >
        ♪
      </Box>
    )
  }

  return (
    <Box
      ref={(elemento: HTMLDivElement | null) => registrarElemento(indice, elemento)}
      as="button"
      onClick={() => onSelecionar(indice)}
      textAlign="left"
      w="full"
      px={4}
      py={ativa ? 3 : 2}
      borderRadius="12px"
      borderWidth="1px"
      borderColor={
        selecionada ? 'cirqueira.brand.400/60' : ativa ? 'cirqueira.musica.verde/40' : 'transparent'
      }
      bg={
        ativa ? 'cirqueira.musica.verde/8' : selecionada ? 'cirqueira.brand.500/8' : 'transparent'
      }
      opacity={estado === 'passada' && !selecionada ? 0.5 : 1}
      transition="all 0.25s ease"
      _hover={{ bg: ativa ? 'cirqueira.musica.verde/10' : 'bg.subtle', opacity: 1 }}
    >
      <Text
        fontSize={ativa ? { base: 'lg', md: 'xl' } : { base: 'md', md: 'lg' }}
        fontWeight={ativa ? 'bold' : 'semibold'}
        color="fg"
        lineHeight="1.35"
        transition="font-size 0.25s ease"
      >
        {linha.texto}
      </Text>
      {mostrarPronuncia && pronuncia && (
        <Text
          fontSize={ativa ? { base: 'md', md: 'lg' } : 'md'}
          fontWeight="bold"
          color={ativa ? 'cirqueira.brand.300' : 'cirqueira.brand.400'}
          lineHeight="1.4"
          mt={0.5}
        >
          {pronuncia}
        </Text>
      )}
      {mostrarTraducao && linha.traducao && (
        <Text fontSize="sm" color="fg.muted" fontStyle="italic" mt={0.5}>
          {linha.traducao}
        </Text>
      )}
    </Box>
  )
})
