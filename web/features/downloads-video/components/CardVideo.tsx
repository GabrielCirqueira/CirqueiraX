import { Badge, Box, Card, Flex, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
  DownloadCloud,
  Edit3,
  ExternalLink,
  FolderPlus,
  Loader2,
  RotateCcw,
  Square,
  Trash2,
  User,
  Video,
} from 'lucide-react'
import { memo, useState } from 'react'
import type { MediaItem, StatusMediaItem } from '../types'

export interface CardVideoProps {
  item: MediaItem
  selecionado: boolean
  onToggleSelect: (uuid: string) => void
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
  onEditarMetadata,
  onCategorizar,
  onRebaixar,
  onRetentar,
  onApagar,
}: CardVideoProps) {
  const [erroImagem, setErroImagem] = useState(false)
  const statusInfo = obterStatusConfig(item.status)
  const duracaoFormatada = formatarDuracao(item.metadata?.duracao)
  const titulo = item.metadata?.titulo || `Vídeo ${item.hash.slice(0, 10)}`
  const uploader = item.metadata?.uploader || 'Uploader desconhecido'
  const temThumbnail = Boolean(item.metadata?.thumbnail) && !erroImagem
  const urlOriginal = item.metadata?.url_original

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
          <img
            src={item.metadata?.thumbnail}
            alt={titulo}
            onError={() => setErroImagem(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <VStack h="full" w="full" align="center" justify="center" gap={2} color="fg.subtle">
            <Video size={40} strokeWidth={1.5} />
            <Text fontSize="xs" fontWeight="medium">Sem prévia</Text>
          </VStack>
        )}

        <Box position="absolute" top={2.5} left={2.5} zIndex={10}>
          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => onToggleSelect(item.uuid)}
            bg="blackAlpha.600"
            _hover={{ bg: 'blackAlpha.800' }}
            color="white"
            backdropFilter="blur(8px)"
            aria-label={`Selecionar ${titulo}`}
          >
            {selecionado ? (
              <CheckSquare size={16} color="#a78bfa" />
            ) : (
              <Square size={16} />
            )}
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
              <span>{statusInfo.label}</span>
            </HStack>
          </Badge>
        </Box>

        {duracaoFormatada && (
          <Box position="absolute" bottom={2.5} right={2.5} zIndex={10} borderRadius="md" bg="blackAlpha.800" px={2} py={0.5} fontSize="xs" fontWeight="medium" color="white" backdropFilter="blur(4px)">
            {duracaoFormatada}
          </Box>
        )}

        {urlOriginal && (
          <a
            href={urlOriginal}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              zIndex: 10,
              padding: '4px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Abrir link original"
          >
            <ExternalLink size={14} />
          </a>
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
        >
          {titulo}
        </Text>

        <HStack gap={1.5} fontSize="xs" color="fg.subtle" mb={2}>
          <User size={12} flexShrink={0} />
          <Text as="span" truncate>
            {uploader}
          </Text>
        </HStack>

        <Flex align="center" justify="space-between" gap={2} fontSize="xs" color="fg.subtle" pt={1} borderTopWidth="1px" borderColor="border.subtle" mb={3}>
          <Box truncate>
            {item.categoria?.nome ? (
              <Badge
                size="sm"
                variant="subtle"
                colorPalette="brand"
              >
                <HStack gap={1} alignItems="center">
                  <FolderPlus size={12} />
                  <span>{item.categoria.nome}</span>
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
          <Box mb={3} borderRadius="lg" bg="red.500/10" p={2} fontSize="xs" color="red.500" borderWidth="1px" borderColor="red.500/20" lineClamp={2}>
            {item.erroMotivo}
          </Box>
        )}

        <HStack mt="auto" align="center" justify="flex-end" gap={1} pt={2}>
          {onEditarMetadata && (
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => onEditarMetadata(item)}
              aria-label="Editar metadados"
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
            >
              <Trash2 size={16} color="#ef4444" />
            </IconButton>
          )}
        </HStack>
      </Card.Body>
    </Card.Root>
  )
})


