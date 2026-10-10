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
import type { MediaItem, StatusMediaItem } from '../types'

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

function formatarDataMidia(valorData?: string, fallbackIso?: string): string {
  const candidato = valorData || fallbackIso
  if (!candidato) return 'Data não inf.'

  if (/^\d{8}$/.test(candidato)) {
    const ano = candidato.substring(0, 4)
    const mes = candidato.substring(4, 6)
    const dia = candidato.substring(6, 8)
    return `${dia}/${mes}/${ano}`
  }

  const dataApenas = candidato.split(/[T ]/)[0] ?? ''
  if (dataApenas.includes('-')) {
    const partes = dataApenas.split('-')
    if (partes.length === 3 && partes[0] && partes[1] && partes[2]) {
      const [ano, mes, dia] = partes
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
    }
  }

  try {
    const parsed = new Date(candidato)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR')
    }
  } catch {}

  return 'Data não inf.'
}

function formatarHorarioMidia(item: MediaItem): string {
  if (item.metadata?.horario && typeof item.metadata.horario === 'string') {
    const limpo = item.metadata.horario.trim()
    const partes = limpo.split(':')
    const h = partes[0]
    const m = partes[1]
    if (h !== undefined && m !== undefined) {
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
    }
  }

  const valorData = item.metadata?.data
  if (valorData && typeof valorData === 'string') {
    const partesEspaco = valorData.split(/[T ]/)
    const horaRaw = partesEspaco[1]
    if (horaRaw) {
      const partesHora = horaRaw.split(':')
      const hh = partesHora[0]
      const mm = partesHora[1]
      if (hh !== undefined && mm !== undefined) {
        return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
      }
    }
  }

  if (item.criadoEm) {
    try {
      const dataCriacao = new Date(item.criadoEm)
      if (!Number.isNaN(dataCriacao.getTime())) {
        return dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    } catch {}
  }

  return '--:--'
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

function formatarTamanhoBytes(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

function obterStatusConfig(status: StatusMediaItem) {
  switch (status) {
    case 'baixando':
      return { label: 'Baixando', colorPalette: 'amber', animado: true }
    case 'recebido':
      return { label: 'Recebido', colorPalette: 'gray', animado: false }
    case 'em_fila':
      return { label: 'Em Fila', colorPalette: 'blue', animado: false }
    case 'sem_categoria':
      return { label: 'Sem Categoria', colorPalette: 'gray', animado: false }
    case 'classificado':
      return { label: 'Classificado', colorPalette: 'purple', animado: false }
    case 'distribuindo':
      return { label: 'Distribuindo', colorPalette: 'cyan', animado: true }
    case 'distribuido_local':
      return { label: 'Distribuído', colorPalette: 'teal', animado: false }
    case 'enviando_google_fotos':
      return { label: 'Google Fotos', colorPalette: 'purple', animado: true }
    case 'concluido':
      return { label: 'Concluído', colorPalette: 'green', animado: false }
    case 'erro':
      return { label: 'Erro', colorPalette: 'red', animado: false }
    default:
      return { label: status, colorPalette: 'gray', animado: false }
  }
}

export const TabelaVideos = memo(function TabelaVideos({
  itens,
  carregando = false,
  selecionados,
  onToggleSelect,
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
                <Text as="span" srOnly>
                  Seleção
                </Text>
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
