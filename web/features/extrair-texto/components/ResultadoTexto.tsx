import { Box, HStack, Kbd, Progress, Spinner, Text, Textarea, VStack } from '@chakra-ui/react'
import { CheckCircle2, TextSearch } from 'lucide-react'
import { memo } from 'react'
import type { EtapaExtracao } from '../hooks/useExtracaoTexto'

export interface ResultadoTextoProps {
  etapa: EtapaExtracao
  progresso: number
  texto: string
  copiadoAutomaticamente: boolean
  onAlterarTexto: (texto: string) => void
}

function descreverEtapa(etapa: EtapaExtracao, progresso: number): string {
  if (etapa === 'preparando') return 'Preparando o leitor (só na primeira vez)...'
  return `Lendo o texto... ${Math.round(progresso * 100)}%`
}

export const ResultadoTexto = memo(function ResultadoTexto({
  etapa,
  progresso,
  texto,
  copiadoAutomaticamente,
  onAlterarTexto,
}: ResultadoTextoProps) {
  if (etapa === 'preparando' || etapa === 'lendo') {
    return (
      <VStack
        justify="center"
        gap={4}
        minH="240px"
        p={6}
        borderRadius="8px"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
      >
        <Spinner size="lg" color="cirqueira.brand.500" />
        <Text fontSize="sm" color="fg.subtle">
          {descreverEtapa(etapa, progresso)}
        </Text>
        <Progress.Root
          w="full"
          maxW="xs"
          size="xs"
          colorPalette="brand"
          value={etapa === 'lendo' ? Math.round(progresso * 100) : null}
        >
          <Progress.Track borderRadius="full">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </VStack>
    )
  }

  if (etapa === 'concluida' && !texto) {
    return (
      <VStack
        justify="center"
        gap={3}
        minH="240px"
        p={6}
        borderRadius="8px"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
        color="fg.subtle"
        textAlign="center"
      >
        <TextSearch size={30} strokeWidth={1.5} />
        <Text fontSize="sm">Nenhum texto encontrado nessa imagem.</Text>
      </VStack>
    )
  }

  return (
    <VStack gap={2} alignItems="stretch" minH="240px">
      <Textarea
        flex="1"
        minH={{ base: '240px', lg: '0' }}
        value={texto}
        onChange={(evento) => onAlterarTexto(evento.target.value)}
        placeholder="O texto da imagem aparece aqui."
        fontSize="sm"
        lineHeight="tall"
        resize="none"
        borderRadius="8px"
        bg="bg.panel"
        borderColor="border.subtle"
        p={4}
      />
      <HStack justify="space-between" fontSize="xs" color="fg.subtle" flexWrap="wrap" gap={2}>
        <Box>
          {copiadoAutomaticamente && (
            <HStack gap={1.5} color="cirqueira.green.500">
              <CheckCircle2 size={13} />
              <Text as="span">Texto já copiado</Text>
            </HStack>
          )}
        </Box>
        <Text as="span">
          <Kbd size="sm">Ctrl</Kbd> + <Kbd size="sm">V</Kbd> outra imagem
        </Text>
      </HStack>
    </VStack>
  )
})
