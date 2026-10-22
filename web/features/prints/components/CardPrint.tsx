import {
  isMidiaEditavelNoEditor,
  montarRotaEditorImagem,
} from '@/features/editor-imagem/utils/rotaEditor'
import { addToast } from '@/shared/components/ui/toaster'
import { Badge, Box, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  Check,
  Copy,
  Download,
  FolderPlus,
  Image as ImageIcon,
  Loader2,
  PenLine,
  Trash2,
} from 'lucide-react'
import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [erroCarregamento, setErroCarregamento] = useState(false)
  const [baixando, setBaixando] = useState(false)
  const [copiando, setCopiando] = useState(false)
  const [copiadoRecente, setCopiadoRecente] = useState(false)

  const titulo =
    typeof item.metadata?.nome_original === 'string' && item.metadata.nome_original
      ? item.metadata.nome_original
      : typeof item.metadata?.titulo === 'string' && item.metadata.titulo
        ? item.metadata.titulo
        : `Print ${item.hash.slice(0, 8)}`

  const dataHora = item.criadoEm
    ? new Date(item.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : ''

  const streamUrl = obterUrlStreamPrint(item.uuid)

  const handleCopiar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setCopiando(true)
    const copiado = await copiarPrintParaClipboard(item.uuid)
    setCopiando(false)
    if (copiado) {
      setCopiadoRecente(true)
      setTimeout(() => setCopiadoRecente(false), 2000)
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
    <Box
      className="cv-auto"
      position="relative"
      w="full"
      borderRadius="md"
      overflow="hidden"
      bg="blackAlpha.900"
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
      }}
    >
      {!erroCarregamento ? (
        <img
          src={streamUrl}
          alt={titulo}
          onError={() => setErroCarregamento(true)}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '4px',
          }}
          decoding="async"
          loading="lazy"
        />
      ) : (
        <VStack
          h="120px"
          w="full"
          align="center"
          justify="center"
          gap={1.5}
          bg="bg.panel"
          color="fg.subtle"
        >
          <ImageIcon size={24} strokeWidth={1.5} />
          <Text fontSize="2xs">Imagem indisponível</Text>
        </VStack>
      )}

      <Box
        position="absolute"
        top={2}
        left={2}
        zIndex={15}
        opacity={isHovered || selecionado ? 1 : 0}
        transition="opacity 0.15s ease"
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect(item.uuid)
        }}
      >
        <Box
          w="20px"
          h="20px"
          borderRadius="full"
          bg={selecionado ? 'cirqueira.brand.500' : 'blackAlpha.700'}
          color="white"
          border="1.5px solid white"
          cursor="pointer"
          shadow="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          title={selecionado ? 'Desmarcar' : 'Selecionar'}
          _hover={{
            transform: 'scale(1.15)',
            bg: selecionado ? 'cirqueira.brand.600' : 'blackAlpha.900',
          }}
          transition="all 0.12s ease"
        >
          {selecionado ? <Check size={12} strokeWidth={3} /> : null}
        </Box>
      </Box>

      {dataHora && (
        <Box
          position="absolute"
          top={2}
          right={2}
          zIndex={12}
          opacity={isHovered ? 1 : 0}
          transition="opacity 0.15s ease"
          pointerEvents="none"
        >
          <Badge
            size="xs"
            variant="subtle"
            colorPalette="gray"
            bg="blackAlpha.750"
            color="whiteAlpha.900"
            borderRadius="md"
            px={1.5}
            py={0.5}
            fontSize="2xs"
          >
            {dataHora}
          </Badge>
        </Box>
      )}

      <Box
        position="absolute"
        inset={0}
        zIndex={5}
        bgGradient="to-b"
        gradientFrom="cirqueira.grey.950/40"
        gradientVia="transparent"
        gradientTo="cirqueira.grey.950/80"
        opacity={isHovered ? 1 : 0}
        pointerEvents="none"
        transition="opacity 0.15s ease"
      />

      <HStack
        position="absolute"
        bottom={2}
        left={2}
        zIndex={15}
        opacity={isHovered ? 1 : 0}
        pointerEvents={isHovered ? 'auto' : 'none'}
        transition="opacity 0.15s ease"
        gap={1}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          size="xs"
          w="26px"
          h="26px"
          minW="26px"
          variant="ghost"
          onClick={handleCopiar}
          disabled={copiando}
          bg="blackAlpha.750"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          color={copiadoRecente ? 'cirqueira.green.400' : 'white'}
          _hover={{
            bg: 'whiteAlpha.400',
            color: 'cirqueira.brand.300',
            transform: 'scale(1.1)',
          }}
          aria-label="Copiar print"
          title="Copiar imagem para área de transferência"
          borderRadius="md"
        >
          {copiadoRecente ? <Check size={13} /> : <Copy size={13} />}
        </IconButton>

        {isMidiaEditavelNoEditor(item.status) && (
          <IconButton
            size="xs"
            w="26px"
            h="26px"
            minW="26px"
            variant="ghost"
            onClick={() => navigate(montarRotaEditorImagem(item.uuid))}
            bg="blackAlpha.750"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            color="white"
            _hover={{
              bg: 'whiteAlpha.400',
              color: 'cirqueira.brand.300',
              transform: 'scale(1.1)',
            }}
            aria-label="Editar print"
            title="Editar no editor de imagem (setas, texto, formas)"
            borderRadius="md"
          >
            <PenLine size={13} />
          </IconButton>
        )}

        <IconButton
          size="xs"
          w="26px"
          h="26px"
          minW="26px"
          variant="ghost"
          onClick={handleBaixar}
          disabled={baixando}
          bg="blackAlpha.750"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          color="white"
          _hover={{
            bg: 'whiteAlpha.400',
            color: 'cirqueira.brand.300',
            transform: 'scale(1.1)',
          }}
          aria-label="Baixar print"
          title="Baixar imagem (Download)"
          borderRadius="md"
        >
          {baixando ? (
            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Download size={13} />
          )}
        </IconButton>

        {onCategorizar && (
          <IconButton
            size="xs"
            w="26px"
            h="26px"
            minW="26px"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onCategorizar(item)
            }}
            bg="blackAlpha.750"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            color="white"
            _hover={{
              bg: 'whiteAlpha.400',
              color: 'cirqueira.brand.300',
              transform: 'scale(1.1)',
            }}
            aria-label="Categorizar print"
            title="Categorizar"
            borderRadius="md"
          >
            <FolderPlus size={13} />
          </IconButton>
        )}

        {onApagar && (
          <IconButton
            size="xs"
            w="26px"
            h="26px"
            minW="26px"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onApagar(item.uuid)
            }}
            bg="blackAlpha.750"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            color="red.300"
            _hover={{
              bg: 'red.500/30',
              color: 'red.200',
              transform: 'scale(1.1)',
            }}
            aria-label="Excluir print"
            title="Excluir"
            borderRadius="md"
          >
            <Trash2 size={13} />
          </IconButton>
        )}
      </HStack>
    </Box>
  )
})
