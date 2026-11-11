import { Flex, Heading, Text, VStack } from '@chakra-ui/react'
import { type ReactNode, memo } from 'react'

export interface CabecalhoSecaoMusicaProps {
  titulo: string
  descricao?: string
  acoes?: ReactNode
  cor?: string
}

export const CabecalhoSecaoMusica = memo(function CabecalhoSecaoMusica({
  titulo,
  descricao,
  acoes,
  cor = 'cirqueira.musica.amarelo',
}: CabecalhoSecaoMusicaProps) {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'flex-start', md: 'center' }}
      gap={3}
      w="full"
    >
      <VStack align="flex-start" gap={0.5} minW={0}>
        <Heading
          as="h2"
          fontSize="sm"
          fontWeight="bold"
          color={cor}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {titulo}
        </Heading>
        {descricao && (
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
            {descricao}
          </Text>
        )}
      </VStack>
      {acoes}
    </Flex>
  )
})
