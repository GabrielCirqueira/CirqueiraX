import { addToast } from '@/shared/components/ui/toaster'
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  NativeSelect,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  FileImage,
  Film,
  FolderPlus,
  HardDrive,
  Hash,
  X,
} from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import {
  baixarArquivoMidia,
  copiarImagemParaClipboard,
  obterUrlStreamMidia,
  obterUrlThumbnailMidia,
} from '../api'
import type { CategoriaOpcao, MediaItem } from '../types'
import { formatarTamanhoBytes } from '@/features/upload-manual/utils/arquivosUpload'

export interface ModalVisualizarMidiaCentralProps {
  item: MediaItem | null
  aberto: boolean
  onFechar: () => void
  categorias: CategoriaOpcao[]
  onClassificar: (uuid: string, categoriaId: string) => void
}

const REGEX_VIDEO_EXT = /\.(mp4|mkv|webm|mov)$/i

export const ModalVisualizarMidiaCentral = memo(function ModalVisualizarMidiaCentral({
  item,
  aberto,
  onFechar,
  categorias,
  onClassificar,
}: ModalVisualizarMidiaCentralProps) {
  const [copiando, setCopiando] = useState(false)
  const [copiadoRecente, setCopiadoRecente] = useState(false)
  const [baixando, setBaixando] = useState(false)

  const isVideo = useMemo(() => {
    if (!item) return false
    return Boolean(
      item.metadata?.duracao ||
        item.caminhoLocal?.match(REGEX_VIDEO_EXT) ||
        item.origem === 'download' ||
        (item.origem as string) === 'bot_telegram'
    )
  }, [item])

  const titulo = useMemo(() => {
    if (!item) return ''
    if (typeof item.metadata?.nome_original === 'string' && item.metadata.nome_original) {
      return item.metadata.nome_original
    }
    if (typeof item.metadata?.titulo === 'string' && item.metadata.titulo) {
      return item.metadata.titulo
    }
    if (item.caminhoLocal) {
      const partes = item.caminhoLocal.split('/')
      const ultimo = partes[partes.length - 1]
      if (ultimo) return ultimo
    }
    return `Mídia ${item.hash.slice(0, 8)}`
  }, [item])

  const infoOrigem = useMemo(() => {
    if (!item) return { label: 'Mídia', colorPalette: 'gray' }
    switch (item.origem) {
      case 'manual':
        return { label: 'Upload Manual', colorPalette: 'blue' }
      case 'download':
      case 'bot_telegram' as string:
        return { label: 'Download Vídeo', colorPalette: 'purple' }
      case 'print_empresa':
        return { label: 'Print Empresa', colorPalette: 'green' }
      case 'print_pessoal':
        return { label: 'Print Pessoal', colorPalette: 'teal' }
      default:
        return { label: item.origemDescricao || 'Mídia', colorPalette: 'gray' }
    }
  }, [item])

  if (!item) return null

  const streamUrl = obterUrlStreamMidia(item.uuid)
  const thumbUrl = item.thumbnailUrl || obterUrlThumbnailMidia(item.uuid)

  const dataFormatada = item.criadoEm
    ? new Date(item.criadoEm).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—'

  const horarioFormatado = item.criadoEm
    ? new Date(item.criadoEm).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const handleCopiar = async () => {
    if (isVideo) return
    setCopiando(true)
    const copiado = await copiarImagemParaClipboard(item.uuid)
    setCopiando(false)
    if (copiado) {
      setCopiadoRecente(true)
      setTimeout(() => setCopiadoRecente(false), 2000)
      addToast({ title: 'Mídia copiada para a área de transferência!', color: 'success' })
    } else {
      addToast({ title: 'Não foi possível copiar imagem diretamente.', color: 'warning' })
    }
  }

  const handleBaixar = async () => {
    setBaixando(true)
    try {
      await baixarArquivoMidia(item.uuid, titulo, isVideo)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(e) => !e.open && onFechar()} size="xl">
      <Dialog.Backdrop bg="cirqueira.grey.950/85" backdropFilter="blur(6px)" />
      <Dialog.Positioner>
        <Dialog.Content
          borderRadius="2xl"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          maxW="1100px"
          overflow="hidden"
        >
          {/* Cabeçalho */}
          <Dialog.Header p={4} pb={3} borderBottomWidth="1px" borderColor="border.subtle">
            <Flex justify="space-between" align="center" w="full" gap={3}>
              <HStack gap={2.5} minW={0} flex={1}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg={isVideo ? 'cirqueira.purple.500/15' : 'cirqueira.brand.500/15'}
                  color={isVideo ? 'cirqueira.purple.400' : 'cirqueira.brand.400'}
                  display="inline-flex"
                >
                  {isVideo ? <Film size={18} /> : <FileImage size={18} />}
                </Box>
                <VStack align="start" gap={0} minW={0} flex={1}>
                  <Dialog.Title fontSize="sm" fontWeight="bold" color="fg" truncate w="full">
                    {titulo}
                  </Dialog.Title>
                  <HStack gap={1.5} fontSize="11px" color="fg.subtle">
                    <Badge size="xs" variant="subtle" colorPalette={infoOrigem.colorPalette} borderRadius="sm">
                      {infoOrigem.label}
                    </Badge>
                    <Text as="span">•</Text>
                    <Text as="span" fontFamily="mono">
                      {item.hash.slice(0, 12)}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>

              <IconButton
                size="sm"
                variant="ghost"
                onClick={onFechar}
                aria-label="Fechar modal"
                borderRadius="lg"
              >
                <X size={16} />
              </IconButton>
            </Flex>
          </Dialog.Header>

          {/* Corpo com Mídia + Painel Lateral */}
          <Dialog.Body p={0}>
            <Flex direction={{ base: 'column', lg: 'row' }} minH="480px" maxH="80vh">
              {/* Visualizador de Mídia */}
              <Box
                flex={1}
                bg="cirqueira.grey.950"
                display="flex"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
                p={2}
                position="relative"
              >
                {isVideo ? (
                  <video
                    src={streamUrl}
                    poster={thumbUrl}
                    controls
                    autoPlay
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <img
                    src={streamUrl}
                    alt={titulo}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                      borderRadius: '8px',
                    }}
                  />
                )}
              </Box>

              {/* Painel de Metadados e Ações */}
              <Box
                w={{ base: 'full', lg: '340px' }}
                p={5}
                borderLeftWidth={{ base: '0px', lg: '1px' }}
                borderTopWidth={{ base: '1px', lg: '0px' }}
                borderColor="border.subtle"
                bg="bg.muted/30"
                overflowY="auto"
              >
                <VStack align="stretch" gap={4}>
                  {/* Seletor de Categoria Inline */}
                  <VStack align="start" gap={1.5}>
                    <Text fontSize="xs" fontWeight="bold" color="fg.subtle">
                      Categoria Atribuída
                    </Text>
                    <HStack w="full" gap={2}>
                      <Box color="cirqueira.brand.400" display="inline-flex">
                        <FolderPlus size={16} />
                      </Box>
                      <NativeSelect.Root size="sm" w="full">
                        <NativeSelect.Field
                          value={item.categoriaId ?? ''}
                          onChange={(e) => onClassificar(item.uuid, e.target.value)}
                          bg="bg.panel"
                          borderColor="border.subtle"
                          borderRadius="lg"
                          fontSize="xs"
                          h={8}
                        >
                          <option value="">Sem Categoria</option>
                          {categorias.map((cat) => (
                            <option key={cat.uuid} value={cat.uuid}>
                              {cat.nome}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </HStack>
                  </VStack>

                  {/* Detalhes da Mídia */}
                  <VStack align="start" gap={2.5} pt={2} borderTopWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" fontWeight="bold" color="fg.subtle">
                      Informações
                    </Text>

                    <HStack justify="space-between" w="full" fontSize="xs">
                      <HStack gap={1.5} color="fg.subtle">
                        <Calendar size={13} />
                        <Text as="span">Criado em</Text>
                      </HStack>
                      <Text fontWeight="medium" color="fg">
                        {dataFormatada} {horarioFormatado}
                      </Text>
                    </HStack>

                    <HStack justify="space-between" w="full" fontSize="xs">
                      <HStack gap={1.5} color="fg.subtle">
                        <HardDrive size={13} />
                        <Text as="span">Tamanho</Text>
                      </HStack>
                      <Text fontWeight="medium" color="fg">
                        {formatarTamanhoBytes(Number(item.tamanhoBytes ?? 0))}
                      </Text>
                    </HStack>

                    {item.metadata?.duracao && (
                      <HStack justify="space-between" w="full" fontSize="xs">
                        <HStack gap={1.5} color="fg.subtle">
                          <Clock size={13} />
                          <Text as="span">Duração</Text>
                        </HStack>
                        <Text fontWeight="medium" color="fg">
                          {Math.round(Number(item.metadata.duracao))} segundos
                        </Text>
                      </HStack>
                    )}

                    <HStack justify="space-between" w="full" fontSize="xs">
                      <HStack gap={1.5} color="fg.subtle">
                        <Hash size={13} />
                        <Text as="span">Hash SHA-256</Text>
                      </HStack>
                      <Text fontFamily="mono" fontSize="10px" color="fg">
                        {item.hash.slice(0, 16)}...
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Botões de Ação */}
                  <VStack align="stretch" gap={2} pt={3} borderTopWidth="1px" borderColor="border.subtle">
                    {!isVideo && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopiar}
                        disabled={copiando}
                        borderRadius="xl"
                        w="full"
                        fontWeight="semibold"
                      >
                        {copiadoRecente ? (
                          <>
                            <Check size={14} style={{ marginRight: '6px' }} />
                            <Text as="span">Copiado!</Text>
                          </>
                        ) : (
                          <>
                            <Copy size={14} style={{ marginRight: '6px' }} />
                            <Text as="span">Copiar para Clipboard</Text>
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      colorPalette="brand"
                      onClick={handleBaixar}
                      disabled={baixando}
                      borderRadius="xl"
                      w="full"
                      fontWeight="bold"
                    >
                      <Download size={14} style={{ marginRight: '6px' }} />
                      <Text as="span">Baixar Arquivo</Text>
                    </Button>
                  </VStack>
                </VStack>
              </Box>
            </Flex>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
})
