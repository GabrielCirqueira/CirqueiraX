import { useSEO } from '@/shared/hooks'
import { Button, Center, Flex, Spinner, Text, VStack } from '@chakra-ui/react'
import { ArrowLeft, BookOpen, TriangleAlert } from 'lucide-react'
import { memo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { obterUrlPdfLivro } from './api'
import { AvisoProgressoAudio } from './components/AvisoProgressoAudio'
import { BarraSuperiorLeitor } from './components/BarraSuperiorLeitor'
import { LeitorSemPdf } from './components/LeitorSemPdf'
import { PlayerAudioLivro } from './components/PlayerAudioLivro'
import { VisualizadorLivro } from './components/VisualizadorLivro'
import { useDocumentoPdf } from './hooks/useDocumentoPdf'
import { useLeitorLivro } from './hooks/useLeitorLivro'
import {
  useBlocosLivroAudio,
  useLivroAudio,
  useSalvarPosicaoLivroAudio,
} from './hooks/useLivrosAudio'
import type { NarracaoAtual } from './hooks/useNarracaoAtual'
import type { LivroAudio } from './types'
import type { PDFDocumentProxy } from './utils/pdf'

interface ConteudoLeitorProps {
  livro: LivroAudio
  documento: PDFDocumentProxy
}

const ConteudoLeitor = memo(function ConteudoLeitor({ livro, documento }: ConteudoLeitorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const salvarPosicaoMutation = useSalvarPosicaoLivroAudio()
  const { data: blocos = [] } = useBlocosLivroAudio(livro.uuid)
  const [acompanharAudio, setAcompanharAudio] = useState(true)
  const [narracao, setNarracao] = useState<NarracaoAtual | null>(null)
  const totalPaginas = documento.numPages || livro.totalPaginas || 1

  function salvarPosicao(pagina: number, bloco?: number | null, segundos?: number) {
    salvarPosicaoMutation.mutate({
      uuid: livro.uuid,
      posicao: {
        paginaAtual: pagina,
        blocoAtual: bloco !== undefined ? bloco : livro.blocoAtual,
        segundosNoBloco: segundos ?? 0,
      },
    })
  }

  const {
    paginaAtual,
    escala,
    modoDuplo,
    telaCheia,
    irParaPagina,
    avancarPagina,
    voltarPagina,
    aumentarZoom,
    diminuirZoom,
    resetarZoom,
    definirEscala,
    alternarModoDuplo,
    alternarTelaCheia,
  } = useLeitorLivro({
    paginaInicial: livro.paginaAtual,
    totalPaginas,
    onSalvarPosicao: salvarPosicao,
  })

  return (
    <Flex
      ref={containerRef}
      direction="column"
      w="full"
      h="100vh"
      bg="cirqueira.grey.950"
      overflow="hidden"
      position="fixed"
      inset={0}
      zIndex={50}
    >
      <BarraSuperiorLeitor
        titulo={livro.titulo}
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        modoDuplo={modoDuplo}
        escala={escala}
        telaCheia={telaCheia}
        onAumentarZoom={aumentarZoom}
        onDiminuirZoom={diminuirZoom}
        onResetarZoom={resetarZoom}
        onDefinirEscala={definirEscala}
        onAlternarModoDuplo={alternarModoDuplo}
        onAlternarTelaCheia={() => alternarTelaCheia(containerRef.current)}
      />

      <VisualizadorLivro
        documento={documento}
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        escala={escala}
        modoDuplo={modoDuplo}
        destaque={narracao?.localizacao ?? null}
        seguirDestaque={acompanharAudio}
        onAvancar={avancarPagina}
        onVoltar={voltarPagina}
      />

      <AvisoProgressoAudio livro={livro} />

      <PlayerAudioLivro
        livro={livro}
        blocos={blocos}
        documento={documento}
        modoDuplo={modoDuplo}
        onNarracaoAtual={setNarracao}
        paginaAtualLeitor={paginaAtual}
        totalPaginas={totalPaginas}
        marcadorSalvo={livro.paginaAtual}
        salvandoMarcador={salvarPosicaoMutation.isPending}
        acompanharAudio={acompanharAudio}
        onAlternarAcompanharAudio={() => setAcompanharAudio((prev) => !prev)}
        onMudarPaginaLeitor={irParaPagina}
        onAvancarPaginaLeitor={avancarPagina}
        onVoltarPaginaLeitor={voltarPagina}
        onSalvarPosicao={salvarPosicao}
        onSalvarMarcador={() => salvarPosicao(paginaAtual)}
      />
    </Flex>
  )
})

export function Component() {
  const { uuid = '' } = useParams<{ uuid: string }>()
  const navigate = useNavigate()

  const { data: livro, isLoading: carregandoLivro, isError: erroLivro } = useLivroAudio(uuid)

  useSEO({
    title: livro ? `${livro.titulo} — Leitor` : 'Leitor de Livros em Áudio',
    description: 'Visualizador de livros em formato de livro com sincronização de leitura.',
  })

  const urlPdf = livro ? obterUrlPdfLivro(livro.uuid) : null
  const { data: documento, isLoading: carregandoPdf } = useDocumentoPdf(urlPdf)

  if (carregandoLivro || carregandoPdf) {
    return (
      <Center w="full" h="80vh">
        <VStack gap={4}>
          <Center
            boxSize={14}
            borderRadius="2xl"
            bg="cirqueira.brand.500/15"
            color="cirqueira.brand.400"
          >
            <BookOpen size={28} />
          </Center>
          <VStack gap={1}>
            <Text fontSize="md" fontWeight="bold" color="cirqueira.grey.0">
              Abrindo livro...
            </Text>
            <Text fontSize="xs" color="cirqueira.grey.500">
              Carregando páginas e recuperando sua posição salva
            </Text>
          </VStack>
          <Spinner size="md" color="cirqueira.brand.500" mt={2} />
        </VStack>
      </Center>
    )
  }

  if (erroLivro || !livro) {
    return (
      <Center w="full" h="80vh">
        <VStack gap={4} maxW="md" textAlign="center" p={6}>
          <Center
            boxSize={14}
            borderRadius="2xl"
            bg="cirqueira.red.500/15"
            color="cirqueira.red.400"
          >
            <TriangleAlert size={28} />
          </Center>
          <VStack gap={1}>
            <Text fontSize="lg" fontWeight="bold" color="cirqueira.grey.0">
              Não foi possível abrir o livro
            </Text>
            <Text fontSize="xs" color="cirqueira.grey.400">
              O livro pode ter sido apagado ou você não possui permissão para acessá-lo.
            </Text>
          </VStack>
          <Button
            size="sm"
            borderRadius="lg"
            bg="cirqueira.grey.800"
            _hover={{ bg: 'cirqueira.grey.700' }}
            color="cirqueira.grey.0"
            onClick={() => navigate('/livros-audio')}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Voltar para a biblioteca
          </Button>
        </VStack>
      </Center>
    )
  }

  if (!documento) {
    return <LeitorSemPdf key={livro.uuid} livro={livro} />
  }

  return <ConteudoLeitor key={livro.uuid} livro={livro} documento={documento} />
}

export default Component
