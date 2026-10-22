import { extrairUrlsTexto } from '@/features/downloads-video/utils/extrairUrls'
import { Box, Button, HStack, Icon, Input, Text, VStack } from '@chakra-ui/react'
import { Link2, Music } from 'lucide-react'
import { type ClipboardEvent, type FormEvent, memo, useMemo, useState } from 'react'

export interface CampoLinkAudioProps {
  enviando: boolean
  onSolicitar: (urls: string[]) => void
}

export const CampoLinkAudio = memo(function CampoLinkAudio({
  enviando,
  onSolicitar,
}: CampoLinkAudioProps) {
  const [texto, setTexto] = useState('')
  const urlsDetectadas = useMemo(() => extrairUrlsTexto(texto), [texto])

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

  return (
    <VStack align="stretch" gap={2}>
      <Box
        as="form"
        onSubmit={aoEnviar}
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        p={1.5}
        pl={4}
        transition="border-color 0.15s ease"
        _focusWithin={{ borderColor: 'cirqueira.brand.500' }}
      >
        <HStack gap={3}>
          <Icon as={Link2} boxSize={4} color="fg.subtle" flexShrink={0} />
          <Input
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onPaste={aoColar}
            placeholder="Cole o link do YouTube, TikTok, Instagram ou X"
            aria-label="Link do áudio"
            variant="flushed"
            borderBottom="none"
            fontSize="sm"
            h={10}
            _focus={{ borderBottom: 'none', boxShadow: 'none' }}
          />
          <Button
            type="submit"
            colorPalette="brand"
            borderRadius="lg"
            size="sm"
            h={9}
            px={4}
            flexShrink={0}
            loading={enviando}
            disabled={urlsDetectadas.length === 0}
          >
            <Music size={15} />
            {urlsDetectadas.length > 1 ? `Baixar ${urlsDetectadas.length} MP3` : 'Baixar MP3'}
          </Button>
        </HStack>
      </Box>
      <Text fontSize="xs" color="fg.subtle" px={1}>
        Cole vários links de uma vez ou use Ctrl + V em qualquer lugar da página. Os arquivos ficam
        disponíveis por 7 dias.
      </Text>
    </VStack>
  )
})
