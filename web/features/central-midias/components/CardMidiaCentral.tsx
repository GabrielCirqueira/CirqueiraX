import { addToast } from '@/shared/components/ui/toaster'
import { Badge, Box, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  Camera,
  Check,
  CheckSquare,
  Copy,
  Download,
  FileImage,
  Film,
  Folder,
  FolderPlus,
  HardDrive,
  Layers,
  Monitor,
  Play,
  Square,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import {
  baixarArquivoMidia,
  copiarImagemParaClipboard,
  obterUrlStreamMidia,
  obterUrlThumbnailMidia,
} from '../api'
import type { MediaItem } from '../types'

export interface CardMidiaCentralProps {
  item: MediaItem
  selecionado: boolean
  onToggleSelect: (uuid: string) => void
  onVisualizar: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onApagar?: (uuid: string) => void
}

const REGEX_VIDEO_EXT = /\.(mp4|mkv|webm|mov)$/i

export const CardMidiaCentral = memo(function CardMidiaCentral({
  item,
  selecionado,
  onToggleSelect,
  onVisualizar,
  onCategorizar,
  onApagar,
}: CardMidiaCentralProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [erroCarregamento, setErroCarregamento] = useState(false)
  const [baixando, setBaixando] = useState(false)
  const [copiando, setCopiando] = useState(false)
  const [copiadoRecente, setCopiadoRecente] = useState(false)
  const [falhaThumbRemota, setFalhaThumbRemota] = useState(false)

  const isVideo = useMemo(() => {
    const temDuracao = Boolean(item.metadata?.duracao)
    const temCaminhoVideo = Boolean(item.caminhoLocal?.match(REGEX_VIDEO_EXT))
    const temExtensaoVideo = Boolean(String(item.metadata?.extensao ?? '').match(/^(mp4|mkv|webm|mov)$/i))
    const isOrigemDownload = item.origem === 'download' || (item.origem as string) === 'bot_telegram'
    return temDuracao || temCaminhoVideo || temExtensaoVideo || isOrigemDownload
  }, [item])

  const titulo = useMemo(() => {
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
    switch (item.origem) {
      case 'manual':
        return { label: 'Upload Manual', icon: UploadCloud, colorPalette: 'blue' }
      case 'download':
        return { label: 'Download Vídeo', icon: Film, colorPalette: 'purple' }
      case 'bot_telegram' as string:
        return { label: 'Telegram', icon: Film, colorPalette: 'purple' }
      case 'print_empresa':
        return { label: 'Agente Empresa', icon: Monitor, colorPalette: 'cyan' }
      case 'print_pessoal':
        return { label: 'Agente PC', icon: Camera, colorPalette: 'teal' }
      default:
        return { label: item.origemDescricao || 'Mídia', icon: Layers, colorPalette: 'gray' }
    }
  }, [item])

  const duracaoFormatada = useMemo(() => {
    if (!item.metadata?.duracao) return null
    const seg = Math.round(Number(item.metadata.duracao))
    const m = Math.floor(seg / 60)
    const s = seg % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [item.metadata?.duracao])

  const dataHora = useMemo(() => {
    if (!item.criadoEm) return ''
    try {
      return new Date(item.criadoEm).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }, [item.criadoEm])

  const streamUrl = obterUrlStreamMidia(item.uuid)
  const apiThumbUrl = obterUrlThumbnailMidia(item.uuid)
  const remoteThumbUrl = item.thumbnailUrl || (typeof item.metadata?.thumbnail === 'string' ? item.metadata.thumbnail : null)

  const displayUrl = useMemo(() => {
    if (isVideo) {
      if (remoteThumbUrl && !falhaThumbRemota) {
        return remoteThumbUrl
      }
      return apiThumbUrl
    }
    return streamUrl
  }, [isVideo, remoteThumbUrl, falhaThumbRemota, apiThumbUrl, streamUrl])

  const handleCopiar = async (e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleBaixar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setBaixando(true)
    try {
      await baixarArquivoMidia(item.uuid, titulo, isVideo)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <Box
      className="smooth-media-item"
      position="relative"
      w="full"
      borderRadius="md"
      overflow="hidden"
      bg="cirqueira.grey.950"
      borderWidth="2px"
      borderColor={selecionado ? 'cirqueira.brand.500' : 'transparent'}
      cursor="pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onVisualizar(item)}
      shadow={selecionado ? 'md' : 'none'}
      outline={selecionado ? '2px solid' : 'none'}
      outlineColor="cirqueira.brand.500"
      _hover={{
        borderColor: selecionado ? 'cirqueira.brand.500' : 'border.muted',
        shadow: '0 8px 24px -4px rgba(0, 0, 0, 0.5)',
      }}
    >
      {!erroCarregamento ? (
        <Box position="relative" w="full" overflow="hidden">
          <img
            src={displayUrl}
            alt={titulo}
            loading="lazy"
            onError={() => {
              if (isVideo && remoteThumbUrl && !falhaThumbRemota) {
                setFalhaThumbRemota(true)
              } else {
                setErroCarregamento(true)
              }
            }}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'contain',
              backgroundColor: 'var(--chakra-colors-cirqueira-grey-950, #191b1a)',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
              willChange: 'transform',
            }}
          />

          {isVideo && (
            <Box
              position="absolute"
              inset={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={isHovered ? 'cirqueira.grey.950/20' : 'transparent'}
              transition="background 0.2s"
              pointerEvents="none"
            >
              <Box
                p={2.5}
                borderRadius="full"
                bg="cirqueira.grey.950/80"
                color="cirqueira.grey.0"
                backdropFilter="blur(8px)"
                borderWidth="1px"
                borderColor="cirqueira.grey.700"
                shadow="lg"
                transform={isHovered ? 'scale(1.1)' : 'scale(1)'}
                transition="transform 0.2s"
              >
                <Play size={18} fill="currentColor" />
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        /* Fallback elegante caso a mídia não carregue */
        <VStack
          w="full"
          h={44}
          justify="center"
          align="center"
          bg="cirqueira.grey.900"
          gap={2}
          p={3}
        >
          {isVideo ? (
            <Film size={26} color="var(--chakra-colors-cirqueira-purple-400)" />
          ) : (
            <FileImage size={26} color="var(--chakra-colors-cirqueira-brand-400)" />
          )}
          <Text fontSize="11px" color="fg.subtle" textAlign="center" truncate maxW="full">
            {titulo}
          </Text>
        </VStack>
      )}

      <Box
        position="absolute"
        top={2}
        left={2}
        zIndex={3}
        opacity={isHovered || selecionado ? 1 : 0}
        transition="opacity 0.15s ease"
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect(item.uuid)
        }}
      >
        <IconButton
          size="xs"
          variant="solid"
          colorPalette={selecionado ? 'brand' : 'gray'}
          bg={selecionado ? 'cirqueira.brand.500' : 'cirqueira.grey.950/80'}
          color="cirqueira.grey.0"
          backdropFilter="blur(6px)"
          borderWidth="1px"
          borderColor={selecionado ? 'cirqueira.brand.400' : 'cirqueira.grey.700'}
          aria-label="Selecionar mídia"
          borderRadius="md"
          h={6}
          w={6}
          minW={6}
          p={0}
        >
          {selecionado ? <CheckSquare size={13} /> : <Square size={13} />}
        </IconButton>
      </Box>

      <HStack
        position="absolute"
        top={2}
        right={2}
        zIndex={3}
        gap={1.5}
        pointerEvents="none"
        flexWrap="wrap"
        justify="flex-end"
        maxW="calc(100% - 40px)"
      >
        {item.categoria?.nome && (
          <Badge
            size="xs"
            variant="surface"
            colorPalette="gray"
            bg="cirqueira.grey.950/85"
            color="cirqueira.brand.300"
            borderWidth="1px"
            borderColor="cirqueira.brand.500/40"
            backdropFilter="blur(6px)"
            borderRadius="md"
            px={1.5}
            py={0.5}
            fontSize="10px"
            fontWeight="semibold"
          >
            <Folder size={10} style={{ marginRight: '3px', display: 'inline' }} />
            {item.categoria.nome}
          </Badge>
        )}

        <Badge
          size="xs"
          variant="solid"
          colorPalette={infoOrigem.colorPalette}
          backdropFilter="blur(6px)"
          borderRadius="md"
          px={1.5}
          py={0.5}
          fontSize="9px"
          fontWeight="bold"
        >
          <infoOrigem.icon size={10} style={{ marginRight: '3px', display: 'inline' }} />
          {infoOrigem.label}
        </Badge>

        {(item.status === 'arquivo_removido' || item.status === 'arquivo_expurgado') && (
          <Badge
            size="xs"
            variant="solid"
            colorPalette="orange"
            backdropFilter="blur(6px)"
            borderRadius="md"
            px={1.5}
            py={0.5}
            fontSize="9px"
            fontWeight="bold"
            title="Arquivo de vídeo removido do sistema para economizar espaço. Metadados e miniatura preservados."
          >
            <HardDrive size={10} style={{ marginRight: '3px', display: 'inline' }} />
            Arquivo Removido
          </Badge>
        )}

        {isVideo && duracaoFormatada && (
          <Badge
            size="xs"
            variant="solid"
            colorPalette="purple"
            bg="cirqueira.grey.950/90"
            color="cirqueira.grey.0"
            backdropFilter="blur(6px)"
            borderRadius="md"
            px={1.5}
            py={0.5}
            fontSize="9px"
            fontWeight="bold"
          >
            {duracaoFormatada}
          </Badge>
        )}
      </HStack>

      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p={2}
        pt={6}
        bgGradient="to-t"
        gradientFrom="cirqueira.grey.950/95"
        gradientTo="transparent"
        zIndex={2}
        opacity={isHovered ? 1 : 0}
        transition="opacity 0.2s ease"
        pointerEvents={isHovered ? 'auto' : 'none'}
      >
        <HStack justify="space-between" align="center" gap={1}>
          <Text
            fontSize="11px"
            color="cirqueira.grey.0"
            fontWeight="medium"
            truncate
            flex={1}
            title={titulo}
          >
            {titulo}
          </Text>

          <HStack gap={1} flexShrink={0} onClick={(e) => e.stopPropagation()}>
            {!isVideo && (
              <IconButton
                size="xs"
                variant="ghost"
                color="cirqueira.grey.200"
                _hover={{ bg: 'cirqueira.grey.800', color: 'cirqueira.grey.0' }}
                aria-label="Copiar imagem"
                title="Copiar para área de transferência"
                disabled={copiando}
                onClick={handleCopiar}
                borderRadius="md"
                h={6}
                w={6}
                minW={6}
              >
                {copiadoRecente ? <Check size={12} color="var(--chakra-colors-cirqueira-brand-400)" /> : <Copy size={12} />}
              </IconButton>
            )}

            {onCategorizar && (
              <IconButton
                size="xs"
                variant="ghost"
                color="cirqueira.grey.200"
                _hover={{ bg: 'cirqueira.grey.800', color: 'cirqueira.grey.0' }}
                aria-label="Atribuir categoria"
                title="Atribuir categoria"
                onClick={() => onCategorizar(item)}
                borderRadius="md"
                h={6}
                w={6}
                minW={6}
              >
                <FolderPlus size={12} />
              </IconButton>
            )}

            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.200"
              _hover={{ bg: 'cirqueira.grey.800', color: 'cirqueira.grey.0' }}
              aria-label="Baixar mídia"
              title="Baixar arquivo"
              disabled={baixando}
              onClick={handleBaixar}
              borderRadius="md"
              h={6}
              w={6}
              minW={6}
            >
              <Download size={12} />
            </IconButton>

            {onApagar && (
              <IconButton
                size="xs"
                variant="ghost"
                color="cirqueira.grey.300"
                _hover={{ bg: 'cirqueira.red.500/20', color: 'cirqueira.red.400' }}
                aria-label="Apagar mídia"
                title="Apagar permanentemente"
                onClick={() => onApagar(item.uuid)}
                borderRadius="md"
                h={6}
                w={6}
                minW={6}
              >
                <Trash2 size={12} />
              </IconButton>
            )}
          </HStack>
        </HStack>

        {dataHora && (
          <Text fontSize="9px" color="cirqueira.grey.400" mt={0.5}>
            {dataHora}
          </Text>
        )}
      </Box>
    </Box>
  )
})
