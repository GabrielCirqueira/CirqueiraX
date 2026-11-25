import { Text } from '@chakra-ui/react'
import { memo } from 'react'
import { dividirEmTrechos, isTrechoAtivo } from '../utils'

export interface TextoComDestaqueFalaProps {
  texto: string
  indiceFala: number | null
}

export const TextoComDestaqueFala = memo(function TextoComDestaqueFala({
  texto,
  indiceFala,
}: TextoComDestaqueFalaProps) {
  return (
    <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="semibold" color="fg" lineHeight="1.5">
      {dividirEmTrechos(texto).map((trecho) => (
        <Text
          as="span"
          key={trecho.inicio}
          borderRadius="4px"
          transition="background 0.15s, color 0.15s"
          bg={isTrechoAtivo(trecho, indiceFala) ? 'cirqueira.brand.500/25' : 'transparent'}
          color={isTrechoAtivo(trecho, indiceFala) ? 'cirqueira.brand.300' : 'inherit'}
        >
          {trecho.texto}
        </Text>
      ))}
    </Text>
  )
})
