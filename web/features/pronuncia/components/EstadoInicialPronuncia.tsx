import { Box, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Flag, Languages, Lightbulb, Volume2 } from 'lucide-react'
import { memo } from 'react'

const RECURSOS = [
  {
    icone: Languages,
    titulo: 'Tradução nos dois sentidos',
    texto: 'Escreva em português ou inglês: o idioma é detectado sozinho.',
  },
  {
    icone: Volume2,
    titulo: 'Ouça normal e devagar',
    texto: 'A palavra falada acende enquanto o áudio toca.',
  },
  {
    icone: Lightbulb,
    titulo: 'Dicas para brasileiros',
    texto: 'TH, R americano, "i" curto e longo e o T que vira R.',
  },
  {
    icone: Flag,
    titulo: 'Ficou errado? Reporte',
    texto: 'A correção vale para todas as frases com aquela palavra.',
  },
]

export const EstadoInicialPronuncia = memo(function EstadoInicialPronuncia() {
  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderStyle="dashed"
      borderRadius="12px"
      p={{ base: 4, md: 6 }}
    >
      <VStack align="stretch" gap={5}>
        <VStack gap={1}>
          <Text fontSize="sm" color="fg.subtle">
            Exemplo
          </Text>
          <Text fontSize="md" color="fg.muted">
            eu não sei →{' '}
            <Text as="span" color="fg" fontWeight="semibold">
              I don't know
            </Text>
          </Text>
          <Text fontSize="2xl" fontWeight="black" color="cirqueira.brand.300">
            ai DÔUNT NÔU
          </Text>
        </VStack>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
          {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
            <HStack
              key={titulo}
              align="flex-start"
              gap={3}
              p={3}
              borderRadius="10px"
              bg="bg.subtle"
            >
              <Box
                p={1.5}
                borderRadius="8px"
                bg="cirqueira.brand.500/10"
                color="cirqueira.brand.400"
                display="inline-flex"
                flexShrink={0}
              >
                <Icone size={16} />
              </Box>
              <VStack align="start" gap={0.5}>
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  {titulo}
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  {texto}
                </Text>
              </VStack>
            </HStack>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  )
})
