import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Link,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertTriangle,
  Clock,
  Download,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { memo, useState } from 'react'
import { obterUrlArquivoAudio } from '../api'
import type { Audio } from '../types'
import {
  calcularPercentualValidadeAudio,
  descreverValidadeAudio,
  formatarDuracaoAudio,
  formatarTamanhoAudio,
  identificarPlataformaAudio,
  isValidadeCritica,
  nomeExibicaoAudio,
  obterAparenciaStatusAudio,
  resumirErroAudio,
} from '../utils/audios'
import { CapaAudio } from './CapaAudio'

export interface CardAudioProps {
  audio: Audio
  agora: number
  tocando: boolean
  rebaixando: boolean
  apagando: boolean
  onAlternarReproducao: (audio: Audio) => void
  onRebaixar: (uuid: string) => void
  onApagar: (uuid: string) => void
}

export const CardAudio = memo(function CardAudio({
  audio,
  agora,
  tocando,
  rebaixando,
  apagando,
  onAlternarReproducao,
  onRebaixar,
  onApagar,
}: CardAudioProps) {
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false)
  const aparencia = obterAparenciaStatusAudio(audio.status)
  const nome = nomeExibicaoAudio(audio)
  const plataforma = identificarPlataformaAudio(audio)
  const duracao = formatarDuracaoAudio(audio.duracaoSegundos)
  const tamanho = formatarTamanhoAudio(audio.tamanhoBytes)
  const validade = descreverValidadeAudio(audio, agora)
  const percentualValidade = calcularPercentualValidadeAudio(audio, agora)
  const erro = resumirErroAudio(audio.erroMotivo)

  function removerComConfirmacao() {
    if (confirmandoRemocao) {
      onApagar(audio.uuid)
      return
    }
    setConfirmandoRemocao(true)
  }

  return (
    <VStack
      role="group"
      align="stretch"
      gap={0}
      bg="bg.panel"
      borderWidth="1px"
      borderColor={tocando ? 'cirqueira.brand.500' : 'border.subtle'}
      borderRadius="2xl"
      overflow="hidden"
      shadow={tocando ? 'md' : 'xs'}
      transition="all 0.2s ease"
      _hover={{ borderColor: tocando ? 'cirqueira.brand.500' : 'border.emphasized', shadow: 'md' }}
    >
      <Box position="relative" aspectRatio="16/10" w="full" overflow="hidden">
        <CapaAudio
          thumbnailUrl={audio.thumbnailUrl}
          apagada={!audio.isDisponivel}
          exibirIcone={audio.isDisponivel}
        />

        <HStack position="absolute" top={2} left={2} right={2} justify="space-between" gap={1.5}>
          {plataforma ? (
            <HStack
              gap={1}
              borderRadius="md"
              bg="cirqueira.grey.950/85"
              px={1.5}
              py={0.5}
              fontSize="10px"
              fontWeight="semibold"
              color="cirqueira.grey.0"
            >
              <Box as="span" display="inline-flex" color={`${plataforma.colorPalette}.400`}>
                <plataforma.icone size={11} />
              </Box>
              {plataforma.nome}
            </HStack>
          ) : (
            <Box />
          )}
          {duracao && (
            <Box
              borderRadius="md"
              bg="cirqueira.grey.950/85"
              px={1.5}
              py={0.5}
              fontSize="11px"
              fontWeight="bold"
              fontFamily="mono"
              color="cirqueira.grey.0"
            >
              {duracao}
            </Box>
          )}
        </HStack>

        {audio.isDisponivel && (
          <Flex
            position="absolute"
            inset={0}
            align="center"
            justify="center"
            bg={tocando ? 'cirqueira.grey.950/40' : 'transparent'}
            opacity={{ base: 1, md: tocando ? 1 : 0 }}
            transition="opacity 0.2s ease, background 0.2s ease"
            _groupHover={{ opacity: 1, bg: 'cirqueira.grey.950/40' }}
          >
            <IconButton
              colorPalette="brand"
              borderRadius="full"
              boxSize={{ base: 10, md: 12 }}
              shadow="lg"
              aria-label={tocando ? 'Pausar' : 'Ouvir'}
              title={tocando ? 'Pausar' : 'Ouvir'}
              onClick={() => onAlternarReproducao(audio)}
            >
              {tocando ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" />
              )}
            </IconButton>
          </Flex>
        )}

        {!audio.isDisponivel && (
          <VStack
            position="absolute"
            inset={0}
            justify="center"
            gap={2}
            bg="cirqueira.grey.950/55"
            color="cirqueira.grey.0"
          >
            <Box
              p={2.5}
              borderRadius="full"
              bg="cirqueira.grey.950/70"
              display="inline-flex"
              color={audio.status === 'erro' ? 'cirqueira.red.400' : 'cirqueira.grey.0'}
            >
              {audio.isEmProcessamento && (
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
              )}
              {audio.status === 'erro' && <AlertTriangle size={22} />}
              {audio.status === 'expirado' && <Clock size={22} />}
            </Box>
            <Text fontSize="xs" fontWeight="semibold">
              {aparencia.rotulo}
            </Text>
          </VStack>
        )}
      </Box>

      <VStack align="stretch" gap={2.5} p={3} flex={1}>
        <VStack align="stretch" gap={0.5}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="fg"
            lineClamp={2}
            lineHeight="short"
            title={nome}
          >
            {nome}
          </Text>
          <Text fontSize="xs" color="fg.muted" truncate>
            {audio.autor ?? 'Autor desconhecido'}
          </Text>
        </VStack>

        <HStack gap={1.5} flexWrap="wrap">
          <Badge size="xs" variant="subtle" colorPalette={aparencia.paleta} borderRadius="md">
            {aparencia.rotulo}
          </Badge>
          {tamanho && (
            <Text fontSize="11px" color="fg.subtle" fontFamily="mono">
              {tamanho}
            </Text>
          )}
        </HStack>

        {percentualValidade !== null && (
          <VStack align="stretch" gap={1}>
            <Progress.Root
              value={percentualValidade}
              size="xs"
              colorPalette={isValidadeCritica(percentualValidade) ? 'amber' : 'brand'}
            >
              <Progress.Track borderRadius="full" bg="bg.muted">
                <Progress.Range borderRadius="full" />
              </Progress.Track>
            </Progress.Root>
            <HStack gap={1} color="fg.subtle">
              <Clock size={11} />
              <Text fontSize="11px">{validade}</Text>
            </HStack>
          </VStack>
        )}

        {audio.status === 'expirado' && (
          <HStack gap={1} color="fg.subtle">
            <Clock size={11} />
            <Text fontSize="11px">{validade}</Text>
          </HStack>
        )}

        {erro && (
          <Text
            fontSize="11px"
            color="cirqueira.red.500"
            lineClamp={2}
            title={audio.erroMotivo ?? undefined}
          >
            {erro}
          </Text>
        )}

        <HStack gap={1} mt="auto" pt={1}>
          {audio.isDisponivel && (
            <Button
              asChild
              size="xs"
              flex={1}
              h={8}
              variant="subtle"
              colorPalette="brand"
              borderRadius="lg"
            >
              <Link
                href={obterUrlArquivoAudio(audio.uuid)}
                download
                _hover={{ textDecoration: 'none' }}
              >
                <Download size={13} />
                MP3
              </Link>
            </Button>
          )}
          {audio.isRebaixavel && (
            <Button
              size="xs"
              flex={1}
              h={8}
              variant="outline"
              borderRadius="lg"
              loading={rebaixando}
              onClick={() => onRebaixar(audio.uuid)}
            >
              <RotateCcw size={13} />
              Baixar de novo
            </Button>
          )}
          {audio.isEmProcessamento && (
            <Button size="xs" flex={1} h={8} variant="subtle" borderRadius="lg" disabled>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              {aparencia.rotulo}
            </Button>
          )}
          <IconButton
            asChild
            size="xs"
            h={8}
            w={8}
            variant="ghost"
            borderRadius="lg"
            color="fg.muted"
            aria-label="Abrir link original"
            title="Abrir link original"
          >
            <Link href={audio.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} />
            </Link>
          </IconButton>
          {confirmandoRemocao ? (
            <Button
              size="xs"
              h={8}
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
              size="xs"
              h={8}
              w={8}
              variant="ghost"
              borderRadius="lg"
              color="fg.muted"
              _hover={{ color: 'cirqueira.red.500', bg: 'cirqueira.red.500/10' }}
              aria-label="Remover áudio"
              title={audio.isEmProcessamento ? 'Aguarde a conversão terminar' : 'Remover áudio'}
              disabled={audio.isEmProcessamento}
              onClick={removerComConfirmacao}
            >
              <Trash2 size={14} />
            </IconButton>
          )}
        </HStack>
      </VStack>
    </VStack>
  )
})
