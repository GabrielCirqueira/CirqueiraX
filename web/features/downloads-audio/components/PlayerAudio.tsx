import { Box, Flex, HStack, IconButton, Link, Text, VStack, chakra } from '@chakra-ui/react'
import { Download, X } from 'lucide-react'
import { memo } from 'react'
import { obterUrlArquivoAudio, obterUrlReproducaoAudio } from '../api'
import type { Audio } from '../types'
import { nomeExibicaoAudio } from '../utils/audios'
import { CapaAudio } from './CapaAudio'

export interface PlayerAudioProps {
  audio: Audio
  onFechar: () => void
}

export const PlayerAudio = memo(function PlayerAudio({ audio, onFechar }: PlayerAudioProps) {
  const nome = nomeExibicaoAudio(audio)

  return (
    <Box
      position="sticky"
      bottom={{ base: 3, md: 5 }}
      zIndex={20}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="cirqueira.brand.500/40"
      borderRadius="2xl"
      shadow="xl"
      p={{ base: 2.5, md: 3 }}
    >
      <Flex gap={{ base: 2.5, md: 4 }} align="center" direction={{ base: 'column', md: 'row' }}>
        <HStack gap={3} w={{ base: 'full', md: '280px' }} flexShrink={0} minW={0}>
          <Box boxSize={12} borderRadius="lg" overflow="hidden" flexShrink={0}>
            <CapaAudio thumbnailUrl={audio.thumbnailUrl} tamanhoIcone={5} />
          </Box>
          <VStack align="flex-start" gap={0} minW={0} flex={1}>
            <Text
              fontSize="10px"
              fontWeight="bold"
              color="cirqueira.brand.400"
              letterSpacing="wider"
            >
              TOCANDO AGORA
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="fg" truncate maxW="full" title={nome}>
              {nome}
            </Text>
            <Text fontSize="xs" color="fg.muted" truncate maxW="full">
              {audio.autor ?? 'Autor desconhecido'}
            </Text>
          </VStack>
          <HStack gap={1} display={{ base: 'flex', md: 'none' }}>
            <IconButton asChild size="sm" variant="ghost" borderRadius="lg" aria-label="Baixar MP3">
              <Link href={obterUrlArquivoAudio(audio.uuid)} download>
                <Download size={16} />
              </Link>
            </IconButton>
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="lg"
              aria-label="Fechar player"
              onClick={onFechar}
            >
              <X size={16} />
            </IconButton>
          </HStack>
        </HStack>

        <chakra.audio
          key={audio.uuid}
          src={obterUrlReproducaoAudio(audio.uuid)}
          controls
          autoPlay
          flex={1}
          w="full"
          h={10}
        >
          <track kind="captions" />
        </chakra.audio>

        <HStack gap={1} display={{ base: 'none', md: 'flex' }}>
          <IconButton
            asChild
            size="sm"
            variant="ghost"
            borderRadius="lg"
            color="fg.muted"
            aria-label="Baixar MP3"
            title="Baixar MP3"
          >
            <Link href={obterUrlArquivoAudio(audio.uuid)} download>
              <Download size={16} />
            </Link>
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            borderRadius="lg"
            color="fg.muted"
            aria-label="Fechar player"
            title="Fechar player"
            onClick={onFechar}
          >
            <X size={16} />
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  )
})
