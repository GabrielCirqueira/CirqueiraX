import { Badge, Box, Card, Flex, HStack, IconButton, Link, Text, VStack } from '@chakra-ui/react'
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
  tempoRelativoNativo,
} from '../utils/formatadores'

export interface CardVideoProps {
  item: MediaItem
  selecionado: boolean
  onToggleSelect: (uuid: string) => void
  onVisualizar?: (item: MediaItem) => void
  onEditarMetadata?: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onRebaixar?: (uuid: string) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
}

export const CardVideo = memo(function CardVideo({
  item,
  selecionado,
  onToggleSelect,
  onVisualizar,
  onEditarMetadata,
  onCategorizar,
  onRebaixar,
  onRetentar,
  onApagar,
}: CardVideoProps) {
  const [erroImagem, setErroImagem] = useState(false)
  const [baixando, setBaixando] = useState(false)
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
      : 'Uploader desconhecido'
  const urlThumbnail =
    item.thumbnailUrl ||
    (typeof item.metadata?.thumbnail === 'string' ? item.metadata.thumbnail : undefined)
  const temThumbnail = Boolean(urlThumbnail) && !erroImagem
  const urlOriginal =
    typeof item.metadata?.url_original === 'string' ? item.metadata.url_original : undefined
  const dataString = typeof item.metadata?.data === 'string' ? item.metadata.data : undefined
  const dataMidia = formatarDataMidia(dataString, item.criadoEm)
  const horarioMidia = formatarHorarioMidia(item)
  const tamanhoNumero =
    typeof item.metadata?.tamanho_bytes === 'number' ? item.metadata.tamanho_bytes : undefined
  const tamanhoFormatado = formatarTamanhoBytes(tamanhoNumero)
  const extensao = typeof item.metadata?.extensao === 'string' ? item.metadata.extensao : 'mp4'

  const handleDownloadDirecto = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setBaixando(true)
      await baixarArquivoMidia(item.uuid, titulo)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <Card.Root
      position="relative"
      display="flex"
      flexDirection="column"
      borderRadius="xl"
      borderWidth={selecionado ? '2px' : '1px'}
      borderColor={selecionado ? 'cirqueira.brand.500' : 'border.subtle'}
      bg="bg.panel"
      overflow="hidden"
      shadow="sm"
      transition="all 0.2s"
      _hover={{ borderColor: selecionado ? 'cirqueira.brand.500' : 'border.muted', shadow: 'md' }}
    >
      <Box position="relative" aspectRatio="16/9" w="full" bg="bg.muted" overflow="hidden">
        {temThumbnail ? (
          <img
            src={urlThumbnail}
            alt={titulo}
            onError={() => setErroImagem(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <VStack h="full" w="full" align="center" justify="center" gap={2} color="fg.subtle">
            <Video size={36} strokeWidth={1.5} />
            <Text fontSize="xs" fontWeight="medium">
              Clique para assistir
            </Text>
          </VStack>
        )}

        <Box
          position="absolute"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="blackAlpha.600"
          opacity={0}
          _hover={{ opacity: 1 }}
          cursor="pointer"
          onClick={() => onVisualizar?.(item)}
          transition="opacity 0.2s ease"
          zIndex={5}
        >
          <Box
            p={3}
            borderRadius="full"
            bg="cirqueira.brand.500"
            color="white"
            shadow="2xl"
            transform="scale(0.95)"
            _hover={{ transform: 'scale(1.08)' }}
            transition="transform 0.15s ease"
          >
            <Play size={20} fill="white" />
          </Box>
        </Box>

        <Box position="absolute" top={2} left={2} zIndex={10}>
          <IconButton
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect(item.uuid)
            }}
            bg="blackAlpha.600"
            _hover={{ bg: 'blackAlpha.800' }}
            color="white"
            backdropFilter="blur(8px)"
            borderRadius="lg"
            aria-label={`Selecionar ${titulo}`}
          >
            {selecionado ? (
              <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                <CheckSquare size={15} color="currentColor" />
              </Box>
            ) : (
              <Square size={15} />
            )}
          </IconButton>
        </Box>

        <Box position="absolute" top={2} right={2} zIndex={10}>
          <Badge
            size="sm"
            variant="subtle"
            colorPalette={statusInfo.colorPalette}
            backdropFilter="blur(8px)"
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

        {duracaoFormatada && (
          <Box
            position="absolute"
            bottom={2}
            right={2}
            zIndex={10}
            borderRadius="md"
            bg="blackAlpha.800"
            px={2}
            py={0.5}
            fontSize="xs"
            fontWeight="bold"
            color="white"
            backdropFilter="blur(4px)"
          >
            {duracaoFormatada}
          </Box>
        )}

        {urlOriginal && (
          <Link
            href={urlOriginal}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            position="absolute"
            bottom={2}
            left={2}
            zIndex={10}
            p={1.5}
            borderRadius="md"
            bg="blackAlpha.700"
            color="whiteAlpha.900"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            title="Abrir link original"
            _hover={{ bg: 'blackAlpha.900' }}
          >
            <ExternalLink size={13} />
          </Link>
        )}
      </Box>

      <Card.Body display="flex" flex={1} flexDirection="column" p={4} gap={2.5}>
        <Text
          as="h3"
          fontWeight="semibold"
          fontSize="sm"
          color="fg"
          lineClamp={2}
          title={titulo}
          cursor="pointer"
          _hover={{ color: 'cirqueira.brand.400' }}
          onClick={() => onVisualizar?.(item)}
        >
          {titulo}
        </Text>

        <Flex align="center" justify="space-between" gap={2} fontSize="xs" color="fg.subtle">
          <HStack gap={1.5} truncate flex={1}>
            <User size={13} style={{ flexShrink: 0 }} />
            <Text as="span" truncate>
              {uploader}
            </Text>
          </HStack>

          {(tamanhoFormatado || extensao) && (
            <HStack gap={1.5} flexShrink={0}>
              <Badge
                size="xs"
                variant="outline"
                textTransform="uppercase"
                colorPalette="gray"
                borderRadius="md"
              >
                {extensao}
              </Badge>
              {tamanhoFormatado && (
                <HStack gap={1} fontSize="xs" color="fg.subtle">
                  <HardDrive size={11} />
                  <Text as="span">{tamanhoFormatado}</Text>
                </HStack>
              )}
            </HStack>
          )}
        </Flex>

        <Flex align="center" justify="space-between" gap={2} fontSize="xs" color="fg.subtle">
          <HStack gap={2} color="fg.muted" truncate>
            <HStack gap={1}>
              <Calendar size={12} style={{ flexShrink: 0 }} />
              <Text as="span">{dataMidia}</Text>
            </HStack>
            <Text as="span" opacity={0.4}>
              •
            </Text>
            <HStack gap={1}>
              <Clock size={12} style={{ flexShrink: 0 }} />
              <Text as="span">{horarioMidia}</Text>
            </HStack>
          </HStack>

          <Box flexShrink={0}>
            {item.categoria?.nome ? (
              <Badge size="xs" variant="subtle" colorPalette="brand" borderRadius="md">
                <HStack gap={1} alignItems="center">
                  <Folder size={11} />
                  <Text as="span" maxW="24" truncate>
                    {item.categoria.nome}
                  </Text>
                </HStack>
              </Badge>
            ) : (
              <Text as="span" fontStyle="italic" color="fg.subtle" fontSize="xs">
                Sem categoria
              </Text>
            )}
          </Box>
        </Flex>

        {item.status === 'erro' && item.erroMotivo && (
          <Box
            borderRadius="lg"
            bg="cirqueira.red.500/10"
            p={2}
            fontSize="xs"
            color="cirqueira.red.500"
            borderWidth="1px"
            borderColor="cirqueira.red.500/20"
            lineClamp={2}
          >
            {item.erroMotivo}
          </Box>
        )}

        <Flex
          align="center"
          justify="space-between"
          gap={2}
          pt={2}
          mt="auto"
          borderTopWidth="1px"
          borderColor="border.subtle"
        >
          <Text as="span" fontSize="xs" color="fg.subtle" truncate>
            {tempoRelativoNativo(item.criadoEm)}
          </Text>

          <HStack gap={1} flexShrink={0}>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleDownloadDirecto}
              disabled={baixando}
              aria-label="Baixar arquivo MP4"
              title="Baixar arquivo MP4"
              color="cirqueira.brand.500"
              _hover={{ bg: 'cirqueira.brand.500/10' }}
              borderRadius="lg"
            >
              {baixando ? (
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
                aria-label="Editar metadados"
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
                aria-label="Categorizar vídeo"
                title="Categorizar"
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
                aria-label="Rebaixar vídeo"
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
                aria-label="Retentar processamento"
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
                aria-label="Apagar vídeo"
                title="Apagar"
                borderRadius="lg"
              >
                <Box as="span" color="cirqueira.red.500" display="inline-flex">
                  <Trash2 size={14} color="currentColor" />
                </Box>
              </IconButton>
            )}
          </HStack>
        </Flex>
      </Card.Body>
    </Card.Root>
  )
})
