import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Portal,
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
  Image as ImageIcon,
  Loader2,
  User,
  Video,
  X,
} from 'lucide-react'
import { memo, useState } from 'react'
import { baixarArquivoMidia, obterUrlStreamMediaItem } from '../api'
import type { MediaItem } from '../types'
import {
  extrairExtensaoMedia,
  extrairTituloMedia,
  formatarDuracao,
  formatarTamanhoBytes,
  verificarSeEhImagem,
} from '../utils/formatadores'

export interface ModalVisualizarMidiaProps {
  item: MediaItem | null
  aberto: boolean
  onFechar: () => void
  onCategorizar?: (item: MediaItem) => void
  onEditarMetadata?: (item: MediaItem) => void
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

  const ehImagem = verificarSeEhImagem(item)
  const titulo = extrairTituloMedia(item)
  const extensao = extrairExtensaoMedia(item)
  const uploader =
    item.metadata?.uploader ||
    (ehImagem ? (item.metadata?.agente_nome as string) || 'Dispositivo Pessoal' : 'Desconhecido')
  const streamUrl = obterUrlStreamMediaItem(item.uuid)
  const tamanhoBytes = (item.metadata?.tamanho_bytes as number) || undefined
  const duracao = (item.metadata?.duracao as number) || undefined
  const urlOriginal = item.metadata?.url_original
  const urlThumbnail = item.thumbnailUrl || (item.metadata?.thumbnail as string)

  const handleBaixar = async () => {
    try {
      setBaixando(true)
      await baixarArquivoMidia(item.uuid, titulo, extensao)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={aberto} onOpenChange={(e) => !e.open && onFechar()} size="xl" placement="center">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.75)" />
        <Dialog.Positioner>
        <Dialog.Content
          borderRadius="xl"
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
                borderRadius="lg"
                bg="cirqueira.brand.500/10"
                color="cirqueira.brand.400"
                borderWidth="1px"
                borderColor="cirqueira.brand.500/20"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
              >
                {ehImagem ? <ImageIcon size={18} /> : <Film size={18} />}
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

            <IconButton
              size="sm"
              variant="ghost"
              onClick={onFechar}
              aria-label="Fechar modal"
              borderRadius="lg"
            >
              <X size={18} />
            </IconButton>
          </Flex>

          <Box
            position="relative"
            bg="black"
            aspectRatio={{ base: '4/3', md: '16/9' }}
            w="full"
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={ehImagem ? 2 : 0}
          >
            {erroStream ? (
              <VStack gap={3} p={6} textAlign="center" color="fg.subtle">
                {ehImagem ? (
                  <ImageIcon size={48} strokeWidth={1.5} />
                ) : (
                  <Video size={48} strokeWidth={1.5} />
                )}
                <Text fontSize="sm">
                  {ehImagem
                    ? 'Não foi possível carregar esta imagem diretamente no navegador.'
                    : 'Não foi possível reproduzir este vídeo diretamente no navegador.'}
                </Text>
                <Button size="sm" colorPalette="brand" onClick={handleBaixar} borderRadius="lg">
                  <Download size={14} />
                  <Text as="span">Baixar Arquivo ({extensao.toUpperCase()})</Text>
                </Button>
              </VStack>
            ) : ehImagem ? (
              <img
                key={streamUrl}
                src={streamUrl}
                alt={titulo}
                onError={() => setErroStream(true)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '6px',
                }}
              />
            ) : (
              <video
                key={streamUrl}
                src={streamUrl}
                poster={urlThumbnail}
                controls
                autoPlay
                playsInline
                onError={() => setErroStream(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxHeight: '65vh',
                }}
              >
                <track kind="captions" />
              </video>
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
                      <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                        <Clock size={14} color="currentColor" />
                      </Box>
                      <Text as="span">{formatarDuracao(duracao)}</Text>
                    </HStack>
                  )}

                  {tamanhoBytes && (
                    <HStack gap={1.5}>
                      <Box as="span" color="cirqueira.blue.400" display="inline-flex">
                        <HardDrive size={14} color="currentColor" />
                      </Box>
                      <Text as="span">{formatarTamanhoBytes(tamanhoBytes)}</Text>
                    </HStack>
                  )}

                  <HStack gap={1.5}>
                    <Box as="span" color="cirqueira.green.400" display="inline-flex">
                      <User size={14} color="currentColor" />
                    </Box>
                    <Text as="span">{uploader}</Text>
                  </HStack>

                  {item.categoria?.nome && (
                    <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="md">
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
                    borderRadius="lg"
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
                    borderRadius="lg"
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
                    borderRadius="lg"
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
                  borderRadius="lg"
                >
                  {baixando ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      <Text as="span">Baixando...</Text>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <Text as="span">
                        {ehImagem
                          ? `Baixar Imagem (${extensao.toUpperCase()})`
                          : `Baixar Vídeo (${extensao.toUpperCase()})`}
                      </Text>
                    </>
                  )}
                </Button>
              </HStack>
            </Flex>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
)
})
