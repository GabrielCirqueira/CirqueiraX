import { Badge, Box, Button, HStack, IconButton, Text } from '@chakra-ui/react'
import {
  ArrowLeft,
  Columns2,
  FileText,
  Maximize,
  Minimize,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'

interface BarraSuperiorLeitorProps {
  titulo: string
  paginaAtual: number
  totalPaginas: number
  modoDuplo: boolean
  escala: number
  telaCheia: boolean
  onAumentarZoom: () => void
  onDiminuirZoom: () => void
  onResetarZoom: () => void
  onAlternarModoDuplo: () => void
  onAlternarTelaCheia: () => void
}

export const BarraSuperiorLeitor = memo(function BarraSuperiorLeitor({
  titulo,
  paginaAtual,
  totalPaginas,
  modoDuplo,
  escala,
  telaCheia,
  onAumentarZoom,
  onDiminuirZoom,
  onResetarZoom,
  onAlternarModoDuplo,
  onAlternarTelaCheia,
}: BarraSuperiorLeitorProps) {
  const navigate = useNavigate()

  return (
    <Box
      w="full"
      h={14}
      px={{ base: 3, md: 5 }}
      bg="cirqueira.grey.950"
      borderBottom="1px solid"
      borderColor="cirqueira.grey.900"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      zIndex={20}
    >
      <HStack gap={3} minW={0} flex={1}>
        <Button
          size="xs"
          variant="ghost"
          borderRadius="lg"
          color="cirqueira.grey.300"
          _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
          onClick={() => navigate('/livros-audio')}
          px={2}
        >
          <ArrowLeft size={16} style={{ marginRight: '4px' }} />
          <Text as="span" display={{ base: 'none', sm: 'inline' }}>
            Biblioteca
          </Text>
        </Button>

        <Box w="1px" h={5} bg="cirqueira.grey.900" />

        <HStack gap={2} minW={0} flex={1}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="cirqueira.grey.0"
            truncate
            maxW={{ base: '180px', sm: '320px', md: '500px' }}
            title={titulo}
          >
            {titulo}
          </Text>

          <Badge
            size="sm"
            variant="subtle"
            colorPalette="brand"
            borderRadius="md"
            display={{ base: 'none', md: 'inline-flex' }}
          >
            Pág. {paginaAtual} / {totalPaginas}
          </Badge>
        </HStack>
      </HStack>

      <HStack gap={1.5} align="center">
        <HStack
          gap={1}
          bg="cirqueira.grey.900/50"
          p={1}
          borderRadius="lg"
          border="1px solid"
          borderColor="cirqueira.grey.900"
        >
          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="md"
            color="cirqueira.grey.400"
            _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.800' }}
            aria-label="Diminuir zoom"
            title="Diminuir zoom"
            onClick={onDiminuirZoom}
          >
            <ZoomOut size={14} />
          </IconButton>

          <Text
            fontSize="xs"
            color="cirqueira.grey.300"
            fontWeight="semibold"
            minW="38px"
            textAlign="center"
          >
            {Math.round(escala * 100)}%
          </Text>

          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="md"
            color="cirqueira.grey.400"
            _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.800' }}
            aria-label="Aumentar zoom"
            title="Aumentar zoom"
            onClick={onAumentarZoom}
          >
            <ZoomIn size={14} />
          </IconButton>

          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="md"
            color="cirqueira.grey.400"
            _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.800' }}
            aria-label="Resetar zoom"
            title="Resetar zoom"
            onClick={onResetarZoom}
          >
            <RotateCcw size={12} />
          </IconButton>
        </HStack>

        <IconButton
          size="xs"
          variant={modoDuplo ? 'solid' : 'ghost'}
          bg={modoDuplo ? 'cirqueira.brand.500/20' : 'transparent'}
          color={modoDuplo ? 'cirqueira.brand.300' : 'cirqueira.grey.400'}
          borderColor={modoDuplo ? 'cirqueira.brand.500/40' : 'transparent'}
          border="1px solid"
          borderRadius="lg"
          _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
          aria-label={modoDuplo ? 'Modo página única' : 'Modo página dupla (livro aberto)'}
          title={modoDuplo ? 'Página única' : 'Página dupla'}
          onClick={onAlternarModoDuplo}
          display={{ base: 'none', lg: 'inline-flex' }}
        >
          {modoDuplo ? <Columns2 size={16} /> : <FileText size={16} />}
        </IconButton>

        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="lg"
          color="cirqueira.grey.400"
          _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
          aria-label={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          title={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          onClick={onAlternarTelaCheia}
        >
          {telaCheia ? <Minimize size={16} /> : <Maximize size={16} />}
        </IconButton>
      </HStack>
    </Box>
  )
})
