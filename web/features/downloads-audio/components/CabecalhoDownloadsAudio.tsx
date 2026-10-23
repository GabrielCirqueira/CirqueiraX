import { Badge, Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { Clock, Music, RefreshCw } from 'lucide-react'
import { memo } from 'react'
import type { ContagemStatusAudios } from '../types'

export interface CabecalhoDownloadsAudioProps {
  contagem: ContagemStatusAudios
  atualizando: boolean
  onAtualizar: () => void
}

export const CabecalhoDownloadsAudio = memo(function CabecalhoDownloadsAudio({
  contagem,
  atualizando,
  onAtualizar,
}: CabecalhoDownloadsAudioProps) {
  return (
    <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} gap={4}>
      <VStack align="start" gap={1} minW={0}>
        <HStack gap={2.5} flexWrap="wrap">
          <Box
            p={2}
            borderRadius="xl"
            bg="cirqueira.brand.500/15"
            color="cirqueira.brand.400"
            display="inline-flex"
          >
            <Music size={22} strokeWidth={2.2} />
          </Box>
          <Text as="h1" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black" color="fg">
            Downloads MP3
          </Text>
          <HStack gap={1.5} pl={1} flexWrap="wrap">
            <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="md">
              {contagem.total} {contagem.total === 1 ? 'áudio' : 'áudios'}
            </Badge>
            {contagem.prontos > 0 && (
              <Badge size="sm" variant="subtle" colorPalette="green" borderRadius="md">
                {contagem.prontos} {contagem.prontos === 1 ? 'pronto' : 'prontos'}
              </Badge>
            )}
            {contagem.emProcessamento > 0 && (
              <Badge size="sm" variant="subtle" colorPalette="amber" borderRadius="md">
                {contagem.emProcessamento} convertendo
              </Badge>
            )}
            {contagem.comErro > 0 && (
              <Badge size="sm" variant="subtle" colorPalette="red" borderRadius="md">
                {contagem.comErro} {contagem.comErro === 1 ? 'erro' : 'erros'}
              </Badge>
            )}
          </HStack>
        </HStack>
        <Text fontSize="xs" color="fg.subtle">
          Extraia só o áudio de vídeos em MP3 com título, artista e capa
        </Text>
      </VStack>

      <HStack gap={2} flexShrink={0}>
        <HStack
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          px={3}
          py={1.5}
          borderRadius="lg"
          fontSize="xs"
          color="fg.subtle"
          display={{ base: 'none', md: 'flex' }}
        >
          <Clock size={12} />
          <Text as="span">Arquivos guardados por 7 dias</Text>
        </HStack>
        <Button
          size="sm"
          variant="outline"
          borderRadius="lg"
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
