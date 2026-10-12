import { addToast } from '@/shared/components/ui/toaster'
import { Badge, Box, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  Calendar,
  CheckSquare,
  Copy,
  Download,
  Eye,
  FileImage,
  Film,
  Folder,
  FolderPlus,
  HardDrive,
  Square,
  Trash2,
} from 'lucide-react'
import { memo, useState } from 'react'
import {
  baixarArquivoMidia,
  copiarImagemParaClipboard,
  obterUrlStreamMidia,
  obterUrlThumbnailMidia,
} from '../api'
import type { MediaItem } from '../types'
import { formatarTamanhoBytes } from '@/features/upload-manual/utils/arquivosUpload'

export interface TabelaCentralMidiasProps {
  itens: MediaItem[]
  carregando?: boolean
  selecionados: string[]
  onToggleSelect: (uuid: string) => void
  onToggleSelectAll?: () => void
  onVisualizar: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onApagar?: (uuid: string) => void
}

const REGEX_VIDEO_EXT = /\.(mp4|mkv|webm|mov)$/i

export const TabelaCentralMidias = memo(function TabelaCentralMidias({
  itens,
  carregando = false,
  selecionados,
  onToggleSelect,
  onToggleSelectAll,
  onVisualizar,
  onCategorizar,
  onApagar,
}: TabelaCentralMidiasProps) {
  const [baixandoUuid, setBaixandoUuid] = useState<string | null>(null)

  const todosSelecionados = itens.length > 0 && itens.every((it) => selecionados.includes(it.uuid))

  const handleDownload = async (
    uuid: string,
    titulo: string,
    isVideo: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    try {
      setBaixandoUuid(uuid)
      await baixarArquivoMidia(uuid, titulo, isVideo)
    } finally {
      setBaixandoUuid(null)
    }
  }

  const handleCopiar = async (uuid: string, isVideo: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isVideo) return
    const copiado = await copiarImagemParaClipboard(uuid)
    if (copiado) {
      addToast({ title: 'Mídia copiada para a área de transferência!', color: 'success' })
    } else {
      addToast({ title: 'Não foi possível copiar mídia diretamente.', color: 'warning' })
    }
  }

  if (carregando && itens.length === 0) {
    return (
      <VStack w="full" gap={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={`sk-row-${i + 1}`}
            w="full"
            h={16}
            bg="bg.muted"
            borderRadius="xl"
            animation="pulse 1.5s infinite"
          />
        ))}
      </VStack>
    )
  }

  return (
    <Box
      w="full"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      overflowX="auto"
    >
      <Box as="table" w="full" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
        <Box as="thead" bg="bg.muted" borderBottomWidth="1px" borderColor="border.subtle">
          <Box as="tr">
            <Box as="th" p={3} pl={4} w="40px">
              {onToggleSelectAll && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  onClick={onToggleSelectAll}
                  aria-label="Selecionar todas as mídias"
                  color={todosSelecionados ? 'cirqueira.brand.400' : 'fg.subtle'}
                  p={0}
                  h={6}
                  w={6}
                >
                  {todosSelecionados ? <CheckSquare size={16} /> : <Square size={16} />}
                </IconButton>
              )}
            </Box>
            <Box as="th" p={3} fontSize="xs" fontWeight="bold" color="fg.subtle">
              Mídia
            </Box>
            <Box as="th" p={3} fontSize="xs" fontWeight="bold" color="fg.subtle">
              Origem
            </Box>
            <Box as="th" p={3} fontSize="xs" fontWeight="bold" color="fg.subtle">
              Categoria
            </Box>
            <Box as="th" p={3} fontSize="xs" fontWeight="bold" color="fg.subtle">
              Tamanho
            </Box>
            <Box as="th" p={3} fontSize="xs" fontWeight="bold" color="fg.subtle">
              Data
            </Box>
            <Box as="th" p={3} pr={4} textAlign="right" fontSize="xs" fontWeight="bold" color="fg.subtle">
              Ações
            </Box>
          </Box>
        </Box>

        <Box as="tbody">
          {itens.map((item) => {
            const isItemSelecionado = selecionados.includes(item.uuid)

            const isVideo = Boolean(
              item.metadata?.duracao ||
                item.caminhoLocal?.match(REGEX_VIDEO_EXT) ||
                item.origem === 'download' ||
                (item.origem as string) === 'bot_telegram'
            )

            const titulo =
              typeof item.metadata?.nome_original === 'string' && item.metadata.nome_original
                ? item.metadata.nome_original
                : typeof item.metadata?.titulo === 'string' && item.metadata.titulo
                  ? item.metadata.titulo
                  : `Mídia ${item.hash.slice(0, 8)}`

            const origemInfo = (() => {
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
            })()

            const dataFormatada = item.criadoEm
              ? new Date(item.criadoEm).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'

            const streamUrl = obterUrlStreamMidia(item.uuid)
            const thumbUrl = item.thumbnailUrl || obterUrlThumbnailMidia(item.uuid)

            return (
              <Box
                as="tr"
                key={item.uuid}
                borderBottomWidth="1px"
                borderColor="border.subtle"
                bg={isItemSelecionado ? 'cirqueira.brand.500/8' : 'transparent'}
                _hover={{ bg: isItemSelecionado ? 'cirqueira.brand.500/12' : 'bg.muted' }}
                cursor="pointer"
                onClick={() => onVisualizar(item)}
                transition="background 0.15s ease"
              >
                {/* Checkbox */}
                <Box
                  as="td"
                  p={3}
                  pl={4}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelect(item.uuid)
                  }}
                >
                  <IconButton
                    size="xs"
                    variant="ghost"
                    aria-label="Selecionar linha"
                    color={isItemSelecionado ? 'cirqueira.brand.400' : 'fg.subtle'}
                    p={0}
                    h={6}
                    w={6}
                  >
                    {isItemSelecionado ? <CheckSquare size={16} /> : <Square size={16} />}
                  </IconButton>
                </Box>

                {/* Miniatura e Título */}
                <Box as="td" p={3}>
                  <HStack gap={3} maxW="380px">
                    <Box
                      w={12}
                      h={12}
                      borderRadius="lg"
                      overflow="hidden"
                      bg="cirqueira.grey.950"
                      flexShrink={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderWidth="1px"
                      borderColor="border.subtle"
                    >
                      <img
                        src={isVideo ? thumbUrl : streamUrl}
                        alt={titulo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </Box>

                    <VStack align="start" gap={0.5} minW={0}>
                      <HStack gap={1.5} maxW="full">
                        {isVideo ? (
                          <Film size={13} color="var(--chakra-colors-cirqueira-purple-400)" />
                        ) : (
                          <FileImage size={13} color="var(--chakra-colors-cirqueira-brand-400)" />
                        )}
                        <Text fontSize="xs" fontWeight="bold" color="fg" truncate title={titulo}>
                          {titulo}
                        </Text>
                      </HStack>
                      <Text fontSize="10px" color="fg.subtle" fontFamily="mono">
                        {item.hash.slice(0, 12)}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Origem */}
                <Box as="td" p={3}>
                  <Badge
                    size="xs"
                    variant="subtle"
                    colorPalette={origemInfo.colorPalette}
                    borderRadius="md"
                  >
                    {origemInfo.label}
                  </Badge>
                </Box>

                {/* Categoria */}
                <Box as="td" p={3}>
                  {item.categoria?.nome ? (
                    <Badge size="xs" variant="solid" colorPalette="brand" borderRadius="md">
                      <Folder size={10} style={{ marginRight: '4px' }} />
                      <Text as="span">{item.categoria.nome}</Text>
                    </Badge>
                  ) : (
                    <Badge size="xs" variant="subtle" colorPalette="amber" borderRadius="md">
                      Sem Categoria
                    </Badge>
                  )}
                </Box>

                {/* Tamanho */}
                <Box as="td" p={3}>
                  <HStack gap={1} fontSize="xs" color="fg.subtle">
                    <HardDrive size={12} />
                    <Text as="span">{formatarTamanhoBytes(Number(item.tamanhoBytes ?? 0))}</Text>
                  </HStack>
                </Box>

                {/* Data */}
                <Box as="td" p={3}>
                  <HStack gap={1} fontSize="xs" color="fg.subtle">
                    <Calendar size={12} />
                    <Text as="span">{dataFormatada}</Text>
                  </HStack>
                </Box>

                {/* Ações */}
                <Box as="td" p={3} pr={4} textAlign="right" onClick={(e) => e.stopPropagation()}>
                  <HStack gap={1} justify="flex-end">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      onClick={() => onVisualizar(item)}
                      aria-label="Visualizar mídia"
                      title="Visualizar mídia"
                      borderRadius="md"
                    >
                      <Eye size={13} />
                    </IconButton>

                    {!isVideo && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={(e) => handleCopiar(item.uuid, isVideo, e)}
                        aria-label="Copiar imagem"
                        title="Copiar para clipboard"
                        borderRadius="md"
                      >
                        <Copy size={13} />
                      </IconButton>
                    )}

                    {onCategorizar && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={() => onCategorizar(item)}
                        aria-label="Atribuir categoria"
                        title="Atribuir categoria"
                        borderRadius="md"
                      >
                        <FolderPlus size={13} />
                      </IconButton>
                    )}

                    <IconButton
                      size="xs"
                      variant="ghost"
                      disabled={baixandoUuid === item.uuid}
                      onClick={(e) => handleDownload(item.uuid, titulo, isVideo, e)}
                      aria-label="Baixar arquivo"
                      title="Baixar arquivo"
                      borderRadius="md"
                    >
                      <Download size={13} />
                    </IconButton>

                    {onApagar && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        color="cirqueira.red.400"
                        _hover={{ bg: 'cirqueira.red.500/20' }}
                        onClick={() => onApagar(item.uuid)}
                        aria-label="Apagar mídia"
                        title="Apagar mídia"
                        borderRadius="md"
                      >
                        <Trash2 size={13} />
                      </IconButton>
                    )}
                  </HStack>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
})
