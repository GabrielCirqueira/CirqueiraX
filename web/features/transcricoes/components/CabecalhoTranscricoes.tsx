import { Badge, Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { AudioLines, RefreshCw, ShieldCheck } from 'lucide-react'
import { memo } from 'react'
import type { ResumoTranscricoes } from '../types'

export interface CabecalhoTranscricoesProps {
  resumo: ResumoTranscricoes | undefined
  atualizando: boolean
  onAtualizar: () => void
}

export const CabecalhoTranscricoes = memo(function CabecalhoTranscricoes({
  resumo,
  atualizando,
  onAtualizar,
}: CabecalhoTranscricoesProps) {
  const emAndamento = (resumo?.naFila ?? 0) + (resumo?.transcrevendo ?? 0)

  return (
    <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} gap={4}>
      <VStack align="start" gap={1} minW={0}>
        <HStack gap={2.5} flexWrap="wrap">
          <Box
            p={2}
            borderRadius="8px"
            bgGradient="to-br"
            gradientFrom="cirqueira.brand.500/25"
            gradientTo="cirqueira.brand.700/10"
            color="cirqueira.brand.400"
            display="inline-flex"
          >
            <AudioLines size={22} strokeWidth={2.2} />
          </Box>
          <Text as="h1" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black" color="fg">
            Transcrições
          </Text>
          {emAndamento > 0 && (
            <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="full" gap={1.5}>
              <Box
                boxSize={1.5}
                borderRadius="full"
                bg="cirqueira.brand.400"
                animation="pulse 1.4s ease-in-out infinite"
              />
              {emAndamento} em andamento
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" color="fg.subtle">
          Solte vários áudios de uma vez e acompanhe cada texto aparecendo em tempo real
        </Text>
      </VStack>

      <HStack gap={2} flexShrink={0}>
        <HStack
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          px={3}
          py={1.5}
          borderRadius="full"
          fontSize="xs"
          color="fg.subtle"
          display={{ base: 'none', md: 'flex' }}
        >
          <ShieldCheck size={12} />
          <Text as="span">
            Transcrito no servidor · áudio guardado por 7 dias, texto para sempre
          </Text>
        </HStack>
        <Button
          size="sm"
          variant="outline"
          borderRadius="full"
          disabled={atualizando}
          onClick={onAtualizar}
        >
          <RefreshCw
            size={14}
            style={{ animation: atualizando ? 'spin 1s linear infinite' : 'none' }}
          />
          <Text as="span" display={{ base: 'none', sm: 'inline' }}>
            {atualizando ? 'Atualizando...' : 'Atualizar'}
          </Text>
        </Button>
      </HStack>
    </Flex>
  )
})
