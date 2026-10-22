import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Link,
  Text,
  VStack,
  chakra,
} from '@chakra-ui/react'
import { Download, ExternalLink, Loader2, Pause, Play, RotateCcw, Trash2 } from 'lucide-react'
import { memo, useState } from 'react'
import { obterUrlArquivoAudio, obterUrlReproducaoAudio } from '../api'
import type { Audio } from '../types'
import {
  descreverDetalhesAudio,
  descreverValidadeAudio,
  nomeExibicaoAudio,
  obterAparenciaStatusAudio,
  resumirErroAudio,
} from '../utils/audios'
import { CapaAudio } from './CapaAudio'

export interface ItemAudioProps {
  audio: Audio
  agora: number
  reproduzindo: boolean
  rebaixando: boolean
  apagando: boolean
  onAlternarReproducao: (uuid: string) => void
  onRebaixar: (uuid: string) => void
  onApagar: (uuid: string) => void
}

export const ItemAudio = memo(function ItemAudio({
  audio,
  agora,
  reproduzindo,
  rebaixando,
  apagando,
  onAlternarReproducao,
  onRebaixar,
  onApagar,
}: ItemAudioProps) {
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false)
  const aparencia = obterAparenciaStatusAudio(audio.status)
  const nome = nomeExibicaoAudio(audio)
  const detalhes = descreverDetalhesAudio(audio)
  const validade = descreverValidadeAudio(audio, agora)
  const erro = resumirErroAudio(audio.erroMotivo)

  function removerComConfirmacao() {
    if (confirmandoRemocao) {
      onApagar(audio.uuid)
      return
    }
    setConfirmandoRemocao(true)
  }

  return (
    <VStack align="stretch" gap={3} px={{ base: 3, md: 4 }} py={3}>
      <Flex
        gap={3}
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
      >
        <HStack gap={3} flex={1} minW={0} w="full">
          <CapaAudio thumbnailUrl={audio.thumbnailUrl} esmaecida={!audio.isDisponivel} />
          <VStack align="flex-start" gap={1} minW={0} flex={1}>
            <Text fontSize="sm" fontWeight="medium" color="fg" truncate maxW="full" title={nome}>
              {nome}
            </Text>
            <HStack gap={2} flexWrap="wrap" rowGap={1}>
              <Badge size="sm" variant="subtle" colorPalette={aparencia.paleta} borderRadius="md">
                {audio.isEmProcessamento && (
                  <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                )}
                {aparencia.rotulo}
              </Badge>
              {detalhes && (
                <Text fontSize="xs" color="fg.subtle">
                  {detalhes}
                </Text>
              )}
              {validade && (
                <Text fontSize="xs" color="fg.subtle">
                  · {validade}
                </Text>
              )}
            </HStack>
            {erro && (
              <Text
                fontSize="xs"
                color="cirqueira.red.500"
                lineClamp={2}
                title={audio.erroMotivo ?? undefined}
              >
                {erro}
              </Text>
            )}
          </VStack>
        </HStack>

        <HStack gap={1} flexShrink={0} alignSelf={{ base: 'flex-end', md: 'center' }}>
          {audio.isDisponivel && (
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="lg"
              color="fg.muted"
              aria-label={reproduzindo ? 'Fechar player' : 'Ouvir'}
              title={reproduzindo ? 'Fechar player' : 'Ouvir'}
              onClick={() => onAlternarReproducao(audio.uuid)}
            >
              {reproduzindo ? <Pause size={16} /> : <Play size={16} />}
            </IconButton>
          )}
          {audio.isDisponivel && (
            <Button asChild size="sm" variant="subtle" colorPalette="brand" borderRadius="lg">
              <Link
                href={obterUrlArquivoAudio(audio.uuid)}
                download
                _hover={{ textDecoration: 'none' }}
              >
                <Download size={15} />
                MP3
              </Link>
            </Button>
          )}
          {audio.isRebaixavel && (
            <Button
              size="sm"
              variant="outline"
              borderRadius="lg"
              loading={rebaixando}
              onClick={() => onRebaixar(audio.uuid)}
            >
              <RotateCcw size={14} />
              Baixar de novo
            </Button>
          )}
          <IconButton
            asChild
            size="sm"
            variant="ghost"
            borderRadius="lg"
            color="fg.muted"
            aria-label="Abrir link original"
            title="Abrir link original"
          >
            <Link href={audio.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} />
            </Link>
          </IconButton>
          {confirmandoRemocao ? (
            <Button
              size="sm"
              variant="subtle"
              colorPalette="red"
              borderRadius="lg"
              loading={apagando}
              onClick={removerComConfirmacao}
              onMouseLeave={() => setConfirmandoRemocao(false)}
            >
              Remover?
            </Button>
          ) : (
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="lg"
              color="fg.muted"
              aria-label="Remover áudio"
              title={audio.isEmProcessamento ? 'Aguarde o download terminar' : 'Remover áudio'}
              disabled={audio.isEmProcessamento}
              onClick={removerComConfirmacao}
            >
              <Trash2 size={15} />
            </IconButton>
          )}
        </HStack>
      </Flex>

      {reproduzindo && (
        <Box pl={{ base: 0, md: 15 }}>
          <chakra.audio src={obterUrlReproducaoAudio(audio.uuid)} controls autoPlay w="full" h={10}>
            <track kind="captions" />
          </chakra.audio>
        </Box>
      )}
    </VStack>
  )
})
