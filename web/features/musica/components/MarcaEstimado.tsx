import { Text } from '@chakra-ui/react'
import { memo } from 'react'

export const MarcaEstimado = memo(function MarcaEstimado() {
  return (
    <Text
      as="span"
      fontSize="2xs"
      fontWeight="bold"
      color="cirqueira.musica.textoDesabilitado"
      cursor="default"
      aria-label="Inclui tempo estimado do YouTube Music"
      title="Inclui tempo estimado do YouTube Music"
    >
      est.
    </Text>
  )
})
