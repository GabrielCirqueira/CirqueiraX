import {
  isMidiaEditavelNoEditor,
  montarRotaEditorImagem,
} from '@/features/editor-imagem/utils/rotaEditor'
import { addToast } from '@/shared/components/ui/toaster'
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  Calendar,
  Clock,
  Copy,
  Download,
  Folder,
  FolderPlus,
  HardDrive,
  Image as ImageIcon,
  Laptop,
  Loader2,
  PenLine,
  X,
} from 'lucide-react'
import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { baixarArquivoPrint, copiarPrintParaClipboard, obterUrlStreamPrint } from '../api'
import type { MediaItem } from '../types'

export interface ModalVisualizarPrintProps {
  item: MediaItem | null
  aberto: boolean
  onFechar: () => void
  onCategorizar?: (item: MediaItem) => void
}

export const ModalVisualizarPrint = memo(function ModalVisualizarPrint({
  item,
  aberto,
  onFechar,
  onCategorizar,
}: ModalVisualizarPrintProps) {
  const navigate = useNavigate()
  const [baixando, setBaixando] = useState(false)
  const [copiando, setCopiando] = useState(false)

  if (!item) return null

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
  const dataDia = item.criadoEm ? new Date(item.criadoEm).toLocaleDateString('pt-BR') : 'Hoje'

  const streamUrl = obterUrlStreamPrint(item.uuid)

  const handleCopiar = async () => {
    setCopiando(true)
    const copiado = await copiarPrintParaClipboard(item.uuid)
    setCopiando(false)
    if (copiado) {
      addToast({ title: 'Print copiado para a área de transferência!', color: 'success' })
    } else {
      addToast({ title: 'Não foi possível copiar imagem diretamente.', color: 'warning' })
    }
  }

  const handleBaixar = async () => {
    setBaixando(true)
    try {
      await baixarArquivoPrint(item.uuid, titulo)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={aberto} onOpenChange={(e) => !e.open && onFechar()} size="xl" placement="center">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.75)" />
        <Dialog.Positioner>
        <Dialog.Content
          borderRadius="xl"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          shadow="2xl"
          overflow="hidden"
          maxW="5xl"
          w="full"
        >
          <Flex
            align="center"
            justify="space-between"
            p={4}
            borderBottomWidth="1px"
            borderColor="border.subtle"
          >
            <HStack gap={2.5}>
              <Box
                p={2}
                borderRadius="lg"
                bg="cirqueira.brand.500/10"
                color="cirqueira.brand.400"
                borderWidth="1px"
                borderColor="cirqueira.brand.500/20"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
              >
                <ImageIcon size={18} />
              </Box>
              <VStack align="start" gap={0.5}>
                <Dialog.Title fontSize="md" fontWeight="bold" color="fg" lineClamp={1}>
                  {titulo}
                </Dialog.Title>
                <HStack gap={2} fontSize="xs" color="fg.subtle">
                  <Text as="span">{agenteNome}</Text>
                  <Text as="span">•</Text>
                  <Text as="span">PNG</Text>
                  <Text as="span">•</Text>
                  <Text as="span">{tamanhoFormatado}</Text>
                </HStack>
              </VStack>
            </HStack>

            <IconButton
              size="sm"
              variant="ghost"
              onClick={onFechar}
              aria-label="Fechar modal"
              borderRadius="lg"
            >
              <X size={18} />
            </IconButton>
          </Flex>

          <Box
            position="relative"
            bg="blackAlpha.950"
            w="full"
            minH="350px"
            maxH="75vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
            overflow="auto"
          >
            <img
              src={streamUrl}
              alt={titulo}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          </Box>

          <Dialog.Body p={4} borderTopWidth="1px" borderColor="border.subtle">
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'stretch', md: 'center' }}
              gap={3}
            >
              <HStack gap={3} flexWrap="wrap" fontSize="xs" color="fg.subtle">
                <HStack gap={1.5}>
                  <Laptop size={14} color="var(--chakra-colors-cirqueira-brand-400)" />
                  <Text as="span">{agenteNome}</Text>
                </HStack>
                <HStack gap={1.5}>
                  <Calendar size={14} />
                  <Text as="span">{dataDia}</Text>
                </HStack>
                <HStack gap={1.5}>
                  <Clock size={14} />
                  <Text as="span">{dataHora}</Text>
                </HStack>
                <HStack gap={1.5}>
                  <HardDrive size={14} />
                  <Text as="span">{tamanhoFormatado}</Text>
                </HStack>

                {item.categoria?.nome ? (
                  <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="md">
                    <HStack gap={1}>
                      <Folder size={11} />
                      <Text as="span">{item.categoria.nome}</Text>
                    </HStack>
                  </Badge>
                ) : (
                  <Badge size="sm" variant="subtle" colorPalette="gray" borderRadius="md">
                    Print Pessoal
                  </Badge>
                )}
              </HStack>

              <HStack gap={2} flexWrap="wrap">
                {onCategorizar && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onFechar()
                      onCategorizar(item)
                    }}
                    borderRadius="lg"
                  >
                    <FolderPlus size={14} />
                    <Text as="span">Categorizar</Text>
                  </Button>
                )}

                {isMidiaEditavelNoEditor(item.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(montarRotaEditorImagem(item.uuid))}
                    borderRadius="lg"
                  >
                    <PenLine size={14} />
                    <Text as="span">Editar</Text>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopiar}
                  disabled={copiando}
                  borderRadius="lg"
                >
                  <Copy size={14} />
                  <Text as="span">{copiando ? 'Copiando...' : 'Copiar Imagem'}</Text>
                </Button>

                <Button
                  size="sm"
                  colorPalette="brand"
                  onClick={handleBaixar}
                  disabled={baixando}
                  fontWeight="semibold"
                  borderRadius="lg"
                >
                  {baixando ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      <Text as="span">Baixando...</Text>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <Text as="span">Baixar PNG</Text>
                    </>
                  )}
                </Button>
              </HStack>
            </Flex>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
)
})
