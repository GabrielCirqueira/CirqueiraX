import { addToast } from '@/shared/components/ui/toaster'
import { Badge, Box, Card, Flex, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  Calendar,
  CheckCircle2,
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

export interface CardPrintProps {
  item: MediaItem
  selecionado: boolean
  onToggleSelect: (uuid: string) => void
  onVisualizar: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onApagar?: (uuid: string) => void
}

export const CardPrint = memo(function CardPrint({
  item,
  selecionado,
  onToggleSelect,
  onVisualizar,
  onCategorizar,
  onApagar,
}: CardPrintProps) {
  const [erroCarregamento, setErroCarregamento] = useState(false)
  const [baixando, setBaixando] = useState(false)
  const [copiando, setCopiando] = useState(false)

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

  const handleCopiar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setCopiando(true)
    const copiado = await copiarPrintParaClipboard(item.uuid)
    setCopiando(false)
    if (copiado) {
      addToast({ title: 'Print copiado para a área de transferência!', color: 'success' })
    } else {
      addToast({ title: 'Não foi possível copiar imagem diretamente.', color: 'warning' })
    }
  }

  const handleBaixar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setBaixando(true)
    try {
      await baixarArquivoPrint(item.uuid, titulo)
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
      <Box
        position="relative"
        aspectRatio="16/10"
        w="full"
        bg="blackAlpha.900"
        overflow="hidden"
        cursor="pointer"
        onClick={() => onVisualizar(item)}
      >
        {!erroCarregamento ? (
          <img
            src={streamUrl}
            alt={titulo}
            onError={() => setErroCarregamento(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            loading="lazy"
          />
        ) : (
          <VStack h="full" w="full" align="center" justify="center" gap={2} color="fg.subtle">
            <ImageIcon size={36} strokeWidth={1.5} />
            <Text fontSize="xs">Pré-visualização indisponível</Text>
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
          transition="opacity 0.2s ease"
          zIndex={5}
        >
          <HStack gap={2}>
            <Box
              p={2.5}
              borderRadius="full"
              bg="cirqueira.brand.500"
              color="white"
              shadow="xl"
              _hover={{ transform: 'scale(1.1)' }}
              transition="transform 0.15s ease"
              title="Visualizar em tamanho real"
            >
              <Eye size={18} />
            </Box>

            <Box
              p={2.5}
              borderRadius="full"
              bg="whiteAlpha.300"
              color="white"
              backdropFilter="blur(8px)"
              shadow="xl"
              onClick={handleCopiar}
              _hover={{ transform: 'scale(1.1)', bg: 'whiteAlpha.400' }}
              transition="transform 0.15s ease"
              title="Copiar para Área de Transferência"
            >
              <Copy size={18} />
            </Box>

            <Box
              p={2.5}
              borderRadius="full"
              bg="whiteAlpha.300"
              color="white"
              backdropFilter="blur(8px)"
              shadow="xl"
              onClick={handleBaixar}
              _hover={{ transform: 'scale(1.1)', bg: 'whiteAlpha.400' }}
              transition="transform 0.15s ease"
              title="Baixar PNG"
            >
              <Download size={18} />
            </Box>
          </HStack>
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
            size="xs"
            variant="subtle"
            colorPalette="brand"
            backdropFilter="blur(8px)"
            borderRadius="md"
          >
            <HStack gap={1} alignItems="center">
              <CheckCircle2 size={10} />
              <Text as="span">Sincronizado</Text>
            </HStack>
          </Badge>
        </Box>
      </Box>

      <Card.Body p={4} display="flex" flexDirection="column" gap={3} flex={1}>
        <VStack align="start" gap={1} w="full">
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="fg"
            lineClamp={1}
            title={titulo}
            cursor="pointer"
            onClick={() => onVisualizar(item)}
            _hover={{ color: 'cirqueira.brand.400' }}
          >
            {titulo}
          </Text>

          <HStack gap={2} fontSize="xs" color="fg.subtle" flexWrap="wrap">
            <HStack gap={1} color="fg.muted">
              <Laptop size={12} />
              <Text as="span">{agenteNome}</Text>
            </HStack>
            <Text as="span" opacity={0.4}>
              •
            </Text>
            <HStack gap={1}>
              <HardDrive size={12} />
              <Text as="span">{tamanhoFormatado}</Text>
            </HStack>
            <Badge size="xs" variant="outline" borderRadius="md" colorPalette="gray">
              PNG
            </Badge>
          </HStack>
        </VStack>

        <Flex align="center" justify="space-between" gap={2} fontSize="xs" color="fg.subtle">
          <HStack gap={2} color="fg.muted">
            <HStack gap={1}>
              <Calendar size={12} />
              <Text as="span">{dataDia}</Text>
            </HStack>
            <Text as="span" opacity={0.4}>
              •
            </Text>
            <HStack gap={1}>
              <Clock size={12} />
              <Text as="span">{dataHora}</Text>
            </HStack>
          </HStack>

          <Box flexShrink={0}>
            {item.categoria?.nome ? (
              <Badge size="xs" variant="subtle" colorPalette="brand" borderRadius="md">
                <HStack gap={1} alignItems="center">
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
        </Flex>

        <Flex
          pt={2}
          borderTopWidth="1px"
          borderColor="border.subtle"
          align="center"
          justify="space-between"
          gap={2}
        >
          <HStack gap={1}>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleCopiar}
              disabled={copiando}
              aria-label="Copiar imagem"
              title="Copiar para Área de Transferência"
              borderRadius="lg"
            >
              <Copy size={14} />
            </IconButton>

            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleBaixar}
              disabled={baixando}
              aria-label="Baixar PNG"
              title="Baixar PNG"
              borderRadius="lg"
            >
              <Download size={14} />
            </IconButton>
          </HStack>

          <HStack gap={1}>
            {onCategorizar && (
              <IconButton
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onCategorizar(item)
                }}
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
                onClick={(e) => {
                  e.stopPropagation()
                  onApagar(item.uuid)
                }}
                aria-label="Apagar print"
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
