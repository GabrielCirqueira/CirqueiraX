import {
  Badge,
  Box,
  Card,
  Flex,
  HStack,
  IconButton,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  CloudUpload,
  Download,
  DownloadCloud,
  Edit3,
  ExternalLink,
  Folder,
  FolderPlus,
  Globe,
  HardDrive,
  Image as ImageIcon,
  Instagram,
  Loader2,
  Play,
  RotateCcw,
  Square,
  Trash2,
  User,
  Video,
  Youtube,
} from 'lucide-react'
import { memo, useState } from 'react'
import { baixarArquivoMidia, obterUrlStreamMediaItem, obterUrlThumbnailMediaItem } from '../api'
import type { MediaItem } from '../types'
import {
  extrairExtensaoMedia,
  extrairTituloMedia,
  formatarDataMidia,
  formatarDuracao,
  formatarHorarioMidia,
  formatarTamanhoBytes,
  obterStatusConfig,
  tempoRelativoNativo,
  verificarSeEhImagem,
} from '../utils/formatadores'
import { identificarPlataforma } from '../utils/plataformaVideo'

export type VarianteCardVideo = 'grid' | 'compacto' | 'galeria'

export interface CardVideoProps {
  item: MediaItem
  selecionado: boolean
  variante?: VarianteCardVideo
  colunas?: number
  onToggleSelect: (uuid: string) => void
  onVisualizar?: (item: MediaItem) => void
  onEditarMetadata?: (item: MediaItem, abaInicial?: 'geral' | 'data' | 'duracao' | 'capa') => void
  onCategorizar?: (item: MediaItem) => void
  onRebaixar?: (uuid: string) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
  onForcarGoogleFotos?: (item: MediaItem) => void
}

export const CardVideo = memo(function CardVideo({
  item,
  selecionado,
  variante = 'grid',
  colunas = 5,
  onToggleSelect,
  onVisualizar,
  onEditarMetadata,
  onCategorizar,
  onRebaixar,
  onRetentar,
  onApagar,
  onForcarGoogleFotos,
}: CardVideoProps) {
  const [erroImagem, setErroImagem] = useState(false)
  const [usarFallbackApi, setUsarFallbackApi] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [baixando, setBaixando] = useState(false)

  const statusInfo = obterStatusConfig(item.status)
  const ehArquivoRemovido = item.status === 'arquivo_removido' || item.status === 'arquivo_expurgado'
  const ehImagem = verificarSeEhImagem(item)
  const duracaoNumero =
    typeof item.metadata?.duracao === 'number' ? item.metadata.duracao : undefined
  const duracaoFormatada = formatarDuracao(duracaoNumero)
  const titulo = extrairTituloMedia(item)
  const uploader =
    typeof item.metadata?.uploader === 'string' && item.metadata.uploader
      ? item.metadata.uploader
      : ehImagem
        ? (item.metadata?.agente_nome as string) || 'Dispositivo Pessoal'
        : 'Canal não informado'
  const extensao = extrairExtensaoMedia(item)
  const urlApiThumbnail = item.uuid ? obterUrlThumbnailMediaItem(item.uuid) : undefined
  const urlThumbnail =
    (usarFallbackApi ? urlApiThumbnail : null) ||
    item.thumbnailUrl ||
    (typeof item.metadata?.thumbnail === 'string' ? item.metadata.thumbnail : undefined) ||
    (ehImagem ? obterUrlStreamMediaItem(item.uuid) : urlApiThumbnail)
  const temThumbnail = Boolean(urlThumbnail) && !erroImagem

  const handleErroImagem = () => {
    if (!usarFallbackApi && urlApiThumbnail && urlThumbnail !== urlApiThumbnail) {
      setUsarFallbackApi(true)
    } else {
      setErroImagem(true)
    }
  }
  const urlOriginal =
    typeof item.metadata?.url_original === 'string' ? item.metadata.url_original : undefined
  const dataString = typeof item.metadata?.data === 'string' ? item.metadata.data : undefined
  const dataMidia = formatarDataMidia(dataString, item.criadoEm)
  const horarioMidia = formatarHorarioMidia(item)
  const tamanhoNumero =
    typeof item.metadata?.tamanho_bytes === 'number' ? item.metadata.tamanho_bytes : undefined
  const tamanhoFormatado = formatarTamanhoBytes(tamanhoNumero)

  const plataformaInfo = urlOriginal ? identificarPlataforma(urlOriginal) : null
  const ehDuplicado = Boolean(item.isDuplicado || item.metadata?.duplicado)
  const enviadoGoogleFotos = Boolean(item.isEnviadoGoogleFotos || item.googlePhotosMediaId)
  const densidadeAlta = colunas >= 6

  const handleDownloadDirecto = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setBaixando(true)
      await baixarArquivoMidia(item.uuid, titulo, extensao)
    } finally {
      setBaixando(false)
    }
  }

  const renderIconePlataforma = () => {
    if (!plataformaInfo) return null
    if (plataformaInfo.id === 'youtube') return <Youtube size={12} />
    if (plataformaInfo.id === 'instagram') return <Instagram size={12} />
    if (plataformaInfo.id === 'twitter') return <Globe size={12} />
    return <Video size={12} />
  }

  if (variante === 'galeria') {
    return (
      <Card.Root
        position="relative"
        borderRadius="2xl"
        borderWidth={selecionado ? '2px' : '1px'}
        borderColor={selecionado ? 'cirqueira.brand.500' : 'border.subtle'}
        bg="cirqueira.grey.950"
        className="cv-auto"
        overflow="hidden"
        shadow={selecionado ? 'lg' : 'sm'}
        outline={selecionado ? '2px solid' : 'none'}
        outlineColor="cirqueira.brand.500"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box position="relative" aspectRatio="16/10" w="full" bg="cirqueira.grey.950" overflow="hidden">
          {temThumbnail ? (
            <img
              src={urlThumbnail}
              alt={titulo}
              referrerPolicy="no-referrer"
              onError={handleErroImagem}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              decoding="async"
              loading="lazy"
            />
          ) : (
            <VStack h="full" w="full" align="center" justify="center" gap={2} color="fg.subtle">
              <Video size={34} strokeWidth={1.5} />
            </VStack>
          )}

          <Box
            position="absolute"
            inset={0}
            bgGradient="to-t"
            gradientFrom="rgba(5, 7, 11, 0.96)"
            gradientVia="rgba(5, 7, 11, 0.45)"
            gradientTo="rgba(5, 7, 11, 0.55)"
            pointerEvents="none"
            zIndex={1}
          />

          <HStack position="absolute" top={2.5} left={2.5} zIndex={10} gap={1.5}>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect(item.uuid)
              }}
              bg={selecionado ? 'cirqueira.brand.500' : 'cirqueira.grey.950/80'}
              _hover={{ bg: selecionado ? 'cirqueira.brand.600' : 'cirqueira.grey.950' }}
              color="cirqueira.grey.0"
              borderRadius="lg"
              h={7}
              w={7}
              borderWidth="1px"
              borderColor={selecionado ? 'cirqueira.brand.400' : 'border.subtle'}
              aria-label={`Selecionar ${titulo}`}
            >
              {selecionado ? <Check size={14} strokeWidth={3} /> : <Square size={14} opacity={0.7} />}
            </IconButton>

            {plataformaInfo && (
              <Badge
                size="xs"
                variant="subtle"
                colorPalette={plataformaInfo.colorPalette}
                bg="cirqueira.grey.950/85"
                borderRadius="md"
                px={2}
                py={0.5}
              >
                <HStack gap={1}>
                  {renderIconePlataforma()}
                  <Text as="span">{plataformaInfo.nome}</Text>
                </HStack>
              </Badge>
            )}
          </HStack>

          <HStack position="absolute" top={2.5} right={2.5} zIndex={10} gap={1.5}>
            {duracaoFormatada && (
              <Box
                borderRadius="md"
                bg="cirqueira.grey.950/85"
                px={1.5}
                py={0.5}
                fontSize="11px"
                fontWeight="bold"
                fontFamily="mono"
                color="cirqueira.grey.0"
              >
                {duracaoFormatada}
              </Box>
            )}
            <Badge
              size="xs"
              variant="subtle"
              colorPalette={statusInfo.colorPalette}
              borderRadius="md"
              px={2}
              py={0.5}
            >
              {statusInfo.label}
            </Badge>
          </HStack>

          <VStack
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            p={3}
            gap={1.5}
            align="stretch"
            zIndex={10}
          >
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="white"
              lineClamp={1}
              title={titulo}
              cursor="pointer"
              _hover={{ color: 'cirqueira.brand.300' }}
              onClick={() => onVisualizar?.(item)}
            >
              {titulo}
            </Text>

            <Flex align="center" justify="space-between" gap={2}>
              <HStack gap={1.5} minW={0}>
                {item.categoria?.nome ? (
                  <Badge
                    size="xs"
                    variant="subtle"
                    colorPalette="brand"
                    borderRadius="md"
                    cursor="pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCategorizar?.(item)
                    }}
                  >
                    <Text as="span" maxW="24" truncate>
                      {item.categoria.nome}
                    </Text>
                  </Badge>
                ) : (
                  <Badge
                    size="xs"
                    variant="outline"
                    colorPalette="amber"
                    borderRadius="md"
                    cursor="pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCategorizar?.(item)
                    }}
                  >
                    Sem cat.
                  </Badge>
                )}

                <HStack
                  gap={1}
                  px={2}
                  py={0.5}
                  borderRadius="md"
                  bg="whiteAlpha.200"
                  color="whiteAlpha.900"
                  fontSize="10px"
                  cursor="pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditarMetadata?.(item, 'data')
                  }}
                  title="Clique para editar data e horário"
                >
                  <Calendar size={10} />
                  <Text as="span">
                    {dataMidia}, {horarioMidia}
                  </Text>
                </HStack>
              </HStack>

              <HStack gap={0.5} flexShrink={0}>
                <IconButton
                  size="2xs"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200', color: 'cirqueira.brand.300' }}
                  onClick={() => onVisualizar?.(item)}
                  aria-label="Assistir"
                  title="Assistir vídeo"
                >
                  <Play size={13} />
                </IconButton>
                <IconButton
                  size="2xs"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => onEditarMetadata?.(item)}
                  aria-label="Editar"
                  title="Editar metadados"
                >
                  <Edit3 size={13} />
                </IconButton>
                {onApagar && (
                  <IconButton
                    size="2xs"
                    variant="ghost"
                    color="cirqueira.red.400"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={() => onApagar?.(item.uuid)}
                    aria-label="Apagar"
                    title="Excluir vídeo"
                  >
                    <Trash2 size={13} />
                  </IconButton>
                )}
              </HStack>
            </Flex>
          </VStack>
        </Box>
      </Card.Root>
    )
  }

  if (variante === 'compacto') {
    return (
      <Card.Root
        position="relative"
        display="flex"
        flexDirection="row"
        alignItems="stretch"
        borderRadius="xl"
        borderWidth={selecionado ? '2px' : '1px'}
        borderColor={selecionado ? 'cirqueira.brand.500' : 'border.subtle'}
        bg="bg.panel"
        className="cv-auto"
        overflow="hidden"
        shadow={selecionado ? 'md' : 'xs'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        _hover={{
          borderColor: selecionado ? 'cirqueira.brand.500' : 'border.muted',
        }}
      >
        <Box
          position="relative"
          w={{ base: '125px', sm: '155px' }}
          minH="96px"
          flexShrink={0}
          bg="cirqueira.grey.950"
          overflow="hidden"
          cursor="pointer"
          onClick={() => onVisualizar?.(item)}
        >
          {temThumbnail ? (
            <img
              src={urlThumbnail}
              alt={titulo}
              referrerPolicy="no-referrer"
              onError={handleErroImagem}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              decoding="async"
              loading="lazy"
            />
          ) : (
            <VStack h="full" w="full" align="center" justify="center" color="fg.subtle">
              <Video size={26} strokeWidth={1.5} />
            </VStack>
          )}

          <Box position="absolute" top={1.5} left={1.5} zIndex={5}>
            <IconButton
              size="2xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect(item.uuid)
              }}
              bg={selecionado ? 'cirqueira.brand.500' : 'cirqueira.grey.950/80'}
              color="cirqueira.grey.0"
              borderRadius="md"
              h={6}
              w={6}
              aria-label={`Selecionar ${titulo}`}
            >
              {selecionado ? <Check size={12} strokeWidth={3} /> : <Square size={12} opacity={0.8} />}
            </IconButton>
          </Box>

          {duracaoFormatada && (
            <Box
              position="absolute"
              bottom={1.5}
              right={1.5}
              zIndex={5}
              borderRadius="sm"
              bg="cirqueira.grey.950/85"
              px={1.5}
              py={0.2}
              fontSize="10px"
              fontWeight="bold"
              fontFamily="mono"
              color="cirqueira.grey.0"
            >
              {duracaoFormatada}
            </Box>
          )}
        </Box>

        <Flex flex={1} direction="column" justify="space-between" p={3} gap={2} minW={0}>
          <Flex align="flex-start" justify="space-between" gap={2}>
            <VStack align="start" gap={0.5} minW={0} flex={1}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="fg"
                lineClamp={1}
                title={titulo}
                cursor="pointer"
                _hover={{ color: 'cirqueira.brand.400' }}
                onClick={() => onVisualizar?.(item)}
              >
                {titulo}
              </Text>
              <HStack gap={2} fontSize="11px" color="fg.subtle" minW={0} w="full">
                <HStack gap={1} truncate>
                  <User size={11} style={{ flexShrink: 0 }} />
                  <Text as="span" truncate>
                    {uploader}
                  </Text>
                </HStack>
                {plataformaInfo && (
                  <Badge size="xs" variant="subtle" colorPalette={plataformaInfo.colorPalette} borderRadius="sm">
                    {plataformaInfo.nome}
                  </Badge>
                )}
                {tamanhoFormatado && (
                  <Text as="span" flexShrink={0} fontSize="10px" color="fg.muted">
                    • {tamanhoFormatado}
                  </Text>
                )}
              </HStack>
            </VStack>

            <Badge
              size="xs"
              variant="subtle"
              colorPalette={statusInfo.colorPalette}
              borderRadius="md"
              flexShrink={0}
            >
              {statusInfo.label}
            </Badge>
          </Flex>

          <Flex align="center" justify="space-between" gap={2} flexWrap="wrap">
            <HStack gap={1.5} flexWrap="wrap">
              {item.categoria?.nome ? (
                <Badge
                  size="xs"
                  variant="subtle"
                  colorPalette="brand"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => onCategorizar?.(item)}
                >
                  <HStack gap={1}>
                    <Folder size={10} />
                    <Text as="span" maxW="24" truncate>
                      {item.categoria.nome}
                    </Text>
                  </HStack>
                </Badge>
              ) : (
                <Badge
                  size="xs"
                  variant="outline"
                  colorPalette="amber"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => onCategorizar?.(item)}
                >
                  <HStack gap={1}>
                    <FolderPlus size={10} />
                    <Text as="span">Sem cat.</Text>
                  </HStack>
                </Badge>
              )}

              <HStack
                gap={1.5}
                px={2}
                py={0.5}
                borderRadius="md"
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.muted"
                fontSize="11px"
                cursor="pointer"
                onClick={() => onEditarMetadata?.(item, 'data')}
                _hover={{ borderColor: 'cirqueira.brand.500/40' }}
                title="Clique para editar data e horário"
              >
                <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                  <Calendar size={11} />
                </Box>
                <Text as="span" fontWeight="medium" color="fg">
                  {dataMidia}, {horarioMidia}
                </Text>
              </HStack>
            </HStack>

            <HStack gap={0.5} flexShrink={0}>
              {(ehDuplicado || !enviadoGoogleFotos) && onForcarGoogleFotos && (
                <IconButton
                  size="2xs"
                  variant="ghost"
                  onClick={() => onForcarGoogleFotos?.(item)}
                  aria-label="Google Fotos"
                  title="Enviar para o Google Fotos"
                  color={ehDuplicado ? 'cirqueira.amber.500' : 'fg.subtle'}
                  borderRadius="md"
                >
                  <CloudUpload size={13} />
                </IconButton>
              )}
              <IconButton
                size="2xs"
                variant="ghost"
                onClick={handleDownloadDirecto}
                disabled={baixando || ehArquivoRemovido}
                aria-label="Baixar MP4"
                title="Baixar arquivo MP4"
                color={ehArquivoRemovido ? 'fg.subtle' : 'cirqueira.brand.500'}
                borderRadius="md"
              >
                {baixando ? (
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Download size={13} />
                )}
              </IconButton>
              {onEditarMetadata && (
                <IconButton
                  size="2xs"
                  variant="ghost"
                  onClick={() => onEditarMetadata?.(item)}
                  aria-label="Editar"
                  title="Editar metadados"
                  borderRadius="md"
                >
                  <Edit3 size={13} />
                </IconButton>
              )}
              {onCategorizar && (
                <IconButton
                  size="2xs"
                  variant="ghost"
                  onClick={() => onCategorizar?.(item)}
                  aria-label="Categorizar"
                  title="Atribuir categoria"
                  borderRadius="md"
                >
                  <FolderPlus size={13} />
                </IconButton>
              )}
              {onRebaixar && (
                <IconButton
                  size="2xs"
                  variant={ehArquivoRemovido ? 'subtle' : 'ghost'}
                  colorPalette={ehArquivoRemovido ? 'orange' : undefined}
                  onClick={() => onRebaixar?.(item.uuid)}
                  aria-label="Rebaixar"
                  title="Rebaixar vídeo"
                  borderRadius="md"
                >
                  <DownloadCloud size={13} />
                </IconButton>
              )}
              {onApagar && (
                <IconButton
                  size="2xs"
                  variant="ghost"
                  onClick={() => onApagar?.(item.uuid)}
                  aria-label="Apagar"
                  title="Excluir vídeo"
                  color="cirqueira.red.500"
                  borderRadius="md"
                >
                  <Trash2 size={13} />
                </IconButton>
              )}
            </HStack>
          </Flex>
        </Flex>
      </Card.Root>
    )
  }

  return (
    <Card.Root
      position="relative"
      display="flex"
      flexDirection="column"
      borderRadius="2xl"
      borderWidth={selecionado ? '2px' : '1px'}
      borderColor={selecionado ? 'cirqueira.brand.500' : 'border.subtle'}
      bg="bg.panel"
      className="cv-auto"
      overflow="hidden"
      shadow={selecionado ? 'lg' : 'sm'}
      outline={selecionado ? '2px solid' : 'none'}
      outlineColor="cirqueira.brand.500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      _hover={{
        borderColor: selecionado ? 'cirqueira.brand.500' : 'border.muted',
      }}
    >
      <Box position="relative" aspectRatio="16/9" w="full" bg="cirqueira.grey.950" overflow="hidden">
        {temThumbnail ? (
          <img
            src={urlThumbnail}
            alt={titulo}
            referrerPolicy="no-referrer"
            onError={handleErroImagem}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            decoding="async"
            loading="lazy"
          />
        ) : (
          <VStack h="full" w="full" align="center" justify="center" gap={2} color="fg.subtle">
            {ehImagem ? (
              <ImageIcon size={38} strokeWidth={1.5} />
            ) : (
              <Video size={38} strokeWidth={1.5} />
            )}
            <Text fontSize="xs" fontWeight="medium">
              {ehImagem ? 'Imagem' : 'Vídeo'}
            </Text>
          </VStack>
        )}

        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="40%"
          bgGradient="to-b"
          gradientFrom="cirqueira.grey.950/80"
          gradientTo="transparent"
          pointerEvents="none"
          zIndex={1}
        />
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="50%"
          bgGradient="to-t"
          gradientFrom="cirqueira.grey.950/85"
          gradientTo="transparent"
          pointerEvents="none"
          zIndex={1}
        />

        <Box
          position="absolute"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="cirqueira.grey.950/50"
          opacity={isHovered ? 1 : 0}
          cursor="pointer"
          onClick={() => onVisualizar?.(item)}
          transition="opacity 0.2s ease"
          zIndex={5}
        >
          <Box
            p={3.5}
            borderRadius="full"
            bg="cirqueira.brand.500"
            color="cirqueira.grey.0"
            shadow="lg"
            transform={isHovered ? 'scale(1.05)' : 'scale(0.9)'}
            _hover={{ transform: 'scale(1.15)', bg: 'cirqueira.brand.400' }}
            transition="all 0.15s ease"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
          </Box>
        </Box>

        <HStack position="absolute" top={2.5} left={2.5} zIndex={10} gap={1.5}>
          <IconButton
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect(item.uuid)
            }}
            bg={selecionado ? 'cirqueira.brand.500' : 'cirqueira.grey.950/80'}
            _hover={{ bg: selecionado ? 'cirqueira.brand.600' : 'cirqueira.grey.950' }}
            color="cirqueira.grey.0"
            borderRadius="lg"
            h={7}
            w={7}
            borderWidth="1px"
            borderColor={selecionado ? 'cirqueira.brand.400' : 'border.subtle'}
            aria-label={`Selecionar ${titulo}`}
          >
            {selecionado ? (
              <Check size={14} strokeWidth={3} />
            ) : (
              <Square size={14} opacity={0.7} />
            )}
          </IconButton>

          {plataformaInfo && (
            <Badge
              size="sm"
              variant="subtle"
              colorPalette={plataformaInfo.colorPalette}
              bg="cirqueira.grey.950/80"
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="lg"
              px={2}
              py={0.5}
              fontWeight="semibold"
            >
              <HStack gap={1} alignItems="center">
                {renderIconePlataforma()}
                <Text as="span">{plataformaInfo.nome}</Text>
              </HStack>
            </Badge>
          )}
        </HStack>

        <VStack position="absolute" top={2.5} right={2.5} zIndex={10} align="flex-end" gap={1}>
          <Badge
            size="sm"
            variant="subtle"
            colorPalette={statusInfo.colorPalette}
            borderRadius="lg"
            px={2.5}
            py={0.5}
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <HStack gap={1} alignItems="center">
              {statusInfo.animado ? (
                <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
              ) : item.status === 'erro' ? (
                <AlertCircle size={11} />
              ) : item.status === 'concluido' ? (
                <CheckCircle2 size={11} />
              ) : ehArquivoRemovido ? (
                <HardDrive size={11} />
              ) : (
                <Clock size={11} />
              )}
              <Text as="span">{statusInfo.label}</Text>
            </HStack>
          </Badge>

          {ehDuplicado && (
            <Badge
              size="xs"
              variant="subtle"
              colorPalette="amber"
              borderRadius="md"
              px={1.5}
              py={0.5}
              borderWidth="1px"
              borderColor="cirqueira.amber.500/40"
            >
              <HStack gap={1} alignItems="center">
                <AlertTriangle size={10} />
                <Text as="span">Duplicado</Text>
              </HStack>
            </Badge>
          )}
        </VStack>

        {urlOriginal && (
          <Link
            href={urlOriginal}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            position="absolute"
            bottom={2.5}
            left={2.5}
            zIndex={10}
            p={1.5}
            borderRadius="md"
            bg="cirqueira.grey.950/70"
            color="cirqueira.grey.0"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            title="Abrir no site de origem"
            _hover={{ bg: 'cirqueira.grey.950', color: 'cirqueira.brand.300' }}
          >
            <ExternalLink size={13} />
          </Link>
        )}

        {duracaoFormatada && (
          <Box
            position="absolute"
            bottom={2.5}
            right={2.5}
            zIndex={10}
            borderRadius="md"
            bg="cirqueira.grey.950/85"
            px={2}
            py={0.5}
            fontSize="xs"
            fontWeight="bold"
            fontFamily="mono"
            color="cirqueira.grey.0"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            {duracaoFormatada}
          </Box>
        )}
      </Box>

      <Card.Body display="flex" flex={1} flexDirection="column" p={densidadeAlta ? 3 : 4} gap={densidadeAlta ? 2 : 3}>
        <Text
          as="h3"
          fontWeight="bold"
          fontSize={densidadeAlta ? 'xs' : 'sm'}
          color="fg"
          lineClamp={2}
          title={titulo}
          cursor="pointer"
          transition="color 0.15s ease"
          _hover={{ color: 'cirqueira.brand.400' }}
          onClick={() => onVisualizar?.(item)}
          lineHeight="snug"
        >
          {titulo}
        </Text>

        <Flex align="center" justify="space-between" gap={2} fontSize="xs" color="fg.subtle">
          <HStack gap={1.5} truncate flex={1}>
            <User size={13} style={{ flexShrink: 0 }} />
            <Text as="span" truncate title={uploader}>
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
                px={1.5}
              >
                {extensao}
              </Badge>
              {tamanhoFormatado && (
                <HStack gap={1} fontSize="11px" color="fg.subtle">
                  <HardDrive size={11} />
                  <Text as="span">{tamanhoFormatado}</Text>
                </HStack>
              )}
            </HStack>
          )}
        </Flex>

        <Flex align="center" justify="space-between" gap={2} fontSize="11px" color="fg.subtle">
          <Box flexShrink={0}>
            {item.categoria?.nome ? (
              <Badge
                size="xs"
                variant="subtle"
                colorPalette="brand"
                borderRadius="md"
                cursor={onCategorizar ? 'pointer' : 'default'}
                onClick={(e) => {
                  e.stopPropagation()
                  onCategorizar?.(item)
                }}
                _hover={onCategorizar ? { opacity: 0.8 } : undefined}
                title="Clique para alterar a categoria"
              >
                <HStack gap={1} alignItems="center">
                  <Folder size={11} />
                  <Text as="span" maxW="28" truncate>
                    {item.categoria?.nome}
                  </Text>
                </HStack>
              </Badge>
            ) : (
              <Badge
                size="xs"
                variant="outline"
                colorPalette="amber"
                borderRadius="md"
                cursor={onCategorizar ? 'pointer' : 'default'}
                onClick={(e) => {
                  e.stopPropagation()
                  onCategorizar?.(item)
                }}
                _hover={onCategorizar ? { bg: 'cirqueira.amber.500/10' } : undefined}
                title="Clique para definir uma categoria"
              >
                <HStack gap={1} alignItems="center">
                  <FolderPlus size={11} />
                  <Text as="span">Sem categoria</Text>
                </HStack>
              </Badge>
            )}
          </Box>

          <HStack gap={1} color="fg.muted" fontSize="10px">
            <Clock size={11} />
            <Text as="span">Baixado {tempoRelativoNativo(item.criadoEm)}</Text>
          </HStack>
        </Flex>

        <Box
          w="full"
          px={3}
          py={1.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.muted"
          transition="all 0.15s ease"
          _hover={{
            borderColor: 'cirqueira.brand.500/40',
            bg: 'bg.subtle',
          }}
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation()
            onEditarMetadata?.(item, 'data')
          }}
          title="Clique para editar a data e horário"
        >
          <HStack justify="space-between" align="center" w="full">
            <HStack gap={2}>
              <Box color="cirqueira.brand.400" display="inline-flex">
                <Calendar size={13} />
              </Box>
              <Text fontSize="xs" fontWeight="medium" color="fg">
                {dataMidia}, {horarioMidia}
              </Text>
            </HStack>

            <HStack gap={1} color="fg.subtle" fontSize="10px" fontWeight="semibold">
              <Edit3 size={11} />
              <Text as="span">Editar</Text>
            </HStack>
          </HStack>
        </Box>

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
          pt={2.5}
          mt="auto"
          borderTopWidth="1px"
          borderColor="border.subtle"
        >
          <HStack gap={2} minW={0}>
            <Text as="span" fontSize="10px" fontFamily="mono" color="fg.subtle">
              #{item.hash.slice(0, 6)}
            </Text>

            {enviadoGoogleFotos && (
              <Badge
                size="xs"
                variant="subtle"
                colorPalette="green"
                px={1.5}
                py={0.2}
                borderRadius="md"
                title="Sincronizado no Google Fotos"
              >
                <HStack gap={1} alignItems="center">
                  <Cloud size={10} />
                  <Text as="span" fontSize="9px">
                    Fotos
                  </Text>
                </HStack>
              </Badge>
            )}
          </HStack>

          <HStack gap={1} flexShrink={0}>
            {(ehDuplicado || !enviadoGoogleFotos) && onForcarGoogleFotos && (
              <IconButton
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onForcarGoogleFotos?.(item)
                }}
                aria-label="Sincronizar com Google Fotos"
                title={
                  ehDuplicado
                    ? 'Mídia duplicada: Forçar envio para o Google Fotos'
                    : 'Enviar para o Google Fotos'
                }
                color={ehDuplicado ? 'cirqueira.amber.500' : 'fg.subtle'}
                _hover={{ bg: 'bg.muted', color: 'fg' }}
                borderRadius="lg"
              >
                <CloudUpload size={14} />
              </IconButton>
            )}

            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleDownloadDirecto}
              disabled={baixando || ehArquivoRemovido}
              aria-label={ehArquivoRemovido ? 'Arquivo removido do sistema' : 'Baixar arquivo MP4'}
              title={
                ehArquivoRemovido
                  ? 'Arquivo de vídeo removido do sistema para liberar espaço. Clique no botão ao lado para Rebaixar.'
                  : 'Baixar arquivo MP4'
              }
              color={ehArquivoRemovido ? 'fg.subtle' : 'cirqueira.brand.500'}
              _hover={ehArquivoRemovido ? undefined : { bg: 'cirqueira.brand.500/10' }}
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
                onClick={() => onEditarMetadata?.(item)}
                aria-label="Editar metadados"
                title="Editar título, data e metadados"
                borderRadius="lg"
              >
                <Edit3 size={14} />
              </IconButton>
            )}

            {onCategorizar && (
              <IconButton
                size="xs"
                variant="ghost"
                onClick={() => onCategorizar?.(item)}
                aria-label="Categorizar vídeo"
                title="Atribuir categoria"
                borderRadius="lg"
              >
                <FolderPlus size={14} />
              </IconButton>
            )}

            {onRebaixar && (
              <IconButton
                size="xs"
                variant={ehArquivoRemovido ? 'subtle' : 'ghost'}
                colorPalette={ehArquivoRemovido ? 'orange' : undefined}
                color={ehArquivoRemovido ? 'cirqueira.amber.400' : undefined}
                onClick={() => onRebaixar?.(item.uuid)}
                aria-label="Baixar novamente"
                title={
                  ehArquivoRemovido
                    ? 'Rebaixar vídeo (Arquivo Removido: baixar novamente preservando datas e metadados)'
                    : 'Rebaixar vídeo'
                }
                borderRadius="lg"
              >
                <DownloadCloud size={14} />
              </IconButton>
            )}

            {item.status === 'erro' && onRetentar && (
              <IconButton
                size="xs"
                variant="ghost"
                onClick={() => onRetentar?.(item.uuid)}
                aria-label="Retentar processamento"
                title="Retentar download"
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
                onClick={() => onApagar?.(item.uuid)}
                aria-label="Apagar vídeo"
                title="Excluir vídeo"
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
