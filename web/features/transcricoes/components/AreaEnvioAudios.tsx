import { Box, Button, Center, HStack, NativeSelect, Text, VStack } from '@chakra-ui/react'
import { FileAudio, Mic, UploadCloud } from 'lucide-react'
import { type ChangeEvent, type DragEvent, memo, useRef, useState } from 'react'
import type { EnvioAudio, IdiomaTranscricao } from '../types'
import { OPCOES_IDIOMA, TIPOS_ACEITOS, isIdiomaTranscricao } from '../utils'
import { ListaEnviosAudios } from './ListaEnviosAudios'

export interface AreaEnvioAudiosProps {
  idioma: IdiomaTranscricao
  envios: EnvioAudio[]
  onMudarIdioma: (idioma: IdiomaTranscricao) => void
  onEnviar: (arquivos: File[]) => void
  onLimparEnvios: () => void
}

export const AreaEnvioAudios = memo(function AreaEnvioAudios({
  idioma,
  envios,
  onMudarIdioma,
  onEnviar,
  onLimparEnvios,
}: AreaEnvioAudiosProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [arrastando, setArrastando] = useState(false)

  function aoArrastarSobre(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    setArrastando(true)
  }

  function aoSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    setArrastando(false)
    onEnviar(Array.from(evento.dataTransfer.files))
  }

  function aoEscolherArquivos(evento: ChangeEvent<HTMLInputElement>) {
    onEnviar(Array.from(evento.target.files ?? []))
    evento.target.value = ''
  }

  function aoMudarIdioma(evento: ChangeEvent<HTMLSelectElement>) {
    if (isIdiomaTranscricao(evento.target.value)) onMudarIdioma(evento.target.value)
  }

  return (
    <VStack
      align="stretch"
      gap={3}
      p={4}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="2xl"
    >
      <Box
        position="relative"
        overflow="hidden"
        onDragOver={aoArrastarSobre}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
        onClick={() => inputRef.current?.click()}
        cursor="pointer"
        px={4}
        py={{ base: 6, md: 8 }}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={arrastando ? 'cirqueira.brand.400' : 'border.emphasized'}
        bg={arrastando ? 'cirqueira.brand.500/10' : 'bg.subtle'}
        borderRadius="xl"
        textAlign="center"
        transition="all 0.2s ease"
        transform={arrastando ? 'scale(1.01)' : 'none'}
        _hover={{ borderColor: 'cirqueira.brand.500/60', bg: 'cirqueira.brand.500/5' }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={TIPOS_ACEITOS}
          style={{ display: 'none' }}
          onChange={aoEscolherArquivos}
        />
        <VStack gap={2.5}>
          <Center
            boxSize={14}
            borderRadius="full"
            bg="cirqueira.brand.500/15"
            color="cirqueira.brand.400"
            animation={arrastando ? 'bounce 1s infinite' : undefined}
          >
            {arrastando ? <FileAudio size={26} /> : <UploadCloud size={26} />}
          </Center>
          <Text fontSize="sm" fontWeight="bold" color="fg">
            {arrastando ? 'Solte para transcrever' : 'Arraste áudios aqui ou clique para escolher'}
          </Text>
          <Text fontSize="xs" color="fg.muted" maxW="320px">
            Vários de uma vez · MP3, M4A, WAV, OGG, OPUS (WhatsApp), FLAC e vídeos · até 500 MB cada
          </Text>
        </VStack>
      </Box>

      <HStack gap={2} justify="space-between" flexWrap="wrap">
        <HStack gap={1.5} color="fg.muted">
          <Mic size={14} />
          <Text fontSize="xs" fontWeight="medium">
            Idioma do áudio
          </Text>
        </HStack>
        <NativeSelect.Root size="sm" w={{ base: 'full', sm: '190px' }}>
          <NativeSelect.Field
            value={idioma}
            onChange={aoMudarIdioma}
            bg="bg.muted"
            borderColor="border.subtle"
            borderRadius="lg"
          >
            {OPCOES_IDIOMA.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.bandeira} {opcao.rotulo}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>

      {envios.length > 0 && <ListaEnviosAudios envios={envios} onLimpar={onLimparEnvios} />}

      {envios.length === 0 && (
        <Button
          size="sm"
          variant="subtle"
          colorPalette="brand"
          borderRadius="lg"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud size={14} />
          Escolher arquivos
        </Button>
      )}
    </VStack>
  )
})
