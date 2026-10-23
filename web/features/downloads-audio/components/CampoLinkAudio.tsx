import { extrairUrlsTexto } from '@/features/downloads-video/utils/extrairUrls'
import { identificarPlataforma } from '@/features/downloads-video/utils/plataformaVideo'
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Clipboard, Link2, Loader2, Music, X } from 'lucide-react'
import { type ClipboardEvent, type FormEvent, memo, useMemo, useRef, useState } from 'react'
import { PLATAFORMAS_SUPORTADAS_AUDIO } from '../utils/audios'

export interface CampoLinkAudioProps {
  enviando: boolean
  emProcessamento: number
  onSolicitar: (urls: string[]) => void
}

export const CampoLinkAudio = memo(function CampoLinkAudio({
  enviando,
  emProcessamento,
  onSolicitar,
}: CampoLinkAudioProps) {
  const [texto, setTexto] = useState('')
  const [emFoco, setEmFoco] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const urlsDetectadas = useMemo(() => extrairUrlsTexto(texto), [texto])
  const plataforma = identificarPlataforma(urlsDetectadas[0] ?? '')
  const destacado = emFoco || texto.length > 0

  function solicitar(urls: string[]) {
    if (urls.length === 0) return
    onSolicitar(urls)
    setTexto('')
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    solicitar(urlsDetectadas)
  }

  function aoColar(evento: ClipboardEvent<HTMLInputElement>) {
    const urls = extrairUrlsTexto(evento.clipboardData.getData('text'))
    if (urls.length <= 1) return
    evento.preventDefault()
    solicitar(urls)
  }

  async function colarDaAreaDeTransferencia() {
    try {
      const urls = extrairUrlsTexto(await navigator.clipboard.readText())
      if (urls.length > 0) {
        solicitar(urls)
        return
      }
    } catch {}
    inputRef.current?.focus()
  }

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor={destacado ? 'cirqueira.brand.500' : 'border.subtle'}
      borderRadius="2xl"
      shadow={destacado ? 'md' : 'xs'}
      transition="all 0.2s ease"
      p={{ base: 3.5, md: 4 }}
    >
      <VStack align="stretch" gap={3.5}>
        <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
          <HStack gap={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg="cirqueira.brand.500/15"
              color="cirqueira.brand.400"
              display="inline-flex"
            >
              {enviando ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Music size={16} />
              )}
            </Box>
            <VStack align="flex-start" gap={0}>
              <Text fontSize="sm" fontWeight="bold" color="fg">
                Novo MP3
              </Text>
              <Text fontSize="xs" color="fg.subtle">
                Cole um ou vários links de vídeo
              </Text>
            </VStack>
          </HStack>

          {emProcessamento > 0 && (
            <Badge size="sm" variant="subtle" colorPalette="amber" borderRadius="md">
              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
              {emProcessamento === 1 ? '1 convertendo' : `${emProcessamento} convertendo`}
            </Badge>
          )}
        </Flex>

        <Box as="form" onSubmit={aoEnviar}>
          <Flex gap={2} direction={{ base: 'column', sm: 'row' }}>
            <Box position="relative" flex={1}>
              <Box
                position="absolute"
                left={3.5}
                top="50%"
                transform="translateY(-50%)"
                zIndex={1}
                pointerEvents="none"
                display="inline-flex"
                color={plataforma?.conhecido ? `${plataforma.colorPalette}.400` : 'fg.subtle'}
              >
                <Icon as={plataforma?.conhecido ? plataforma.icone : Link2} boxSize={4} />
              </Box>
              <Input
                ref={inputRef}
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                onPaste={aoColar}
                onFocus={() => setEmFoco(true)}
                onBlur={() => setEmFoco(false)}
                placeholder="https://youtube.com/watch?v=..."
                aria-label="Link do áudio"
                h={11}
                ps={10}
                pe={texto ? 10 : 3}
                fontSize="sm"
                bg="bg.muted/50"
                borderColor="border.subtle"
                borderRadius="xl"
                _focusVisible={{ borderColor: 'cirqueira.brand.500', outline: 'none' }}
              />
              {texto && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  right={1.5}
                  top="50%"
                  transform="translateY(-50%)"
                  borderRadius="lg"
                  aria-label="Limpar campo"
                  onClick={() => setTexto('')}
                >
                  <X size={14} />
                </IconButton>
              )}
            </Box>

            {urlsDetectadas.length > 0 ? (
              <Button
                type="submit"
                colorPalette="brand"
                borderRadius="xl"
                h={11}
                px={5}
                flexShrink={0}
                loading={enviando}
              >
                <Music size={15} />
                {urlsDetectadas.length > 1 ? `Baixar ${urlsDetectadas.length} MP3` : 'Baixar MP3'}
              </Button>
            ) : (
              <Button
                variant="subtle"
                colorPalette="brand"
                borderRadius="xl"
                h={11}
                px={4}
                flexShrink={0}
                loading={enviando}
                onClick={colarDaAreaDeTransferencia}
              >
                <Clipboard size={14} />
                Colar e baixar
                <Text
                  as="kbd"
                  fontSize="10px"
                  opacity={0.6}
                  display={{ base: 'none', md: 'inline' }}
                >
                  Ctrl+V
                </Text>
              </Button>
            )}
          </Flex>
        </Box>

        <HStack gap={2} flexWrap="wrap" px={0.5}>
          <Text fontSize="11px" color="fg.subtle" fontWeight="medium">
            Funciona com
          </Text>
          {PLATAFORMAS_SUPORTADAS_AUDIO.map((suportada) => (
            <Badge
              key={suportada.nome}
              size="xs"
              variant="subtle"
              colorPalette={suportada.paleta}
              borderRadius="md"
              px={2}
            >
              <suportada.icone size={11} />
              {suportada.nome}
            </Badge>
          ))}
        </HStack>
      </VStack>
    </Box>
  )
})
