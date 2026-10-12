import type { MediaItem } from '@/features/downloads-video/types'
import { obterUrlStreamMediaItem } from '@/features/downloads-video/api'
import { formatarDataMidia, formatarHorarioMidia } from '@/features/downloads-video/utils/formatadores'
import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  NativeSelect,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertTriangle,
  CheckSquare,
  CloudUpload,
  Eye,
  FileImage,
  FileVideo,
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

export interface TabelaTriagemUploadProps {
  itens: MediaItem[]
  categorias: Array<{ uuid: string; nome: string }>
  selecionados: string[]
  onToggleSelect: (uuid: string) => void
  onToggleSelectAll: () => void
  onClassificar: (uuid: string, categoriaId: string) => void
  onVisualizar: (item: MediaItem) => void
  onForcarGoogleFotos?: (item: MediaItem) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
}

export const TabelaTriagemUpload = memo(function TabelaTriagemUpload({
  itens,
  categorias,
  selecionados,
  onToggleSelect,
  onToggleSelectAll,
  onClassificar,
  onVisualizar,
  onForcarGoogleFotos,
  onRetentar,
  onApagar,
}: TabelaTriagemUploadProps) {
  const todosSelecionados = itens.length > 0 && selecionados.length === itens.length

  return (
    <Box
      w="full"
      overflowX="auto"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
    >
      <Table.Root size="sm" variant="outline">
        <Table.Header bg="bg.muted">
          <Table.Row>
            <Table.ColumnHeader w="44px" textAlign="center">
              <Button
                size="xs"
                variant="ghost"
                onClick={onToggleSelectAll}
                aria-label="Selecionar todos"
                p={1}
                minW="auto"
                h="auto"
              >
                {todosSelecionados ? (
                  <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                    <CheckSquare size={16} />
                  </Box>
                ) : (
                  <Square size={16} />
                )}
              </Button>
            </Table.ColumnHeader>

            <Table.ColumnHeader w="64px">Prévia</Table.ColumnHeader>
            <Table.ColumnHeader minW="220px">Arquivo / Hash</Table.ColumnHeader>
            <Table.ColumnHeader w="110px">Tipo</Table.ColumnHeader>
            <Table.ColumnHeader w="100px">Tamanho</Table.ColumnHeader>
            <Table.ColumnHeader minW="180px">Categoria</Table.ColumnHeader>
            <Table.ColumnHeader w="150px">Data / Hora</Table.ColumnHeader>
            <Table.ColumnHeader w="130px" textAlign="right">
              Ações
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {itens.map((item) => {
            const isSelected = selecionados.includes(item.uuid)
            const tipoInfo = identificarTipoMidia(item)
            const nomeExibicao = extrairNomeExibicao(item)
            const hashCurto = extrairHashCurto(item.hash)
            const streamUrl = obterUrlStreamMediaItem(item.uuid)
            const previewImg =
              item.thumbnailUrl ||
              item.metadata?.thumbnail ||
              (!tipoInfo.isVideo ? streamUrl : undefined)
            const dataFormatada = formatarDataMidia(item.metadata?.data, item.criadoEm)
            const horarioFormatado = formatarHorarioMidia(item)
            const ehDuplicado = Boolean(item.isDuplicado || item.metadata?.duplicado)

            return (
              <Table.Row
                key={item.uuid}
                bg={isSelected ? 'cirqueira.brand.500/5' : undefined}
                _hover={{ bg: isSelected ? 'cirqueira.brand.500/10' : 'bg.muted' }}
                transition="background-color 0.15s"
              >
                {/* Checkbox */}
                <Table.Cell textAlign="center">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => onToggleSelect(item.uuid)}
                    aria-label="Selecionar"
                    p={1}
                    minW="auto"
                    h="auto"
                    color={isSelected ? 'cirqueira.brand.400' : 'fg.subtle'}
                  >
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </Button>
                </Table.Cell>

                {/* Miniatura com clique para prévia */}
                <Table.Cell>
                  <Box
                    w={11}
                    h={11}
                    borderRadius="lg"
                    bg="bg.muted"
                    overflow="hidden"
                    cursor="pointer"
                    onClick={() => onVisualizar(item)}
                    borderWidth="1px"
                    borderColor="border.subtle"
                    position="relative"
                    role="group"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {previewImg ? (
                      <img
                        src={String(previewImg)}
                        alt={nomeExibicao}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : tipoInfo.isVideo ? (
                      <FileVideo size={20} color="var(--chakra-colors-cirqueira-purple-400, #c084fc)" />
                    ) : (
                      <FileImage size={20} color="var(--chakra-colors-cirqueira-brand-400, #4ade80)" />
                    )}

                    <Box
                      position="absolute"
                      inset={0}
                      bg="cirqueira.grey.950/40"
                      opacity={0}
                      _groupHover={{ opacity: 1 }}
                      transition="opacity 0.2s"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="cirqueira.grey.0"
                    >
                      {tipoInfo.isVideo ? <Play size={14} fill="currentColor" /> : <Eye size={14} />}
                    </Box>
                  </Box>
                </Table.Cell>

                {/* Nome e Hash */}
                <Table.Cell>
                  <VStack align="start" gap={0.5} maxW="320px">
                    <Text
                      fontWeight="semibold"
                      fontSize="xs"
                      color="fg"
                      truncate
                      w="full"
                      title={nomeExibicao}
                      cursor="pointer"
                      onClick={() => onVisualizar(item)}
                      _hover={{ color: 'cirqueira.brand.400' }}
                    >
                      {nomeExibicao}
                    </Text>
                    <HStack gap={1.5} fontSize="11px" color="fg.subtle">
                      <Text as="span" fontFamily="mono" fontSize="10px">
                        #{hashCurto}
                      </Text>
                      {ehDuplicado && (
                        <Badge size="xs" variant="subtle" colorPalette="amber" borderRadius="md">
                          <HStack gap={1}>
                            <AlertTriangle size={10} />
                            <Text as="span">Duplicado</Text>
                          </HStack>
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                </Table.Cell>

                {/* Tipo de Mídia */}
                <Table.Cell>
                  <Badge
                    size="xs"
                    variant="subtle"
                    colorPalette={tipoInfo.isVideo ? 'purple' : 'brand'}
                    borderRadius="md"
                    px={2}
                  >
                    <HStack gap={1}>
                      {tipoInfo.isVideo ? <FileVideo size={11} /> : <FileImage size={11} />}
                      <Text as="span">{tipoInfo.label}</Text>
                    </HStack>
                  </Badge>
                </Table.Cell>

                {/* Tamanho */}
                <Table.Cell fontSize="xs" color="fg.subtle">
                  {formatarTamanhoBytes(item.tamanhoBytes ?? 0)}
                </Table.Cell>

                {/* Seletor Inline de Categoria */}
                <Table.Cell>
                  <NativeSelect.Root size="xs" w="44">
                    <NativeSelect.Field
                      value={item.categoriaId ?? ''}
                      onChange={(e) => onClassificar(item.uuid, e.target.value)}
                      bg="bg.muted"
                      borderColor="border.subtle"
                      borderRadius="md"
                      fontSize="11px"
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
                </Table.Cell>

                {/* Data e Hora */}
                <Table.Cell fontSize="11px" color="fg.subtle">
                  <Text as="div">{dataFormatada}</Text>
                  <Text as="div" fontSize="10px" color="fg.muted">{horarioFormatado}</Text>
                </Table.Cell>

                {/* Ações */}
                <Table.Cell textAlign="right">
                  <HStack gap={1} justify="flex-end">
                    {ehDuplicado && onForcarGoogleFotos && (
                      <IconButton
                        size="xs"
                        variant="subtle"
                        colorPalette="amber"
                        onClick={() => onForcarGoogleFotos(item)}
                        aria-label="Forçar Google Fotos"
                        title="Forçar envio para Google Fotos"
                        borderRadius="md"
                      >
                        <CloudUpload size={13} />
                      </IconButton>
                    )}

                    {item.status === 'erro' && onRetentar && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={() => onRetentar(item.uuid)}
                        aria-label="Retentar"
                        borderRadius="md"
                      >
                        <RefreshCw size={13} />
                      </IconButton>
                    )}

                    <IconButton
                      size="xs"
                      variant="ghost"
                      onClick={() => onVisualizar(item)}
                      aria-label="Visualizar"
                      borderRadius="md"
                    >
                      <Eye size={13} />
                    </IconButton>

                    {onApagar && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={() => onApagar(item.uuid)}
                        aria-label="Apagar"
                        color="fg.subtle"
                        _hover={{ color: 'cirqueira.red.500', bg: 'cirqueira.red.500/10' }}
                        borderRadius="md"
                      >
                        <Trash2 size={13} />
                      </IconButton>
                    )}
                  </HStack>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  )
})
