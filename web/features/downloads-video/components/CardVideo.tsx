import { Badge, Box, Card, Flex, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  DownloadCloud,
  Edit3,
  ExternalLink,
  FolderPlus,
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
import type { MediaItem, StatusMediaItem } from '../types'

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

function formatarDuracao(segundos?: number): string | null {
  if (segundos === undefined || segundos === null || Number.isNaN(segundos) || segundos <= 0) {
    return null
  }

  const horas = Math.floor(segundos / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)
  const segRestantes = Math.floor(segundos % 60)

  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, '0')}:${String(segRestantes).padStart(2, '0')}`
  }

  return `${minutos}:${String(segRestantes).padStart(2, '0')}`
}

function tempoRelativoNativo(dataIso: string): string {
  try {
    const data = new Date(dataIso)
    if (Number.isNaN(data.getTime())) {
      return dataIso
    }

    const agora = new Date()
    const diffSegundos = Math.floor((agora.getTime() - data.getTime()) / 1000)

    if (diffSegundos < 60) {
      return 'agora há pouco'
    }

    const diffMinutos = Math.floor(diffSegundos / 60)
    if (diffMinutos < 60) {
      return `há ${diffMinutos} min`
    }

    const diffHoras = Math.floor(diffMinutos / 60)
    if (diffHoras < 24) {
      return `há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
    }

    const diffDias = Math.floor(diffHoras / 24)
    if (diffDias < 30) {
      return `há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`
    }

    return data.toLocaleDateString('pt-BR')
  } catch {
    return dataIso
  }
}

function obterStatusConfig(status: StatusMediaItem) {
  switch (status) {
    case 'baixando':
      return {
        label: 'Baixando',
        colorPalette: 'amber',
        animado: true,
      }
    case 'recebido':
      return {
        label: 'Recebido',
        colorPalette: 'gray',
        animado: false,
      }
    case 'em_fila':
      return {
        label: 'Em Fila',
        colorPalette: 'blue',
        animado: true,
      }
    case 'classificado':
      return {
        label: 'Classificado',
        colorPalette: 'purple',
        animado: false,
      }
    case 'distribuindo':
      return {
        label: 'Distribuindo',
        colorPalette: 'cyan',
        animado: true,
      }
    case 'distribuido_local':
      return {
        label: 'Distribuído',
        colorPalette: 'teal',
        animado: false,
      }
    case 'enviando_google_fotos':
      return {
        label: 'Google Fotos',
        colorPalette: 'purple',
        animado: true,
      }
    case 'concluido':
      return {
        label: 'Concluído',
        colorPalette: 'green',
        animado: false,
      }
    case 'erro':
      return {
        label: 'Erro',
        colorPalette: 'red',
        animado: false,
      }
    default:
      return {
        label: status,
        colorPalette: 'gray',
        animado: false,
      }
  }
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
  const duracaoFormatada = formatarDuracao(item.metadata?.duracao)
  const titulo = item.metadata?.titulo || `Vídeo ${item.hash.slice(0, 10)}`
  const uploader = item.metadata?.uploader || 'Uploader desconhecido'
  const temThumbnail = Boolean(item.metadata?.thumbnail) && !erroImagem
  const urlOriginal = item.metadata?.url_original

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
      borderRadius="2xl"
      borderWidth={selecionado ? '2px' : '1px'}
      borderColor={selecionado ? 'brand.500' : 'border.subtle'}
      bg="bg.panel"
      overflow="hidden"
      shadow="none"
      transition="all 0.2s"
      _hover={{ borderColor: selecionado ? 'brand.500' : 'border.muted' }}
    >
      <Box position="relative" aspectRatio="16/9" w="full" bg="bg.muted" overflow="hidden">
        {temThumbnail ? (
          <Box
            as="img"
            src={item.metadata?.thumbnail}
            alt={titulo}
            onError={() => setErroImagem(true)}
            w="full"
            h="full"
            objectFit="cover"
            loading="lazy"
          />
        ) : (
          <VStack h="full" w="full" align="center" justify="center" gap={2} color="fg.subtle">
            <Video size={40} strokeWidth={1.5} />
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
          bg="blackAlpha.500"
          opacity={0}
          _hover={{ opacity: 1 }}
          cursor="pointer"
          onClick={() => onVisualizar?.(item)}
          transition="opacity 0.2s ease"
          zIndex={5}
        >
          <Box
            p={3.5}
            borderRadius="full"
            bg="brand.500"
            color="white"
            shadow="2xl"
            transform="scale(0.9)"
            _hover={{ transform: 'scale(1.08)' }}
            transition="transform 0.15s ease"
          >
            <Play size={22} fill="white" />
          </Box>
        </Box>

        <Box position="absolute" top={2.5} left={2.5} zIndex={10}>
          <IconButton
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect(item.uuid)
            }}
            bg="blackAlpha.600"
            _hover={{ bg: 'blackAlpha.800' }}
            color="white"
            backdropFilter="blur(8px)"
            aria-label={`Selecionar ${titulo}`}
          >
            {selecionado ? <CheckSquare size={16} color="#a78bfa" /> : <Square size={16} />}
          </IconButton>
        </Box>

        <Box position="absolute" top={2.5} right={2.5} zIndex={10}>
          <Badge
            size="sm"
            variant="subtle"
            colorPalette={statusInfo.colorPalette}
            backdropFilter="blur(8px)"
          >
            <HStack gap={1} alignItems="center">
              {statusInfo.animado ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : item.status === 'erro' ? (
                <AlertCircle size={12} />
              ) : item.status === 'concluido' ? (
                <CheckCircle2 size={12} />
              ) : (
                <Clock size={12} />
              )}
              <Text as="span">{statusInfo.label}</Text>
            </HStack>
          </Badge>
        </Box>

        {duracaoFormatada && (
          <Box
            position="absolute"
            bottom={2.5}
            right={2.5}
            zIndex={10}
            borderRadius="md"
            bg="blackAlpha.800"
            px={2}
            py={0.5}
            fontSize="xs"
            fontWeight="medium"
            color="white"
            backdropFilter="blur(4px)"
          >
            {duracaoFormatada}
          </Box>
        )}

        {urlOriginal && (
          <Box
            as="a"
            href={urlOriginal}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            position="absolute"
            bottom="10px"
            left="10px"
            zIndex={10}
            p={1}
            borderRadius="md"
            bg="blackAlpha.600"
            color="whiteAlpha.800"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            title="Abrir link original"
          >
            <ExternalLink size={14} />
          </Box>
        )}
      </Box>

      <Card.Body display="flex" flex={1} flexDirection="column" p={4}>
        <Text
          as="h3"
          fontWeight="semibold"
          fontSize="sm"
          color="fg"
          lineClamp={2}
          mb={1.5}
          title={titulo}
          cursor="pointer"
          _hover={{ color: 'brand.400' }}
          onClick={() => onVisualizar?.(item)}
        >
          {titulo}
        </Text>

        <HStack gap={1.5} fontSize="xs" color="fg.subtle" mb={2}>
          <User size={12} style={{ flexShrink: 0 }} />
          <Text as="span" truncate>
            {uploader}
          </Text>
        </HStack>

        <Flex
          align="center"
          justify="space-between"
          gap={2}
          fontSize="xs"
          color="fg.subtle"
          pt={1}
          borderTopWidth="1px"
          borderColor="border.subtle"
          mb={3}
        >
          <Box truncate>
            {item.categoria?.nome ? (
              <Badge size="sm" variant="subtle" colorPalette="brand">
                <HStack gap={1} alignItems="center">
                  <FolderPlus size={12} />
                  <Text as="span">{item.categoria.nome}</Text>
                </HStack>
              </Badge>
            ) : (
              <Text as="span" fontStyle="italic" color="fg.subtle">
                Sem categoria
              </Text>
            )}
          </Box>
          <Text as="span" flexShrink={0}>
            {tempoRelativoNativo(item.criadoEm)}
          </Text>
        </Flex>

        {item.status === 'erro' && item.erroMotivo && (
          <Box
            mb={3}
            borderRadius="lg"
            bg="red.500/10"
            p={2}
            fontSize="xs"
            color="red.500"
            borderWidth="1px"
            borderColor="red.500/20"
            lineClamp={2}
          >
            {item.erroMotivo}
          </Box>
        )}

        <HStack mt="auto" align="center" justify="flex-end" gap={1} pt={2}>
          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleDownloadDirecto}
            disabled={baixando}
            aria-label="Baixar arquivo MP4"
            title="Baixar arquivo MP4 para seu computador"
            color="cyan.400"
            _hover={{ bg: 'cyan.500/10' }}
          >
            {baixando ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Download size={16} />
            )}
          </IconButton>

          {onEditarMetadata && (
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => onEditarMetadata(item)}
              aria-label="Editar metadados"
              title="Editar título e uploader"
            >
              <Edit3 size={16} />
            </IconButton>
          )}

          {onCategorizar && (
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => onCategorizar(item)}
              aria-label="Categorizar vídeo"
              title="Mover para categoria"
            >
              <FolderPlus size={16} />
            </IconButton>
          )}

          {onRebaixar && (
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => onRebaixar(item.uuid)}
              aria-label="Rebaixar vídeo"
              title="Baixar novamente"
            >
              <DownloadCloud size={16} />
            </IconButton>
          )}

          {item.status === 'erro' && onRetentar && (
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => onRetentar(item.uuid)}
              aria-label="Retentar processamento"
            >
              <RotateCcw size={16} color="#d97706" />
            </IconButton>
          )}

          {onApagar && (
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => onApagar(item.uuid)}
              aria-label="Apagar vídeo"
              title="Remover vídeo"
            >
              <Trash2 size={16} color="#ef4444" />
            </IconButton>
          )}
        </HStack>
      </Card.Body>
    </Card.Root>
  )
})
