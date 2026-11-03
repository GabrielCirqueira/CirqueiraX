import { Badge, Box, Button, HStack, IconButton, Text } from '@chakra-ui/react'
import { BookOpen, ChevronRight, Columns2, Maximize, Minimize, Search, ZoomIn } from 'lucide-react'
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
  onDefinirEscala?: (escala: number) => void
  onAlternarModoDuplo: () => void
  onAlternarTelaCheia: () => void
}

const NIVEIS_ZOOM = [0.8, 1.0, 1.25, 1.5, 2.0]

export const BarraSuperiorLeitor = memo(function BarraSuperiorLeitor({
  titulo,
  paginaAtual,
  totalPaginas,
  modoDuplo,
  escala,
  telaCheia,
  onResetarZoom,
  onDefinirEscala,
  onAlternarModoDuplo,
  onAlternarTelaCheia,
}: BarraSuperiorLeitorProps) {
  const navigate = useNavigate()

  function alternarProximoZoom() {
    if (onDefinirEscala) {
      const indiceAtual = NIVEIS_ZOOM.findIndex((z) => Math.abs(z - escala) < 0.05)
      const proximoIndice = (indiceAtual + 1) % NIVEIS_ZOOM.length
      onDefinirEscala(NIVEIS_ZOOM[proximoIndice] ?? 1.0)
    } else {
      onResetarZoom()
    }
  }

  return (
    <Box
      w="full"
      h={14}
      px={{ base: 3, md: 6 }}
      bg="#0b0e1b"
      borderBottom="1px solid"
      borderColor="rgba(255, 255, 255, 0.08)"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      zIndex={40}
    >
      <HStack gap={3} minW={0} flex={1}>
        <Box
          as="button"
          p="7px"
          borderRadius="xl"
          bg="rgba(99, 102, 241, 0.15)"
          border="1px solid rgba(99, 102, 241, 0.3)"
          color="#818cf8"
          cursor="pointer"
          _hover={{ bg: 'rgba(99, 102, 241, 0.25)', transform: 'scale(1.04)' }}
          transition="all 0.15s ease"
          onClick={() => navigate('/livros-audio')}
          title="Voltar para a Biblioteca"
        >
          <BookOpen size={18} />
        </Box>

        <HStack gap={2} minW={0} align="center">
          <Button
            size="xs"
            variant="ghost"
            p={0}
            h="auto"
            color="cirqueira.grey.400"
            _hover={{ color: 'white' }}
            onClick={() => navigate('/livros-audio')}
            fontWeight="normal"
            fontSize="xs"
          >
            Biblioteca
          </Button>

          <ChevronRight size={14} color="#71717a" />

          <Text
            fontSize="sm"
            fontWeight="bold"
            color="white"
            truncate
            maxW={{ base: '140px', sm: '260px', md: '450px' }}
            title={titulo}
          >
            {titulo}
          </Text>

          <Badge
            size="sm"
            variant="solid"
            bg="#212544"
            color="#c7d2fe"
            border="1px solid rgba(99, 102, 241, 0.3)"
            borderRadius="full"
            px={2.5}
            py="2px"
            fontSize="xs"
            fontWeight="600"
            fontVariantNumeric="tabular-nums"
          >
            Pág. {paginaAtual} / {totalPaginas}
          </Badge>
        </HStack>
      </HStack>

      <HStack gap={2} align="center">
        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="lg"
          color="cirqueira.grey.300"
          _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.08)' }}
          aria-label="Buscar no livro"
          title="Buscar no livro"
        >
          <Search size={16} />
        </IconButton>

        <Button
          size="sm"
          variant="ghost"
          borderRadius="lg"
          px={2.5}
          h="32px"
          color="cirqueira.grey.200"
          bg="rgba(255, 255, 255, 0.05)"
          border="1px solid rgba(255, 255, 255, 0.08)"
          _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
          onClick={alternarProximoZoom}
          title="Alterar zoom do livro"
          fontSize="xs"
          fontWeight="semibold"
        >
          <ZoomIn size={14} style={{ marginRight: '5px' }} />
          {Math.round(escala * 100)}%
        </Button>

        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="lg"
          color={modoDuplo ? 'cirqueira.brand.400' : 'cirqueira.grey.300'}
          bg={modoDuplo ? 'rgba(99, 102, 241, 0.15)' : 'transparent'}
          border="1px solid"
          borderColor={modoDuplo ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}
          _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.08)' }}
          aria-label={modoDuplo ? 'Alternar para página única' : 'Alternar para livro aberto'}
          title={
            modoDuplo ? 'Alternar para página única' : 'Alternar para livro aberto (duas páginas)'
          }
          onClick={onAlternarModoDuplo}
        >
          <Columns2 size={16} />
        </IconButton>

        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="lg"
          color="cirqueira.grey.300"
          _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.08)' }}
          aria-label={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          title={telaCheia ? 'Sair da tela cheia (Esc)' : 'Tela cheia (F11)'}
          onClick={onAlternarTelaCheia}
        >
          {telaCheia ? <Minimize size={16} /> : <Maximize size={16} />}
        </IconButton>
      </HStack>
    </Box>
  )
})
