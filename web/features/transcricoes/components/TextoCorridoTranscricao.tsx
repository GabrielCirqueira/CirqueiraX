import { Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import { TextoDestacado } from './TextoDestacado'

export interface TextoCorridoTranscricaoProps {
  texto: string
  termo: string
}

export const TextoCorridoTranscricao = memo(function TextoCorridoTranscricao({
  texto,
  termo,
}: TextoCorridoTranscricaoProps) {
  return (
    <VStack align="stretch" gap={4} px={1}>
      {texto.split('\n\n').map((paragrafo, indice) => (
        <Text key={`${indice}-${paragrafo.slice(0, 12)}`} fontSize="md" color="fg" lineHeight="1.8">
          <TextoDestacado texto={paragrafo} termo={termo} />
        </Text>
      ))}
    </VStack>
  )
})
