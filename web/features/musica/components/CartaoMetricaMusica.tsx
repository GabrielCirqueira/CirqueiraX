import { Box, Center, Flex, Text, VStack } from '@chakra-ui/react'
import type { LucideIcon } from 'lucide-react'
import { type ReactNode, memo } from 'react'

export interface CartaoMetricaMusicaProps {
  icone: LucideIcon
  rotulo: string
  valor: ReactNode
  detalhe?: ReactNode
  cor?: string
}

export const CartaoMetricaMusica = memo(function CartaoMetricaMusica({
  icone: Icone,
  rotulo,
  valor,
  detalhe,
  cor = 'cirqueira.musica.verde',
}: CartaoMetricaMusicaProps) {
  return (
    <Box
      p={{ base: 3, md: 4 }}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
      transition="background-color 0.15s ease"
      minW={0}
    >
      <Flex gap={{ base: 2, md: 3 }} align="flex-start" direction={{ base: 'column', sm: 'row' }}>
        <Center
          boxSize={{ base: 7, md: 9 }}
          borderRadius="full"
          color={cor}
          position="relative"
          flexShrink={0}
        >
          <Box position="absolute" inset={0} borderRadius="full" bg={cor} opacity={0.15} />
          <Icone size={17} />
        </Center>
        <VStack align="flex-start" gap={0.5} flex={1} minW={0}>
          <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" textTransform="uppercase">
            {rotulo}
          </Text>
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight="bold"
            color="cirqueira.musica.textoPrincipal"
            truncate
            maxW="full"
          >
            {valor}
          </Text>
          {detalhe && (
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario" lineClamp={2}>
              {detalhe}
            </Text>
          )}
        </VStack>
      </Flex>
    </Box>
  )
})
