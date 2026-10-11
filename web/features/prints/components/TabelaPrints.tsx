import { addToast } from '@/shared/components/ui/toaster'
import { Badge, Box, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  Calendar,
  CheckSquare,
  Clock,
  Copy,
  Download,
  Eye,
  Folder,
  FolderPlus,
  HardDrive,
  Image as ImageIcon,
  Laptop,
  Square,
  Trash2,
} from 'lucide-react'
import { memo, useState } from 'react'
import { baixarArquivoPrint, copiarPrintParaClipboard, obterUrlStreamPrint } from '../api'
import type { MediaItem } from '../types'

export interface TabelaPrintsProps {
  itens: MediaItem[]
  carregando?: boolean
  selecionados: string[]
  onToggleSelect: (uuid: string) => void
  onToggleSelectAll?: () => void
  onVisualizar: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onApagar?: (uuid: string) => void
}

export const TabelaPrints = memo(function TabelaPrints({
  itens,
  carregando = false,
  selecionados,
  onToggleSelect,
  onToggleSelectAll,
  onVisualizar,
  onCategorizar,
  onApagar,
}: TabelaPrintsProps) {
  const [baixandoUuid, setBaixandoUuid] = useState<string | null>(null)

  const handleDownload = async (uuid: string, titulo: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setBaixandoUuid(uuid)
      await baixarArquivoPrint(uuid, titulo)
    } finally {
      setBaixandoUuid(null)
    }
  }

  const handleCopiar = async (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const copiado = await copiarPrintParaClipboard(uuid)
    if (copiado) {
      addToast({ title: 'Print copiado para área de transferência!', color: 'success' })
    } else {
      addToast({ title: 'Não foi possível copiar imagem diretamente.', color: 'warning' })
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
        borderColor="border.subtle"
        bg="bg.panel"
      >
        <ImageIcon size={32} color="var(--chakra-colors-fg-subtle)" />
        <Text fontSize="sm" fontWeight="bold" color="fg">
          Nenhum print encontrado
        </Text>
      </VStack>
    )
  }

  const todosSelecionados = itens.length > 0 && itens.every((it) => selecionados.includes(it.uuid))

  return (
    <Box
      w="full"
      overflowX="auto"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
    >
      <Box as="table" w="full" fontSize="sm" borderCollapse="collapse">
        <Box as="thead" bg="bg.muted/60" borderBottomWidth="1px" borderColor="border.subtle">
          <Box as="tr">
            <Box as="th" p={3.5} w="44px" textAlign="center">
              {onToggleSelectAll && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  onClick={onToggleSelectAll}
                  aria-label="Selecionar todos os prints"
                  borderRadius="lg"
                >
                  {todosSelecionados ? (
                    <Box as="span" color="cirqueira.brand.500" display="inline-flex">
                      <CheckSquare size={16} color="currentColor" />
                    </Box>
                  ) : (
                    <Square size={16} />
                  )}
                </IconButton>
              )}
            </Box>
            <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle" textAlign="left">
              Captura
            </Box>
            <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle" textAlign="left">
              Origem / Dispositivo
            </Box>
            <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle" textAlign="left">
              Tamanho
            </Box>
            <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle" textAlign="left">
              Data & Hora
            </Box>
            <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle" textAlign="left">
              Categoria
            </Box>
            <Box as="th" p={3.5} fontSize="xs" fontWeight="bold" color="fg.subtle" textAlign="right">
              Ações
            </Box>
          </Box>
        </Box>
        <Box as="tbody">
          {itens.map((item) => {
            const selecionado = selecionados.includes(item.uuid)
            const titulo =
              typeof item.metadata?.nome_original === 'string' && item.metadata.nome_original
                ? item.metadata.nome_original
                : typeof item.metadata?.titulo === 'string' && item.metadata.titulo
                  ? item.metadata.titulo
                  : `Print ${item.hash.slice(0, 10)}`
            const agenteNome = (item.metadata?.agente_nome as string) || 'Agente Local'
            const tamanhoBytes = (item.metadata?.tamanho_bytes as number) || 0
            const tamanhoFormatado =
              tamanhoBytes > 0
                ? tamanhoBytes < 1024 * 1024
                  ? `${(tamanhoBytes / 1024).toFixed(0)} KB`
                  : `${(tamanhoBytes / (1024 * 1024)).toFixed(1)} MB`
                : 'PNG'
            const dataHora = item.criadoEm
              ? new Date(item.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '--:--'
            const dataDia = item.criadoEm
              ? new Date(item.criadoEm).toLocaleDateString('pt-BR')
              : 'Hoje'
            const streamUrl = obterUrlStreamPrint(item.uuid)

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
                      w="72px"
                      h="48px"
                      borderRadius="md"
                      bg="blackAlpha.900"
                      overflow="hidden"
                      flexShrink={0}
                      cursor="pointer"
                      onClick={() => onVisualizar(item)}
                    >
                      <img
                        src={streamUrl}
                        alt={titulo}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        loading="lazy"
                      />
                    </Box>

                    <VStack align="start" gap={0.5} minW={0}>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="fg"
                        truncate
                        maxW="260px"
                        cursor="pointer"
                        title={titulo}
                        onClick={() => onVisualizar(item)}
                        _hover={{ color: 'cirqueira.brand.400' }}
                      >
                        {titulo}
                      </Text>
                      <Badge size="xs" variant="outline" colorPalette="gray" borderRadius="md">
                        PNG
                      </Badge>
                    </VStack>
                  </HStack>
                </Box>

                <Box as="td" p={3.5} verticalAlign="middle">
                  <HStack gap={1.5} fontSize="xs" color="fg.subtle">
                    <Laptop size={13} color="var(--chakra-colors-cirqueira-brand-400)" />
                    <Text as="span">{agenteNome}</Text>
                  </HStack>
                </Box>

                <Box as="td" p={3.5} verticalAlign="middle">
                  <HStack gap={1.5} fontSize="xs" color="fg.subtle">
                    <HardDrive size={13} />
                    <Text as="span">{tamanhoFormatado}</Text>
                  </HStack>
                </Box>

                <Box as="td" p={3.5} verticalAlign="middle">
                  <VStack align="start" gap={0} fontSize="xs" color="fg.subtle">
                    <HStack gap={1}>
                      <Calendar size={11} />
                      <Text as="span">{dataDia}</Text>
                    </HStack>
                    <HStack gap={1} color="fg.muted">
                      <Clock size={11} />
                      <Text as="span">{dataHora}</Text>
                    </HStack>
                  </VStack>
                </Box>

                <Box as="td" p={3.5} verticalAlign="middle">
                  {item.categoria?.nome ? (
                    <Badge size="xs" variant="subtle" colorPalette="brand" borderRadius="md">
                      <HStack gap={1}>
                        <Folder size={11} />
                        <Text as="span" maxW="28" truncate>
                          {item.categoria.nome}
                        </Text>
                      </HStack>
                    </Badge>
                  ) : (
                    <Badge size="xs" variant="subtle" colorPalette="gray" borderRadius="md">
                      Print Pessoal
                    </Badge>
                  )}
                </Box>

                <Box as="td" p={3.5} verticalAlign="middle" textAlign="right">
                  <HStack gap={1} justify="flex-end">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      onClick={() => onVisualizar(item)}
                      aria-label="Visualizar print"
                      title="Visualizar em tamanho real"
                      borderRadius="lg"
                    >
                      <Eye size={14} />
                    </IconButton>

                    <IconButton
                      size="xs"
                      variant="ghost"
                      onClick={(e) => handleCopiar(item.uuid, e)}
                      aria-label="Copiar imagem"
                      title="Copiar para Área de Transferência"
                      borderRadius="lg"
                    >
                      <Copy size={14} />
                    </IconButton>

                    <IconButton
                      size="xs"
                      variant="ghost"
                      onClick={(e) => handleDownload(item.uuid, titulo, e)}
                      disabled={baixandoUuid === item.uuid}
                      aria-label="Baixar PNG"
                      title="Baixar PNG"
                      color="cirqueira.brand.500"
                      _hover={{ bg: 'cirqueira.brand.500/10' }}
                      borderRadius="lg"
                    >
                      <Download size={14} />
                    </IconButton>

                    {onCategorizar && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={() => onCategorizar(item)}
                        aria-label="Categorizar print"
                        title="Categorizar"
                        borderRadius="lg"
                      >
                        <FolderPlus size={14} />
                      </IconButton>
                    )}

                    {onApagar && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={() => onApagar(item.uuid)}
                        aria-label="Apagar print"
                        title="Apagar"
                        color="cirqueira.red.500"
                        _hover={{ bg: 'cirqueira.red.500/10' }}
                        borderRadius="lg"
                      >
                        <Trash2 size={14} />
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
