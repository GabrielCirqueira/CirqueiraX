import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Film,
  FolderPlus,
  HardDrive,
  Loader2,
  User,
  Video,
  X,
} from 'lucide-react'
import { memo, useState } from 'react'
import { baixarArquivoMidia, obterUrlStreamMediaItem } from '../api'
import type { MediaItem } from '../types'

export interface ModalVisualizarMidiaProps {
  item: MediaItem | null
  aberto: boolean
  onFechar: () => void
  onCategorizar?: (item: MediaItem) => void
  onEditarMetadata?: (item: MediaItem) => void
}

function formatarTamanhoBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Tamanho desconhecido'
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${unidades[i]}`
}

function formatarDuracao(segundos?: number): string {
  if (!segundos || segundos <= 0) return '0:00'
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = Math.floor(segundos % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export const ModalVisualizarMidia = memo(function ModalVisualizarMidia({
  item,
  aberto,
  onFechar,
  onCategorizar,
  onEditarMetadata,
}: ModalVisualizarMidiaProps) {
  const [baixando, setBaixando] = useState(false)
  const [erroStream, setErroStream] = useState(false)

  if (!item) return null

  const titulo = item.metadata?.titulo || `Vídeo ${item.hash.slice(0, 10)}`
  const uploader = item.metadata?.uploader || 'Desconhecido'
  const streamUrl = obterUrlStreamMediaItem(item.uuid)
  const tamanhoBytes = (item.metadata?.tamanho_bytes as number) || undefined
  const duracao = (item.metadata?.duracao as number) || undefined
  const extensao = (item.metadata?.extensao as string) || 'mp4'
  const urlOriginal = item.metadata?.url_original
  const urlThumbnail = item.thumbnailUrl || (item.metadata?.thumbnail as string)

  const handleBaixar = async () => {
    try {
      setBaixando(true)
      await baixarArquivoMidia(item.uuid, titulo)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(e) => !e.open && onFechar()} size="xl">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          borderRadius="2xl"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          shadow="2xl"
          overflow="hidden"
          maxW="4xl"
          w="full"
        >
          <Flex
            align="center"
            justify="space-between"
            p={4}
            borderBottomWidth="1px"
            borderColor="border.subtle"
          >
            <HStack gap={2.5}>
              <Box
                p={2}
                borderRadius="xl"
                bg="brand.500/10"
                color="brand.400"
                borderWidth="1px"
                borderColor="brand.500/20"
              >
                <Film size={18} />
              </Box>
              <VStack align="start" gap={0.5}>
                <Dialog.Title fontSize="md" fontWeight="bold" color="fg" lineClamp={1}>
                  {titulo}
                </Dialog.Title>
                <Text fontSize="xs" color="fg.subtle">
                  {uploader} • {extensao.toUpperCase()}
                </Text>
              </VStack>
            </HStack>

            <IconButton size="sm" variant="ghost" onClick={onFechar} aria-label="Fechar modal">
              <X size={18} />
            </IconButton>
          </Flex>

          <Box
            position="relative"
            bg="black"
            aspectRatio="16/9"
            w="full"
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {erroStream ? (
              <VStack gap={3} p={6} textAlign="center" color="fg.subtle">
                <Video size={48} strokeWidth={1.5} />
                <Text fontSize="sm">
                  Não foi possível reproduzir este vídeo diretamente no navegador.
                </Text>
                <Button size="sm" colorPalette="brand" onClick={handleBaixar}>
                  <Download size={14} />
                  <Text as="span">Baixar Arquivo MP4</Text>
                </Button>
              </VStack>
            ) : (
              <Box
                as="video"
                key={streamUrl}
                src={streamUrl}
                poster={urlThumbnail}
                controls
                autoPlay
                playsInline
                onError={() => setErroStream(true)}
                w="full"
                h="full"
                objectFit="contain"
                maxH="65vh"
              >
                <Box as="track" kind="captions" />
              </Box>
            )}
          </Box>

          <Dialog.Body p={5}>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'stretch', md: 'center' }}
              gap={4}
            >
              <VStack align="start" gap={2} flex={1}>
                <HStack gap={3} flexWrap="wrap" fontSize="xs" color="fg.subtle">
                  {duracao && (
                    <HStack gap={1.5}>
                      <Clock size={14} color="#a78bfa" />
                      <Text as="span">{formatarDuracao(duracao)}</Text>
                    </HStack>
                  )}

                  {tamanhoBytes && (
                    <HStack gap={1.5}>
                      <HardDrive size={14} color="#38bdf8" />
                      <Text as="span">{formatarTamanhoBytes(tamanhoBytes)}</Text>
                    </HStack>
                  )}

                  <HStack gap={1.5}>
                    <User size={14} color="#4ade80" />
                    <Text as="span">{uploader}</Text>
                  </HStack>

                  {item.categoria?.nome && (
                    <Badge size="sm" variant="subtle" colorPalette="brand">
                      {item.categoria.nome}
                    </Badge>
                  )}
                </HStack>
              </VStack>

              <HStack gap={2} flexWrap="wrap">
                {urlOriginal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(urlOriginal, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink size={14} />
                    <Text as="span">Link Original</Text>
                  </Button>
                )}

                {onEditarMetadata && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onFechar()
                      onEditarMetadata(item)
                    }}
                  >
                    <Edit3 size={14} />
                    <Text as="span">Metadados</Text>
                  </Button>
                )}

                {onCategorizar && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onFechar()
                      onCategorizar(item)
                    }}
                  >
                    <FolderPlus size={14} />
                    <Text as="span">Categorizar</Text>
                  </Button>
                )}

                <Button
                  size="sm"
                  colorPalette="brand"
                  onClick={handleBaixar}
                  disabled={baixando}
                  fontWeight="semibold"
                >
                  {baixando ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      <Text as="span">Baixando...</Text>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <Text as="span">Baixar Vídeo MP4</Text>
                    </>
                  )}
                </Button>
              </HStack>
            </Flex>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
})
