import { Badge, Box, Flex, HStack, IconButton, Link, Text, VStack } from '@chakra-ui/react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  DownloadCloud,
  Edit3,
  ExternalLink,
  Film,
  Folder,
  FolderPlus,
  HardDrive,
  Loader2,
  Play,
  RotateCcw,
  Square,
  Trash2,
  User,
  Video,
} from 'lucide-react'
import { memo, useState } from 'react'
import { baixarArquivoMidia } from '../api'
import type { MediaItem } from '../types'
import {
  formatarDataMidia,
  formatarDuracao,
  formatarHorarioMidia,
  formatarTamanhoBytes,
  obterStatusConfig,
} from '../utils/formatadores'

export interface TabelaVideosProps {
  itens: MediaItem[]
  carregando?: boolean
  selecionados: string[]
  onToggleSelect: (uuid: string) => void
  onToggleSelectAll?: () => void
  onVisualizar?: (item: MediaItem) => void
  onEditarMetadata?: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onRebaixar?: (uuid: string) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
}

export const TabelaVideos = memo(function TabelaVideos({
  itens,
  carregando = false,
  selecionados,
  onToggleSelect,
  onToggleSelectAll,
  onVisualizar,
  onEditarMetadata,
  onCategorizar,
  onRebaixar,
  onRetentar,
  onApagar,
}: TabelaVideosProps) {
  const [baixandoUuid, setBaixandoUuid] = useState<string | null>(null)

  const handleDownload = async (uuid: string, titulo: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setBaixandoUuid(uuid)
      await baixarArquivoMidia(uuid, titulo)
    } finally {
      setBaixandoUuid(null)
    }
  }

  if (carregando && itens.length === 0) {
    return (
      <VStack gap={2} w="full">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Box
            key={`sk-row-${idx + 1}`}
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

  if (!carregando && itens.length === 0) {
    return (
      <VStack
        w="full"
        align="center"
        justify="center"
        py={16}
        px={4}
        textAlign="center"
        borderRadius="xl"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.subtle"
        bg="bg.panel"
        gap={2}
      >
        <Box
          p={3.5}
          borderRadius="lg"
          bg="cirqueira.brand.500/10"
          color="cirqueira.brand.500"
          mb={2}
          display="inline-flex"
        >
          <Film size={36} strokeWidth={1.5} />
        </Box>
        <Text as="h3" fontSize="md" fontWeight="bold" color="fg">
          Nenhum vídeo encontrado
        </Text>
        <Text fontSize="xs" color="fg.subtle" maxW="md">
          Cole o link de um vídeo acima para iniciar a ingestão.
        </Text>
      </VStack>
    )
  }

  return (
    <Box
      w="full"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      overflow="hidden"
      shadow="sm"
    >
      <Box overflowX="auto" w="full">
        <Box as="table" w="full" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
          <Box as="thead" bg="bg.muted/50" borderBottomWidth="1px" borderColor="border.subtle">
            <Box as="tr">
              <Box as="th" p={3.5} w={10} textAlign="center">
                {onToggleSelectAll && itens.length > 0 ? (
                  <IconButton
                    size="xs"
                    variant="ghost"
                    aria-label="Selecionar todos os vídeos"
                    onClick={onToggleSelectAll}
                    colorPalette={selecionados.length === itens.length ? 'brand' : 'gray'}
                  >
                    {selecionados.length === itens.length ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                  </IconButton>
                ) : (
                  <Text as="span" srOnly>
                    Seleção
                  </Text>
                )}
              </Box>
              <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle">
                Vídeo
              </Box>
              <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle">
                Canal / Uploader
              </Box>
              <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle">
                Categoria
              </Box>
              <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle">
                Data & Hora
              </Box>
              <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle">
                Tamanho
              </Box>
              <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle">
                Status
              </Box>
              <Box
                as="th"
                p={3.5}
                fontSize="xs"
                fontWeight="bold"
                color="fg.subtle"
                textAlign="right"
              >
                Ações
              </Box>
            </Box>
          </Box>
          <Box as="tbody">
            {itens.map((item) => {
              const selecionado = selecionados.includes(item.uuid)
              const statusInfo = obterStatusConfig(item.status)
              const duracaoNumero =
                typeof item.metadata?.duracao === 'number' ? item.metadata.duracao : undefined
              const duracaoFormatada = formatarDuracao(duracaoNumero)
              const titulo =
                typeof item.metadata?.titulo === 'string' && item.metadata.titulo
                  ? item.metadata.titulo
                  : `Vídeo ${item.hash.slice(0, 10)}`
              const uploader =
                typeof item.metadata?.uploader === 'string' && item.metadata.uploader
                  ? item.metadata.uploader
                  : 'Desconhecido'
              const urlThumbnail =
                item.thumbnailUrl ||
                (typeof item.metadata?.thumbnail === 'string' ? item.metadata.thumbnail : undefined)
              const urlOriginal =
                typeof item.metadata?.url_original === 'string'
                  ? item.metadata.url_original
                  : undefined
              const dataString =
                typeof item.metadata?.data === 'string' ? item.metadata.data : undefined
              const dataMidia = formatarDataMidia(dataString, item.criadoEm)
              const horarioMidia = formatarHorarioMidia(item)
              const tamanhoNumero =
                typeof item.metadata?.tamanho_bytes === 'number'
                  ? item.metadata.tamanho_bytes
                  : undefined
              const tamanhoFormatado = formatarTamanhoBytes(tamanhoNumero)
              const extensao =
                typeof item.metadata?.extensao === 'string' ? item.metadata.extensao : 'mp4'

              return (
                <Box
                  as="tr"
                  key={item.uuid}
                  borderBottomWidth="1px"
                  borderColor="border.subtle"
                  bg={selecionado ? 'cirqueira.brand.500/5' : 'transparent'}
                  _hover={{ bg: selecionado ? 'cirqueira.brand.500/10' : 'bg.muted/40' }}
                  transition="background-color 0.15s"
                >
                  <Box as="td" p={3.5} textAlign="center" verticalAlign="middle">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      onClick={() => onToggleSelect(item.uuid)}
                      aria-label="Selecionar"
                      borderRadius="lg"
                    >
                      {selecionado ? (
                        <Box as="span" color="cirqueira.brand.500" display="inline-flex">
                          <CheckSquare size={16} color="currentColor" />
                        </Box>
                      ) : (
                        <Square size={16} />
                      )}
                    </IconButton>
                  </Box>

                  <Box as="td" p={3.5} verticalAlign="middle" maxW="360px">
                    <HStack gap={3}>
                      <Box
                        position="relative"
                        w="80px"
                        h="45px"
                        borderRadius="md"
                        bg="bg.muted"
                        overflow="hidden"
                        flexShrink={0}
                        cursor="pointer"
                        onClick={() => onVisualizar?.(item)}
                      >
                        {urlThumbnail ? (
                          <img
                            src={urlThumbnail}
                            alt={titulo}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                          />
                        ) : (
                          <Flex h="full" w="full" align="center" justify="center" color="fg.subtle">
                            <Video size={18} />
                          </Flex>
                        )}
                        <Flex
                          position="absolute"
                          inset={0}
                          bg="blackAlpha.600"
                          opacity={0}
                          _hover={{ opacity: 1 }}
                          align="center"
                          justify="center"
                          transition="opacity 0.15s"
                        >
                          <Play size={16} fill="white" color="white" />
                        </Flex>
                        {duracaoFormatada && (
                          <Box
                            position="absolute"
                            bottom={0.5}
                            right={0.5}
                            bg="blackAlpha.800"
                            px={1}
                            py={0.2}
                            borderRadius="xs"
                            fontSize="9px"
                            fontWeight="bold"
                            color="white"
                          >
                            {duracaoFormatada}
                          </Box>
                        )}
                      </Box>

                      <VStack align="start" gap={0.5} truncate flex={1}>
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="fg"
                          truncate
                          title={titulo}
                          cursor="pointer"
                          _hover={{ color: 'cirqueira.brand.400' }}
                          onClick={() => onVisualizar?.(item)}
                        >
                          {titulo}
                        </Text>
                        {urlOriginal && (
                          <Link
                            href={urlOriginal}
                            target="_blank"
                            rel="noopener noreferrer"
                            fontSize="11px"
                            color="cirqueira.brand.400"
                            display="inline-flex"
                            alignItems="center"
                            gap={1}
                          >
                            <Text as="span">Ver link original</Text>
                            <ExternalLink size={10} />
                          </Link>
                        )}
                      </VStack>
                    </HStack>
                  </Box>

                  <Box as="td" p={3.5} verticalAlign="middle">
                    <HStack gap={1.5} fontSize="xs" color="fg.subtle">
                      <User size={13} style={{ flexShrink: 0 }} />
                      <Text as="span" maxW="120px" truncate>
                        {uploader}
                      </Text>
                    </HStack>
                  </Box>

                  <Box as="td" p={3.5} verticalAlign="middle">
                    {item.categoria?.nome ? (
                      <Badge size="xs" variant="subtle" colorPalette="brand" borderRadius="md">
                        <HStack gap={1} alignItems="center">
                          <Folder size={11} />
                          <Text as="span" maxW="110px" truncate>
                            {item.categoria.nome}
                          </Text>
                        </HStack>
                      </Badge>
                    ) : (
                      <Text as="span" fontSize="xs" fontStyle="italic" color="fg.subtle">
                        Sem categoria
                      </Text>
                    )}
                  </Box>

                  <Box as="td" p={3.5} verticalAlign="middle">
                    <VStack align="start" gap={0} fontSize="xs" color="fg.subtle">
                      <HStack gap={1}>
                        <Calendar size={11} />
                        <Text as="span">{dataMidia}</Text>
                      </HStack>
                      <HStack gap={1} color="fg.muted">
                        <Clock size={11} />
                        <Text as="span">{horarioMidia}</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Box as="td" p={3.5} verticalAlign="middle">
                    <HStack gap={1} fontSize="xs" color="fg.subtle">
                      <Badge
                        size="xs"
                        variant="outline"
                        textTransform="uppercase"
                        colorPalette="gray"
                      >
                        {extensao}
                      </Badge>
                      {tamanhoFormatado && (
                        <HStack gap={1}>
                          <HardDrive size={11} />
                          <Text as="span">{tamanhoFormatado}</Text>
                        </HStack>
                      )}
                    </HStack>
                  </Box>

                  <Box as="td" p={3.5} verticalAlign="middle">
                    <Badge
                      size="sm"
                      variant="subtle"
                      colorPalette={statusInfo.colorPalette}
                      borderRadius="md"
                    >
                      <HStack gap={1} alignItems="center">
                        {statusInfo.animado ? (
                          <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : item.status === 'erro' ? (
                          <AlertCircle size={11} />
                        ) : item.status === 'concluido' ? (
                          <CheckCircle2 size={11} />
                        ) : (
                          <Clock size={11} />
                        )}
                        <Text as="span">{statusInfo.label}</Text>
                      </HStack>
                    </Badge>
                  </Box>

                  <Box as="td" p={3.5} verticalAlign="middle" textAlign="right">
                    <HStack gap={1} justify="flex-end">
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={(e) => handleDownload(item.uuid, titulo, e)}
                        disabled={baixandoUuid === item.uuid}
                        aria-label="Baixar MP4"
                        title="Baixar MP4"
                        color="cirqueira.brand.500"
                        _hover={{ bg: 'cirqueira.brand.500/10' }}
                        borderRadius="lg"
                      >
                        {baixandoUuid === item.uuid ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Download size={14} />
                        )}
                      </IconButton>

                      {onEditarMetadata && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          onClick={() => onEditarMetadata(item)}
                          aria-label="Editar"
                          title="Editar metadados"
                          borderRadius="lg"
                        >
                          <Edit3 size={14} />
                        </IconButton>
                      )}

                      {onCategorizar && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          onClick={() => onCategorizar(item)}
                          aria-label="Mover categoria"
                          title="Mover categoria"
                          borderRadius="lg"
                        >
                          <FolderPlus size={14} />
                        </IconButton>
                      )}

                      {onRebaixar && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          onClick={() => onRebaixar(item.uuid)}
                          aria-label="Rebaixar"
                          title="Baixar novamente"
                          borderRadius="lg"
                        >
                          <DownloadCloud size={14} />
                        </IconButton>
                      )}

                      {item.status === 'erro' && onRetentar && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          onClick={() => onRetentar(item.uuid)}
                          aria-label="Retentar"
                          title="Retentar"
                          borderRadius="lg"
                        >
                          <Box as="span" color="cirqueira.amber.500" display="inline-flex">
                            <RotateCcw size={14} color="currentColor" />
                          </Box>
                        </IconButton>
                      )}

                      {onApagar && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          onClick={() => onApagar(item.uuid)}
                          aria-label="Apagar"
                          title="Apagar"
                          borderRadius="lg"
                        >
                          <Box as="span" color="cirqueira.red.500" display="inline-flex">
                            <Trash2 size={14} color="currentColor" />
                          </Box>
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
    </Box>
  )
})
