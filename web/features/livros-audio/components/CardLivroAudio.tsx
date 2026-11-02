import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  IconButton,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react'
import { BookOpen, Download, FileText, Headphones, Trash2 } from 'lucide-react'
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { obterUrlPdfLivro } from '../api'
import type { LivroAudio } from '../types'
import {
  calcularProgressoLeitura,
  formatarDataRelativa,
  formatarTamanhoLivro,
  obterAparenciaStatusLivro,
} from '../utils/livros'

interface CardLivroAudioProps {
  livro: LivroAudio
  apagando?: boolean
  onApagar: (uuid: string) => void
}

export const CardLivroAudio = memo(function CardLivroAudio({
  livro,
  apagando = false,
  onApagar,
}: CardLivroAudioProps) {
  const navigate = useNavigate()
  const aparencia = obterAparenciaStatusLivro(livro.status)
  const progresso = calcularProgressoLeitura(livro.paginaAtual, livro.totalPaginas)
  const urlDownloadPdf = obterUrlPdfLivro(livro.uuid)

  function handleAbrirLeitor() {
    navigate(`/livros-audio/${livro.uuid}`)
  }

  function handleApagar() {
    if (window.confirm(`Tem certeza que deseja apagar o livro "${livro.titulo}"?`)) {
      onApagar(livro.uuid)
    }
  }

  return (
    <Box
      bg="cirqueira.grey.950"
      border="1px solid"
      borderColor="cirqueira.grey.900"
      borderRadius="xl"
      p={5}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      gap={4}
      transition="all 0.2s ease"
      position="relative"
      overflow="hidden"
      _hover={{
        borderColor: 'cirqueira.brand.500/40',
        shadow: 'lg',
        transform: 'translateY(-2px)',
      }}
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between" align="flex-start" gap={2}>
          <HStack gap={3} align="center" minW={0}>
            <Center
              boxSize={11}
              borderRadius="lg"
              bg="cirqueira.brand.500/15"
              color="cirqueira.brand.400"
              border="1px solid"
              borderColor="cirqueira.brand.500/30"
              flexShrink={0}
            >
              <BookOpen size={22} />
            </Center>

            <VStack align="flex-start" gap={0.5} minW={0}>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="cirqueira.grey.0"
                lineClamp={2}
                title={livro.titulo}
              >
                {livro.titulo}
              </Text>
              <Text fontSize="xs" color="cirqueira.grey.500">
                {formatarTamanhoLivro(livro.tamanhoBytes)}
              </Text>
            </VStack>
          </HStack>

          <Badge
            size="sm"
            variant="subtle"
            colorPalette={aparencia.paleta}
            borderRadius="md"
            px={2}
            py={0.5}
            fontSize="10px"
            fontWeight="bold"
            flexShrink={0}
          >
            {aparencia.rotulo}
          </Badge>
        </HStack>

        <Box pt={2}>
          <HStack justify="space-between" align="center" mb={1.5}>
            <HStack gap={1} align="center">
              <FileText size={12} color="var(--chakra-colors-cirqueira-grey-500)" />
              <Text fontSize="xs" color="cirqueira.grey.400">
                {livro.totalPaginas
                  ? `Página ${livro.paginaAtual} de ${livro.totalPaginas}`
                  : `Página ${livro.paginaAtual}`}
              </Text>
            </HStack>
            <Text fontSize="xs" fontWeight="bold" color="cirqueira.brand.400">
              {progresso}%
            </Text>
          </HStack>

          <Progress.Root value={progresso} size="xs" colorPalette="brand">
            <Progress.Track bg="cirqueira.grey.900" borderRadius="full">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
        </Box>

        <HStack justify="space-between" align="center" pt={1}>
          <HStack gap={1.5} align="center">
            <Headphones size={12} color="var(--chakra-colors-cirqueira-grey-500)" />
            <Text fontSize="11px" color="cirqueira.grey.500">
              Última escuta: {formatarDataRelativa(livro.ultimaEscutaEm)}
            </Text>
          </HStack>
        </HStack>
      </VStack>

      <HStack
        justify="space-between"
        align="center"
        pt={2}
        borderTop="1px solid"
        borderColor="cirqueira.grey.900"
      >
        <HStack gap={1}>
          <IconButton
            asChild
            size="xs"
            variant="ghost"
            borderRadius="lg"
            color="cirqueira.grey.400"
            _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
            aria-label="Baixar PDF original"
            title="Baixar PDF original"
          >
            <a href={urlDownloadPdf} download={`${livro.titulo}.pdf`}>
              <Download size={14} />
            </a>
          </IconButton>

          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="lg"
            color="cirqueira.grey.400"
            _hover={{ color: 'cirqueira.red.500', bg: 'cirqueira.red.500/10' }}
            aria-label="Apagar livro"
            title="Apagar livro"
            disabled={apagando}
            onClick={handleApagar}
          >
            <Trash2 size={14} />
          </IconButton>
        </HStack>

        <Button
          size="xs"
          variant="solid"
          borderRadius="lg"
          bg="cirqueira.brand.500"
          _hover={{ bg: 'cirqueira.brand.600' }}
          color="cirqueira.grey.0"
          px={3}
          onClick={handleAbrirLeitor}
        >
          <BookOpen size={13} style={{ marginRight: '4px' }} />
          Continuar
        </Button>
      </HStack>
    </Box>
  )
})
