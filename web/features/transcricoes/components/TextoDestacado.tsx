import { Text } from '@chakra-ui/react'
import { memo } from 'react'
import { dividirTextoDestacado } from '../utils'

export interface TextoDestacadoProps {
  texto: string
  termo: string
}

export const TextoDestacado = memo(function TextoDestacado({ texto, termo }: TextoDestacadoProps) {
  return (
    <>
      {dividirTextoDestacado(texto, termo).map((parte, indice) =>
        parte.destaque ? (
          <Text
            as="mark"
            key={`${indice}-${parte.texto}`}
            bg="cirqueira.amber.400/40"
            color="inherit"
            borderRadius="sm"
            px={0.5}
          >
            {parte.texto}
          </Text>
        ) : (
          <Text as="span" key={`${indice}-${parte.texto}`}>
            {parte.texto}
          </Text>
        )
      )}
    </>
  )
})
