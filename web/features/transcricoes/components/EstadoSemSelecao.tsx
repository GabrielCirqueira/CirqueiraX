import { Box, Center, HStack, Text, VStack } from '@chakra-ui/react'
import { AudioLines, Download, MousePointerClick, PlayCircle, Search } from 'lucide-react'
import { memo } from 'react'

const RECURSOS = [
  { icone: PlayCircle, texto: 'Ouça o áudio e veja o trecho sendo falado destacado' },
  { icone: Search, texto: 'Procure palavras dentro de qualquer transcrição' },
  { icone: Download, texto: 'Exporte em TXT, Markdown ou legendas SRT e VTT' },
]

export const EstadoSemSelecao = memo(function EstadoSemSelecao() {
  return (
    <Center py={{ base: 10, lg: 20 }} px={6}>
      <VStack gap={5} maxW="360px" textAlign="center">
        <Box position="relative">
          <Center
            boxSize={20}
            borderRadius="full"
            bg="cirqueira.brand.500/12"
            color="cirqueira.brand.400"
          >
            <AudioLines size={36} />
          </Center>
          <Center
            position="absolute"
            bottom={-1}
            right={-1}
            boxSize={8}
            borderRadius="full"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            color="fg.muted"
          >
            <MousePointerClick size={15} />
          </Center>
        </Box>
        <VStack gap={1}>
          <Text fontSize="md" fontWeight="bold" color="fg">
            Escolha uma transcrição
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Clique em um áudio da lista para ler o texto, acompanhar ao vivo ou exportar.
          </Text>
        </VStack>
        <VStack align="stretch" gap={2} w="full">
          {RECURSOS.map((recurso) => (
            <HStack
              key={recurso.texto}
              gap={2.5}
              p={2.5}
              borderRadius="8px"
              bg="bg.subtle"
              textAlign="left"
            >
              <Box color="cirqueira.brand.400" display="inline-flex">
                <recurso.icone size={16} />
              </Box>
              <Text fontSize="xs" color="fg.muted">
                {recurso.texto}
              </Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </Center>
  )
})
