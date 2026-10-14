import type { MediaItem } from '@/features/downloads-video/types'
import { obterUrlStreamMediaItem } from '@/features/downloads-video/api'
import { formatarDataMidia, formatarHorarioMidia } from '@/features/downloads-video/utils/formatadores'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  HStack,
  IconButton,
  NativeSelect,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  CloudUpload,
  Eye,
  FileImage,
  FileVideo,
  FolderPlus,
  Play,
  RefreshCw,
  Square,
  Trash2,
} from 'lucide-react'
import { memo } from 'react'
import {
  extrairHashCurto,
  extrairNomeExibicao,
  formatarTamanhoBytes,
  identificarTipoMidia,
} from '../utils/arquivosUpload'

export interface CardItemTriagemProps {
  item: MediaItem
  categorias: Array<{ uuid: string; nome: string }>
  selecionado: boolean
  onToggleSelect: (uuid: string) => void
  onClassificar: (uuid: string, categoriaId: string) => void
  onVisualizar: (item: MediaItem) => void
  onForcarGoogleFotos?: (item: MediaItem) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
}

export const CardItemTriagem = memo(function CardItemTriagem({
  item,
  categorias,
  selecionado,
  onToggleSelect,
  onClassificar,
  onVisualizar,
  onForcarGoogleFotos,
  onRetentar,
  onApagar,
}: CardItemTriagemProps) {
  const tipoInfo = identificarTipoMidia(item)
  const nomeExibicao = extrairNomeExibicao(item)
  const hashCurto = extrairHashCurto(item.hash)
  const streamUrl = obterUrlStreamMediaItem(item.uuid)
  const previewImg = item.thumbnailUrl || item.metadata?.thumbnail || (!tipoInfo.isVideo ? streamUrl : undefined)
  const dataFormatada = formatarDataMidia(item.metadata?.data, item.criadoEm)
  const horarioFormatado = formatarHorarioMidia(item)
  const ehDuplicado = Boolean(item.isDuplicado || item.metadata?.duplicado)

  return (
    <Card.Root
      borderRadius="xl"
      borderWidth="1px"
      borderColor={selecionado ? 'cirqueira.brand.500' : 'border.subtle'}
      outline={selecionado ? '2px solid' : 'none'}
      outlineColor="cirqueira.brand.500"
      className="cv-auto"
      bg="bg.panel"
      overflow="hidden"
      shadow={selecionado ? 'md' : 'none'}
      _hover={{
        borderColor: selecionado ? 'cirqueira.brand.500' : 'cirqueira.brand.500/50',
      }}
      display="flex"
      flexDirection="column"
    >
      <Box
        position="relative"
        w="full"
        aspectRatio="16/9"
        bg="bg.muted"
        overflow="hidden"
        cursor="pointer"
        onClick={() => onVisualizar(item)}
        role="group"
      >
        {previewImg ? (
          <img
            src={String(previewImg)}
            alt={nomeExibicao}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            loading="lazy"
            className="group-hover-zoom"
          />
        ) : (
          <VStack h="full" w="full" align="center" justify="center" color="fg.subtle">
            {tipoInfo.isVideo ? (
              <FileVideo size={36} color="currentColor" />
            ) : (
              <FileImage size={36} color="currentColor" />
            )}
          </VStack>
        )}

        <Box
          position="absolute"
          top={2}
          left={2}
          zIndex={10}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(item.uuid)
          }}
        >
          <Button
            size="xs"
            variant="ghost"
            bg="cirqueira.grey.950/80"
            color={selecionado ? 'cirqueira.brand.400' : 'fg'}
            _hover={{ bg: 'cirqueira.grey.950' }}
            borderRadius="md"
            p={1}
            minW="auto"
            h="auto"
            aria-label="Selecionar mídia"
          >
            {selecionado ? <CheckSquare size={16} /> : <Square size={16} />}
          </Button>
        </Box>

        <HStack position="absolute" top={2} right={2} zIndex={10} gap={1.5}>
          {ehDuplicado && (
            <Badge
              size="xs"
              variant="subtle"
              colorPalette="amber"
              borderRadius="md"
              px={1.5}
            >
              <HStack gap={1}>
                <AlertTriangle size={10} />
                <Text as="span">Duplicado</Text>
              </HStack>
            </Badge>
          )}

          <Badge
            size="xs"
            variant="subtle"
            colorPalette={tipoInfo.isVideo ? 'purple' : 'brand'}
            borderRadius="md"
            px={2}
          >
            {tipoInfo.isVideo ? 'Vídeo' : 'Foto'}
          </Badge>
        </HStack>

        <Flex
          position="absolute"
          inset={0}
          bg="cirqueira.grey.950/40"
          opacity={0}
          _groupHover={{ opacity: 1 }}
          transition="opacity 0.2s"
          align="center"
          justify="center"
          pointerEvents="none"
        >
          <Box
            p={3}
            borderRadius="full"
            bg="cirqueira.grey.950/80"
            color="cirqueira.brand.400"
            shadow="lg"
            borderWidth="1px"
            borderColor="cirqueira.brand.500/30"
          >
            {tipoInfo.isVideo ? <Play size={20} fill="currentColor" /> : <Eye size={20} />}
          </Box>
        </Flex>

        <Box
          position="absolute"
          bottom={2}
          right={2}
          zIndex={5}
          bg="cirqueira.grey.950/85"
          color="cirqueira.grey.0"
          px={1.5}
          py={0.5}
          borderRadius="md"
          fontSize="10px"
          fontWeight="semibold"
        >
          {formatarTamanhoBytes(item.tamanhoBytes ?? 0)}
        </Box>
      </Box>

      <Card.Body p={3.5} display="flex" flexDirection="column" gap={3} flex={1}>
        <VStack align="start" gap={0.5} w="full">
          <Text
            fontWeight="bold"
            fontSize="xs"
            color="fg"
            truncate
            w="full"
            title={nomeExibicao}
          >
            {nomeExibicao}
          </Text>

          <HStack justify="space-between" w="full" fontSize="11px" color="fg.subtle">
            <HStack gap={1}>
              <Calendar size={11} />
              <Text as="span">{dataFormatada} às {horarioFormatado}</Text>
            </HStack>
            <Text as="span" fontFamily="mono" fontSize="10px">
              #{hashCurto}
            </Text>
          </HStack>
        </VStack>

        <VStack align="start" gap={1} w="full" pt={1} borderTopWidth="1px" borderColor="border.subtle">
          <HStack justify="space-between" w="full">
            <HStack gap={1} fontSize="11px" fontWeight="semibold" color="fg.subtle">
              <FolderPlus size={12} />
              <Text as="span">Categoria:</Text>
            </HStack>
            {item.categoria ? (
              <Badge size="xs" variant="subtle" colorPalette="brand" borderRadius="md">
                {item.categoria.nome}
              </Badge>
            ) : (
              <Badge size="xs" variant="subtle" colorPalette="amber" borderRadius="md">
                Sem Categoria
              </Badge>
            )}
          </HStack>

          <NativeSelect.Root size="xs" w="full">
            <NativeSelect.Field
              value={item.categoriaId ?? ''}
              onChange={(e) => onClassificar(item.uuid, e.target.value)}
              bg="bg.muted"
              borderColor="border.subtle"
              borderRadius="lg"
              fontSize="11px"
              h={7}
            >
              <option value="">Atribuir categoria...</option>
              {categorias.map((cat) => (
                <option key={cat.uuid} value={cat.uuid}>
                  {cat.nome}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </VStack>
      </Card.Body>

      <Flex
        px={3.5}
        py={2}
        bg="bg.muted"
        borderTopWidth="1px"
        borderColor="border.subtle"
        align="center"
        justify="space-between"
      >
        <Text fontSize="11px" color="fg.subtle" fontWeight="medium">
          {item.statusDescricao ?? item.status}
        </Text>

        <HStack gap={1.5}>
          {ehDuplicado && onForcarGoogleFotos && (
            <Button
              size="xs"
              variant="subtle"
              colorPalette="amber"
              onClick={() => onForcarGoogleFotos(item)}
              fontSize="10px"
              fontWeight="semibold"
              px={2}
              h={6}
              borderRadius="md"
              title="Sincronizar com Google Fotos mesmo sendo duplicado"
            >
              <CloudUpload size={12} style={{ marginRight: '4px' }} />
              <Text as="span">Forçar Fotos</Text>
            </Button>
          )}

          {item.status === 'erro' && onRetentar && (
            <IconButton
              size="xs"
              variant="ghost"
              onClick={() => onRetentar(item.uuid)}
              aria-label="Retentar"
              h={6}
              w={6}
              borderRadius="md"
            >
              <RefreshCw size={12} />
            </IconButton>
          )}

          {onApagar && (
            <IconButton
              size="xs"
              variant="ghost"
              onClick={() => onApagar(item.uuid)}
              aria-label="Apagar mídia"
              color="fg.subtle"
              _hover={{ color: 'cirqueira.red.500', bg: 'cirqueira.red.500/10' }}
              h={6}
              w={6}
              borderRadius="md"
            >
              <Trash2 size={12} />
            </IconButton>
          )}
        </HStack>
      </Flex>
    </Card.Root>
  )
})
