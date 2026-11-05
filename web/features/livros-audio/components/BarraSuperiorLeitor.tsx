import { Badge, Box, Button, HStack, IconButton, Text } from '@chakra-ui/react'
import {
  AArrowDown,
  AArrowUp,
  BookOpen,
  Bookmark,
  ChevronRight,
  Coffee,
  Columns2,
  FileText,
  Maximize,
  Minimize,
  Moon,
  Search,
  Sun,
  TextQuote,
  ZoomIn,
} from 'lucide-react'
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TemaPagina } from '../types'

const ROTULO_TEMA: Record<TemaPagina, string> = {
  claro: 'Página clara',
  sepia: 'Página sépia',
  escuro: 'Página escura',
}
const ICONE_TEMA = { claro: Sun, sepia: Coffee, escuro: Moon }

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
  buscaAberta?: boolean
  onAlternarBusca?: () => void
  marcacoesAbertas?: boolean
  totalMarcacoes?: number
  onAlternarMarcacoes?: () => void
  tema?: TemaPagina
  onAlternarTema?: () => void
  modoTexto?: boolean
  onAlternarModoTexto?: () => void
  onAumentarFonte?: () => void
  onDiminuirFonte?: () => void
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
  buscaAberta = false,
  onAlternarBusca,
  marcacoesAbertas = false,
  totalMarcacoes = 0,
  onAlternarMarcacoes,
  tema = 'claro',
  onAlternarTema,
  modoTexto = false,
  onAlternarModoTexto,
  onAumentarFonte,
  onDiminuirFonte,
}: BarraSuperiorLeitorProps) {
  const navigate = useNavigate()
  const IconeTema = ICONE_TEMA[tema]

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
      minH={14}
      pt="env(safe-area-inset-top, 0px)"
      px={{ base: 2, md: 6 }}
      bg="cirqueira.grey.950"
      borderBottom="1px solid"
      borderColor="cirqueira.grey.900"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      zIndex={40}
    >
      <HStack gap={{ base: 2, md: 3 }} minW={0} flex={1}>
        <Box
          as="button"
          p="7px"
          borderRadius="xl"
          bg="cirqueira.brand.500/15"
          border="1px solid"
          borderColor="cirqueira.brand.500/30"
          color="cirqueira.brand.400"
          cursor="pointer"
          _hover={{ bg: 'cirqueira.brand.500/25', transform: 'scale(1.04)' }}
          transition="all 0.15s ease"
          onClick={() => navigate('/livros-audio')}
          title="Voltar para a Biblioteca"
        >
          <BookOpen size={18} />
        </Box>

        <HStack gap={2} minW={0} align="center">
          <Button
            display={{ base: 'none', md: 'inline-flex' }}
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

          <Box color="cirqueira.grey.500" display={{ base: 'none', md: 'inline-flex' }}>
            <ChevronRight size={14} />
          </Box>

          <Text
            fontSize="sm"
            fontWeight="bold"
            color="white"
            truncate
            maxW={{ base: '30vw', sm: '260px', md: '450px' }}
            title={titulo}
          >
            {titulo}
          </Text>

          <Badge
            display={{ base: modoTexto ? 'none' : 'inline-flex', md: 'inline-flex' }}
            size="sm"
            variant="solid"
            bg="cirqueira.brand.500/20"
            color="cirqueira.brand.300"
            border="1px solid"
            borderColor="cirqueira.brand.500/35"
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

      <HStack gap={{ base: 0.5, md: 2 }} align="center">
        {onAlternarModoTexto && (
          <Button
            size="sm"
            variant="ghost"
            borderRadius="lg"
            px={2}
            h="36px"
            color={modoTexto ? 'cirqueira.brand.300' : 'cirqueira.grey.200'}
            bg={modoTexto ? 'cirqueira.brand.500/20' : 'cirqueira.grey.900'}
            border="1px solid"
            borderColor={modoTexto ? 'cirqueira.brand.500/40' : 'cirqueira.grey.800'}
            onClick={onAlternarModoTexto}
            aria-label={modoTexto ? 'Ver as páginas do PDF' : 'Ler em modo texto'}
            title={modoTexto ? 'Ver as páginas do PDF' : 'Ler em modo texto, com letra grande'}
            fontSize="xs"
          >
            {modoTexto ? <FileText size={16} /> : <TextQuote size={16} />}
            <Text as="span" display={{ base: 'none', sm: 'inline' }}>
              {modoTexto ? 'Página' : 'Texto'}
            </Text>
          </Button>
        )}

        {modoTexto && onDiminuirFonte && onAumentarFonte && (
          <>
            <IconButton
              size="sm"
              variant="ghost"
              color="cirqueira.grey.300"
              onClick={onDiminuirFonte}
              aria-label="Diminuir a letra"
            >
              <AArrowDown size={17} />
            </IconButton>
            <IconButton
              size="sm"
              variant="ghost"
              color="cirqueira.grey.300"
              onClick={onAumentarFonte}
              aria-label="Aumentar a letra"
            >
              <AArrowUp size={17} />
            </IconButton>
          </>
        )}

        {onAlternarBusca && (
          <IconButton
            size="sm"
            variant="ghost"
            borderRadius="lg"
            color={buscaAberta ? 'cirqueira.brand.300' : 'cirqueira.grey.300'}
            bg={buscaAberta ? 'cirqueira.brand.500/20' : undefined}
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            onClick={onAlternarBusca}
            aria-label="Buscar no livro"
            title="Buscar no livro"
          >
            <Search size={16} />
          </IconButton>
        )}

        {onAlternarMarcacoes && (
          <Button
            size="sm"
            variant="ghost"
            borderRadius="lg"
            px={2}
            h="32px"
            color={marcacoesAbertas ? 'cirqueira.brand.300' : 'cirqueira.grey.300'}
            bg={marcacoesAbertas ? 'cirqueira.brand.500/20' : undefined}
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            onClick={onAlternarMarcacoes}
            aria-label="Marcadores, destaques e notas"
            title="Marcadores, destaques e notas"
            fontSize="xs"
          >
            <Bookmark size={16} />
            {totalMarcacoes > 0 && totalMarcacoes}
          </Button>
        )}

        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="lg"
          color="cirqueira.grey.300"
          _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
          onClick={onAlternarTema}
          aria-label={`${ROTULO_TEMA[tema]}. Clique para trocar`}
          title={`${ROTULO_TEMA[tema]} (clique para trocar)`}
        >
          <IconeTema size={16} />
        </IconButton>

        <Button
          display={modoTexto ? 'none' : { base: 'none', sm: 'inline-flex' }}
          size="sm"
          variant="ghost"
          borderRadius="lg"
          px={2.5}
          h="32px"
          color="cirqueira.grey.200"
          bg="cirqueira.grey.900"
          border="1px solid"
          borderColor="cirqueira.grey.800"
          _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
          onClick={alternarProximoZoom}
          title="Alterar zoom do livro"
          fontSize="xs"
          fontWeight="semibold"
        >
          <ZoomIn size={14} style={{ marginRight: '5px' }} />
          {Math.round(escala * 100)}%
        </Button>

        <IconButton
          display={modoTexto ? 'none' : { base: 'none', lg: 'inline-flex' }}
          size="sm"
          variant="ghost"
          borderRadius="lg"
          color={modoDuplo ? 'cirqueira.brand.400' : 'cirqueira.grey.300'}
          bg={modoDuplo ? 'cirqueira.brand.500/15' : 'transparent'}
          border="1px solid"
          borderColor={modoDuplo ? 'cirqueira.brand.500/35' : 'transparent'}
          _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
          aria-label={modoDuplo ? 'Alternar para página única' : 'Alternar para livro aberto'}
          title={
            modoDuplo ? 'Alternar para página única' : 'Alternar para livro aberto (duas páginas)'
          }
          onClick={onAlternarModoDuplo}
        >
          <Columns2 size={16} />
        </IconButton>

        <IconButton
          display={{ base: 'none', md: 'inline-flex' }}
          size="sm"
          variant="ghost"
          borderRadius="lg"
          color="cirqueira.grey.300"
          _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
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
