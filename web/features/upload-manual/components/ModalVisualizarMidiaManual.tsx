import type { MediaItem } from '@/features/downloads-video/types'
import { obterUrlStreamMediaItem } from '@/features/downloads-video/api'
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  NativeSelect,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertTriangle,
  Calendar,
  CloudUpload,
  Download,
  FileImage,
  FileVideo,
  FolderPlus,
  HardDrive,
  Hash,
  X,
} from 'lucide-react'
import { memo } from 'react'
import {
  extrairHashCurto,
  extrairNomeExibicao,
  formatarTamanhoBytes,
  identificarTipoMidia,
} from '../utils/arquivosUpload'
import { formatarDataMidia, formatarHorarioMidia } from '@/features/downloads-video/utils/formatadores'

export interface ModalVisualizarMidiaManualProps {
  item: MediaItem | null
  aberto: boolean
  onFechar: () => void
  categorias: Array<{ uuid: string; nome: string }>
  onClassificar: (uuid: string, categoriaId: string) => void
  onForcarGoogleFotos?: (item: MediaItem) => void
}

export const ModalVisualizarMidiaManual = memo(function ModalVisualizarMidiaManual({
  item,
  aberto,
  onFechar,
  categorias,
  onClassificar,
  onForcarGoogleFotos,
}: ModalVisualizarMidiaManualProps) {
  if (!item) return null

  const tipoInfo = identificarTipoMidia(item)
  const nomeExibicao = extrairNomeExibicao(item)
  const hashCurto = extrairHashCurto(item.hash)
  const streamUrl = obterUrlStreamMediaItem(item.uuid)
  const dataFormatada = formatarDataMidia(item.metadata?.data, item.criadoEm)
  const horarioFormatado = formatarHorarioMidia(item)
  const ehDuplicado = Boolean(item.isDuplicado || item.metadata?.duplicado)

  return (
    <Dialog.Root open={aberto} onOpenChange={(e) => !e.open && onFechar()} size="xl" placement="center">
      <Portal>
        <Dialog.Backdrop bg="cirqueira.grey.950/80" backdropFilter="blur(8px)" />
        <Dialog.Positioner>
        <Dialog.Content
          borderRadius="2xl"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          shadow="2xl"
          overflow="hidden"
          maxW="4xl"
          w="95vw"
        >
          <Flex
            px={5}
            py={4}
            align="center"
            justify="space-between"
            borderBottomWidth="1px"
            borderColor="border.subtle"
          >
            <HStack gap={3} minW={0} flex={1}>
              <Box
                p={2}
                borderRadius="lg"
                bg={tipoInfo.isVideo ? 'cirqueira.purple.500/15' : 'cirqueira.brand.500/15'}
                color={tipoInfo.isVideo ? 'cirqueira.purple.400' : 'cirqueira.brand.400'}
                flexShrink={0}
              >
                {tipoInfo.isVideo ? <FileVideo size={18} /> : <FileImage size={18} />}
              </Box>
              <VStack align="start" gap={0} minW={0} flex={1}>
                <Dialog.Title fontSize="sm" fontWeight="bold" color="fg" truncate w="full">
                  {nomeExibicao}
                </Dialog.Title>
                <HStack gap={2} fontSize="11px" color="fg.subtle">
                  <Text as="span">{tipoInfo.label}</Text>
                  <Text as="span">•</Text>
                  <Text as="span">{formatarTamanhoBytes(item.tamanhoBytes ?? 0)}</Text>
                  <Text as="span">•</Text>
                  <Text as="span">Hash: {hashCurto}</Text>
                </HStack>
              </VStack>
            </HStack>

            <IconButton
              size="xs"
              variant="ghost"
              onClick={onFechar}
              aria-label="Fechar"
              borderRadius="lg"
            >
              <X size={16} />
            </IconButton>
          </Flex>

          <Dialog.Body p={0} bg="bg.canvas">
            <Box
              w="full"
              maxH="65vh"
              minH="320px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
              position="relative"
            >
              {tipoInfo.isVideo ? (
                <video
                  src={streamUrl}
                  controls
                  autoPlay
                  style={{
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    objectFit: 'contain',
                    backgroundColor: '#000',
                  }}
                />
              ) : (
                <img
                  src={streamUrl}
                  alt={nomeExibicao}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    objectFit: 'contain',
                  }}
                />
              )}
            </Box>
          </Dialog.Body>

          <Flex
            px={5}
            py={4}
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'stretch', sm: 'center' }}
            justify="space-between"
            gap={3}
            borderTopWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
          >
            <HStack gap={3} flexWrap="wrap" flex={1}>
              <HStack gap={1.5} fontSize="xs" color="fg.subtle">
                <Calendar size={13} />
                <Text as="span">{dataFormatada} às {horarioFormatado}</Text>
              </HStack>

              {ehDuplicado && (
                <Badge variant="subtle" colorPalette="amber" size="sm" borderRadius="md">
                  <HStack gap={1}>
                    <AlertTriangle size={11} />
                    <Text as="span">Duplicado</Text>
                  </HStack>
                </Badge>
              )}

              <HStack gap={2} align="center">
                <Text as="span" fontSize="xs" color="fg.subtle" fontWeight="medium">
                  Categoria:
                </Text>
                <NativeSelect.Root size="sm" w="44">
                  <NativeSelect.Field
                    value={item.categoriaId ?? ''}
                    onChange={(e) => onClassificar(item.uuid, e.target.value)}
                    bg="bg.muted"
                    borderColor="border.subtle"
                    borderRadius="lg"
                    fontSize="xs"
                    h={7}
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
            </HStack>

            <HStack gap={2} justify={{ base: 'flex-end', sm: 'flex-start' }}>
              {ehDuplicado && onForcarGoogleFotos && (
                <Button
                  size="sm"
                  variant="subtle"
                  colorPalette="amber"
                  onClick={() => {
                    onForcarGoogleFotos(item)
                    onFechar()
                  }}
                  borderRadius="lg"
                  fontSize="xs"
                >
                  <CloudUpload size={14} style={{ marginRight: '5px' }} />
                  <Text as="span">Forçar Google Fotos</Text>
                </Button>
              )}

              <Button
                as="a"
                href={streamUrl}
                download={nomeExibicao}
                size="sm"
                variant="outline"
                borderRadius="lg"
                fontSize="xs"
              >
                <Download size={14} style={{ marginRight: '5px' }} />
                <Text as="span">Baixar Arquivo</Text>
              </Button>
            </HStack>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
)
})
