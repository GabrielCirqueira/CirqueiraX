import { addToast } from '@/shared/components/ui/toaster'
import { useSemConexao } from '@/stores/useConexaoStore'
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
import {
  ArrowUpToLine,
  BookOpen,
  CloudCheck,
  CloudDownload,
  Download,
  FileText,
  Headphones,
  Pause,
  Play,
  Trash2,
} from 'lucide-react'
import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { abrirPdfEmNovaAba } from '../api'
import { useAlterarFilaLivro } from '../hooks/useLivrosAudio'
import type { ItemFilaGeracao, LivroAudio } from '../types'
import {
  calcularProgressoLeitura,
  formatarDataRelativa,
  formatarTamanhoLivro,
  obterAparenciaStatusLivro,
  obterProgressoAudio,
} from '../utils/livros'
import { offlineDisponivel } from '../utils/offline'
import { ModalOfflineLivro } from './ModalOfflineLivro'

interface CardLivroAudioProps {
  livro: LivroAudio
  partesNaFrente?: number
  itemFila?: ItemFilaGeracao
  apagando?: boolean
  partesOffline?: number
  onApagar: (uuid: string) => void
}

export const CardLivroAudio = memo(function CardLivroAudio({
  livro,
  partesNaFrente = 0,
  itemFila,
  apagando = false,
  partesOffline = 0,
  onApagar,
}: CardLivroAudioProps) {
  const navigate = useNavigate()
  const semConexao = useSemConexao()
  const [offlineAberto, setOfflineAberto] = useState(false)
  const alterarFilaMutation = useAlterarFilaLivro()
  const naFila = Boolean(itemFila)
  const alterandoFila = alterarFilaMutation.isPending
  const aparencia = obterAparenciaStatusLivro(livro.status)
  const progresso = calcularProgressoLeitura(livro.paginaAtual, livro.totalPaginas)
  const progressoAudio = obterProgressoAudio(livro, partesNaFrente, itemFila)

  function handleBaixarPdf() {
    abrirPdfEmNovaAba(livro.uuid).catch(() =>
      addToast({ title: 'Não foi possível abrir o PDF', type: 'error' })
    )
  }

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
      bg="bg.panel"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="8px"
      p={5}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      gap={4}
      transition="all 0.2s ease"
      position="relative"
      overflow="hidden"
      _hover={{
        bg: 'bg.muted',
        borderColor: 'border.emphasized',
        shadow: 'lg',
        transform: 'translateY(-2px)',
      }}
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between" align="flex-start" gap={2}>
          <HStack gap={3} align="center" minW={0}>
            <Center
              boxSize={11}
              borderRadius="8px"
              bg="rgba(0, 186, 156, 0.12)"
              color="cirqueira.brand.400"
              border="1px solid"
              borderColor="rgba(0, 186, 156, 0.25)"
              flexShrink={0}
            >
              <BookOpen size={22} />
            </Center>

            <VStack align="flex-start" gap={0.5} minW={0}>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="fg"
                lineClamp={2}
                title={livro.titulo}
              >
                {livro.titulo}
              </Text>
              <Text fontSize="xs" color="fg.subtle">
                {formatarTamanhoLivro(livro.tamanhoTotalBytes ?? livro.tamanhoBytes)}
                {livro.idiomaDescricao ? ` · Voz em ${livro.idiomaDescricao.toLowerCase()}` : ''}
              </Text>
              {partesOffline > 0 && (
                <HStack gap={1} color="cirqueira.brand.300">
                  <CloudCheck size={12} />
                  <Text fontSize="10px" fontWeight="semibold">
                    {partesOffline} parte(s) neste aparelho
                  </Text>
                </HStack>
              )}
            </VStack>
          </HStack>

          <Badge
            size="sm"
            variant="subtle"
            colorPalette={aparencia.paleta}
            borderRadius="full"
            px={2.5}
            py={0.5}
            fontSize="10px"
            fontWeight="bold"
            flexShrink={0}
          >
            {aparencia.rotulo}
          </Badge>
        </HStack>

        <Box bg="bg.muted" borderRadius="8px" p={3}>
          <HStack gap={1.5} align="center" mb={1.5}>
            <Headphones size={13} color="var(--chakra-colors-cirqueira-brand-400)" />
            <Text fontSize="xs" fontWeight="bold" color="cirqueira.grey.100" flex={1} minW={0}>
              {progressoAudio.titulo}
            </Text>
            {itemFila && (
              <Badge
                size="xs"
                variant="subtle"
                colorPalette={itemFila.pausado ? 'gray' : 'brand'}
                fontSize="9px"
                flexShrink={0}
              >
                {itemFila.pausado
                  ? 'Pausado'
                  : itemFila.gerandoAgora
                    ? 'Gerando agora'
                    : `${itemFila.posicao}º na fila`}
              </Badge>
            )}
          </HStack>
          <Progress.Root value={progressoAudio.percentual} size="xs" colorPalette="brand">
            <Progress.Track bg="cirqueira.grey.900" borderRadius="full">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          <Text fontSize="11px" color="cirqueira.grey.400" mt={1.5}>
            {progressoAudio.detalhe}
          </Text>
        </Box>

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
            size="xs"
            variant="ghost"
            borderRadius="full"
            color="cirqueira.grey.400"
            _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
            aria-label="Baixar PDF original"
            title="Baixar PDF original"
            disabled={semConexao}
            onClick={handleBaixarPdf}
          >
            <Download size={14} />
          </IconButton>

          {livro.temAudioParaOuvir && offlineDisponivel() && (
            <IconButton
              size="xs"
              variant="ghost"
              borderRadius="full"
              color={partesOffline > 0 ? 'cirqueira.brand.400' : 'cirqueira.grey.400'}
              _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
              aria-label="Baixar para ouvir sem internet"
              title="Baixar para ouvir sem internet"
              onClick={() => setOfflineAberto(true)}
            >
              <CloudDownload size={14} />
            </IconButton>
          )}

          {naFila && (
            <IconButton
              size="xs"
              variant="ghost"
              borderRadius="full"
              color="cirqueira.grey.400"
              _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
              aria-label={livro.filaPausada ? 'Retomar geração' : 'Pausar geração'}
              title={livro.filaPausada ? 'Retomar a geração do áudio' : 'Pausar a geração do áudio'}
              disabled={alterandoFila || semConexao}
              onClick={() =>
                alterarFilaMutation.mutate({
                  uuid: livro.uuid,
                  acao: livro.filaPausada ? 'retomar' : 'pausar',
                })
              }
            >
              {livro.filaPausada ? <Play size={14} /> : <Pause size={14} />}
            </IconButton>
          )}

          {naFila && itemFila?.posicao !== 1 && (
            <IconButton
              size="xs"
              variant="ghost"
              borderRadius="full"
              color="cirqueira.grey.400"
              _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
              aria-label="Gerar este livro primeiro"
              title="Gerar este livro primeiro"
              disabled={alterandoFila || semConexao}
              onClick={() => alterarFilaMutation.mutate({ uuid: livro.uuid, acao: 'priorizar' })}
            >
              <ArrowUpToLine size={14} />
            </IconButton>
          )}

          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="full"
            color="cirqueira.grey.400"
            _hover={{ color: 'cirqueira.red.500', bg: 'cirqueira.red.500/10' }}
            aria-label="Apagar livro"
            title="Apagar livro"
            disabled={apagando || semConexao}
            onClick={handleApagar}
          >
            <Trash2 size={14} />
          </IconButton>
        </HStack>

        <Button
          size="xs"
          variant="solid"
          borderRadius="full"
          bg="cirqueira.brand.500"
          _hover={{ bg: 'cirqueira.brand.600' }}
          color="cirqueira.grey.0"
          px={3}
          onClick={handleAbrirLeitor}
        >
          {livro.temAudioParaOuvir ? (
            <Play size={13} style={{ marginRight: '4px' }} />
          ) : (
            <BookOpen size={13} style={{ marginRight: '4px' }} />
          )}
          {livro.temAudioParaOuvir ? 'Ouvir agora' : 'Ler PDF'}
        </Button>
      </HStack>

      {offlineAberto && (
        <ModalOfflineLivro
          livro={livro}
          aberto={offlineAberto}
          onFechar={() => setOfflineAberto(false)}
        />
      )}
    </Box>
  )
})
