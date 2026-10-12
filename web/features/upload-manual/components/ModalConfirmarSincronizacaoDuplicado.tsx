import type { MediaItem } from '@/features/downloads-video/types'
import {
  Badge,
  Box,
  Button,
  Dialog,
  HStack,
  NativeSelect,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  FileImage,
  FileVideo,
  FolderPlus,
  Loader2,
  X,
} from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { formatarTamanhoBytes } from '../utils/arquivosUpload'

export interface ItemDuplicadoConfirmacao {
  nome: string
  tamanhoBytes?: number
  tipoMime?: string
  previewUrl?: string | null
  mediaItem: MediaItem
}

export interface ModalConfirmarSincronizacaoDuplicadoProps {
  item: ItemDuplicadoConfirmacao | null
  aberto: boolean
  categorias: Array<{ uuid: string; nome: string }>
  carregando: boolean
  onFechar: () => void
  onConfirmar: (categoriaId?: string) => Promise<void>
}

export const ModalConfirmarSincronizacaoDuplicado = memo(
  function ModalConfirmarSincronizacaoDuplicado({
    item,
    aberto,
    categorias,
    carregando,
    onFechar,
    onConfirmar,
  }: ModalConfirmarSincronizacaoDuplicadoProps) {
    const [categoriaEscolhida, setCategoriaEscolhida] = useState<string>('')

    useEffect(() => {
      if (item?.mediaItem) {
        setCategoriaEscolhida(
          item.mediaItem.categoriaId ||
            (typeof item.mediaItem.categoria === 'object' ? item.mediaItem.categoria?.uuid : '') ||
            ''
        )
      } else {
        setCategoriaEscolhida('')
      }
    }, [item])

    if (!item) return null

    const media = item.mediaItem
    const isVideo =
      item.tipoMime?.startsWith('video/') ||
      item.nome.endsWith('.mp4') ||
      item.nome.endsWith('.mkv') ||
      item.nome.endsWith('.webm')
    const jaTemGoogleFotos = Boolean(media.googlePhotosMediaId || media.isEnviadoGoogleFotos)
    const tamanhoFormatado = item.tamanhoBytes
      ? formatarTamanhoBytes(item.tamanhoBytes)
      : media.tamanhoBytes
        ? formatarTamanhoBytes(media.tamanhoBytes)
        : null

    const handleConfirmar = async () => {
      await onConfirmar(categoriaEscolhida || undefined)
    }

    return (
      <Dialog.Root open={aberto} onOpenChange={(e) => !e.open && !carregando && onFechar()}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="2xl"
            maxW="lg"
            w="full"
            p={0}
            overflow="hidden"
            shadow="2xl"
          >
            {/* Header */}
            <Dialog.Header
              p={5}
              borderBottomWidth="1px"
              borderColor="border.subtle"
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              bg="amber.500/5"
            >
              <HStack gap={3}>
                <Box
                  p={2.5}
                  borderRadius="xl"
                  bg="amber.500/15"
                  color="amber.500"
                  display="inline-flex"
                >
                  <AlertTriangle size={22} />
                </Box>
                <VStack gap={0.5} align="flex-start">
                  <Dialog.Title fontSize="md" fontWeight="bold" color="fg">
                    Mídia Duplicada Identificada
                  </Dialog.Title>
                  <Text fontSize="xs" color="fg.subtle">
                    Arquivo já registrado na base de dados do sistema
                  </Text>
                </VStack>
              </HStack>

              <Button
                size="xs"
                variant="ghost"
                onClick={onFechar}
                disabled={carregando}
                aria-label="Fechar modal"
                p={1.5}
                borderRadius="lg"
              >
                <X size={16} />
              </Button>
            </Dialog.Header>

            {/* Body */}
            <Dialog.Body p={5} spaceY={4}>
              {/* Box de Informação */}
              <Box
                p={3.5}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="amber.500/30"
                bg="amber.500/10"
              >
                <Text fontSize="xs" color="fg" lineHeight="tall">
                  O arquivo{' '}
                  <Text as="span" fontWeight="bold" color="fg">
                    {item.nome}
                  </Text>{' '}
                  possui assinatura e metadados de conteúdo idênticos a um item já processado no
                  CirqueiraX.
                </Text>
              </Box>

              {/* Detalhes do Arquivo */}
              <Box
                p={4}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.muted"
              >
                <HStack gap={3} align="flex-start">
                  <Box
                    w={14}
                    h={14}
                    borderRadius="lg"
                    bg="bg.subtle"
                    borderWidth="1px"
                    borderColor="border.subtle"
                    overflow="hidden"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    {item.previewUrl || media.thumbnailUrl ? (
                      <img
                        src={item.previewUrl || media.thumbnailUrl || ''}
                        alt={item.nome}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : isVideo ? (
                      <FileVideo size={24} color="var(--chakra-colors-fg-subtle)" />
                    ) : (
                      <FileImage size={24} color="var(--chakra-colors-fg-subtle)" />
                    )}
                  </Box>

                  <VStack align="flex-start" gap={1} flex={1} minW={0}>
                    <Text fontWeight="semibold" fontSize="xs" color="fg" truncate w="full">
                      {item.nome}
                    </Text>

                    <HStack gap={2} fontSize="11px" color="fg.subtle">
                      {tamanhoFormatado && <Text as="span">{tamanhoFormatado}</Text>}
                      {tamanhoFormatado && <Text as="span">•</Text>}
                      <Text as="span" fontFamily="mono">
                        {media.hash ? media.hash.slice(0, 10) : ''}...
                      </Text>
                    </HStack>

                    <HStack mt={1} gap={2} wrap="wrap">
                      {jaTemGoogleFotos ? (
                        <Badge
                          size="xs"
                          variant="subtle"
                          colorPalette="green"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          <HStack gap={1} alignItems="center">
                            <CheckCircle2 size={12} />
                            <Text as="span">Já enviado ao Google Fotos</Text>
                          </HStack>
                        </Badge>
                      ) : (
                        <Badge
                          size="xs"
                          variant="subtle"
                          colorPalette="gray"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          Sem upload no Google Fotos
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
              </Box>

              {/* Seleção de Categoria para Álbum */}
              <VStack align="flex-start" gap={1.5} w="full">
                <HStack gap={1.5} color="fg">
                  <FolderPlus size={14} />
                  <Text fontSize="xs" fontWeight="semibold">
                    Categoria & Álbum do Google Fotos:
                  </Text>
                </HStack>

                <NativeSelect.Root size="sm" w="full" disabled={carregando}>
                  <NativeSelect.Field
                    value={categoriaEscolhida}
                    onChange={(e) => setCategoriaEscolhida(e.target.value)}
                    bg="bg.muted"
                    borderColor="border.subtle"
                    borderRadius="xl"
                    fontSize="xs"
                    h={9}
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categorias.map((cat) => (
                      <option key={cat.uuid} value={cat.uuid}>
                        {cat.nome}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Text fontSize="11px" color="fg.subtle">
                  A mídia será enviada para o álbum do Google Fotos associado a esta categoria.
                </Text>
              </VStack>

              {/* Pergunta Destacada */}
              <Box
                p={3.5}
                borderRadius="xl"
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border.subtle"
              >
                <Text fontSize="xs" fontWeight="medium" color="fg" textAlign="center">
                  Deseja realizar a sincronização com o Google Fotos mesmo assim?
                </Text>
              </Box>
            </Dialog.Body>

            {/* Footer */}
            <Dialog.Footer
              p={4}
              px={5}
              borderTopWidth="1px"
              borderColor="border.subtle"
              bg="bg.muted"
              display="flex"
              justifyContent="flex-end"
              gap={3}
            >
              <Button
                size="sm"
                variant="outline"
                onClick={onFechar}
                disabled={carregando}
                borderRadius="xl"
                fontSize="xs"
              >
                Não Sincronizar
              </Button>

              <Button
                size="sm"
                colorPalette="brand"
                onClick={handleConfirmar}
                disabled={carregando}
                borderRadius="xl"
                fontWeight="semibold"
                fontSize="xs"
              >
                {carregando ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                    />
                    <Text as="span">Sincronizando...</Text>
                  </>
                ) : (
                  <>
                    <CloudUpload size={14} style={{ marginRight: '6px' }} />
                    <Text as="span">Sim, Sincronizar Mesmo Assim</Text>
                  </>
                )}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    )
  }
)
