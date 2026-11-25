import { Text } from '@chakra-ui/react'
import { Fragment, memo } from 'react'

export interface SilabasDestacadasProps {
  silabas: string[]
  tonica: number | null
  tamanho?: string
}

export const SilabasDestacadas = memo(function SilabasDestacadas({
  silabas,
  tonica,
  tamanho = 'sm',
}: SilabasDestacadasProps) {
  return (
    <Text as="span" fontSize={tamanho} fontWeight="medium" letterSpacing="0.01em">
      {silabas.map((silaba, indice) => (
        <Fragment key={`${silaba}-${indice}`}>
          {indice > 0 && (
            <Text as="span" color="fg.subtle" mx="1px">
              ·
            </Text>
          )}
          <Text
            as="span"
            color={indice === tonica ? 'cirqueira.brand.300' : 'fg'}
            fontWeight={indice === tonica ? 'black' : 'medium'}
          >
            {silaba}
          </Text>
        </Fragment>
      ))}
    </Text>
  )
})
