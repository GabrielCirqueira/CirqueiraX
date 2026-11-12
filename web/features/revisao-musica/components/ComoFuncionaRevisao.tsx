import { Box, Collapsible, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { memo } from 'react'
import { PASSOS_REVISAO } from '../utils'

export const ComoFuncionaRevisao = memo(function ComoFuncionaRevisao() {
  return (
    <Collapsible.Root
      borderRadius="10px"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
    >
      <Collapsible.Trigger
        w="full"
        px={4}
        py={3}
        cursor="pointer"
        color="cirqueira.musica.textoPrincipal"
        _hover={{ bg: 'cirqueira.musica.cartao' }}
        borderRadius="10px"
      >
        <HStack justify="space-between" gap={3}>
          <HStack gap={2}>
            <HelpCircle size={16} />
            <Text fontSize="sm" fontWeight="semibold">
              Como funciona a revisão
            </Text>
          </HStack>
          <Collapsible.Indicator
            transition="transform 0.2s"
            _open={{ transform: 'rotate(180deg)' }}
          >
            <ChevronDown size={16} />
          </Collapsible.Indicator>
        </HStack>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <VStack align="stretch" gap={3} px={4} pb={4}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
            {PASSOS_REVISAO.map((passo, indice) => (
              <HStack key={passo.titulo} align="start" gap={3}>
                <Box
                  flexShrink={0}
                  w={6}
                  h={6}
                  borderRadius="full"
                  bg="cirqueira.musica.verde"
                  color="cirqueira.musica.fundo"
                  fontSize="xs"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {indice + 1}
                </Box>
                <VStack align="start" gap={0.5}>
                  <Text fontSize="sm" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
                    {passo.titulo}
                  </Text>
                  <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                    {passo.texto}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </SimpleGrid>
          <Text fontSize="xs" color="cirqueira.musica.textoDesabilitado">
            Nada do histórico original é apagado. Toda correção pode ser refeita depois e passa a
            valer também para as próximas vezes que o mesmo vídeo tocar.
          </Text>
        </VStack>
      </Collapsible.Content>
    </Collapsible.Root>
  )
})
