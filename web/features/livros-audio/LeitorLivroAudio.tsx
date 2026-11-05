import { useSEO } from '@/shared/hooks'
import { Button, Center, Flex, Spinner, Text, VStack } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, TriangleAlert } from 'lucide-react'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { obterUrlPdfLivro } from './api'
import { AvisoProgressoAudio } from './components/AvisoProgressoAudio'
import { BarraSuperiorLeitor } from './components/BarraSuperiorLeitor'
import { LeitorSemPdf } from './components/LeitorSemPdf'
import { type FraseSelecionada, MenuFrase } from './components/MenuFrase'
import type { CliqueTextoPagina } from './components/PaginaPdf'
import { PainelBusca } from './components/PainelBusca'
import { PainelMarcacoes } from './components/PainelMarcacoes'
import { PlayerAudioLivro } from './components/PlayerAudioLivro'
import { VisualizadorLivro } from './components/VisualizadorLivro'
import { buscarLocalizacaoBloco } from './hooks/localizacaoBloco'
import { useDocumentoPdf } from './hooks/useDocumentoPdf'
import { useLeitorLivro } from './hooks/useLeitorLivro'
import {
  useBlocosLivroAudio,
  useLivroAudio,
  useSalvarPosicaoLivroAudio,
} from './hooks/useLivrosAudio'
import {
  useAtualizarMarcacao,
  useCriarMarcacao,
  useMarcacoesLivro,
  useRemoverMarcacao,
} from './hooks/useMarcacoesLivro'
import type { NarracaoAtual } from './hooks/useNarracaoAtual'
import type {
  AlvoReproducao,
  LivroAudio,
  MarcacaoLivro,
  ModoDestaqueNarracao,
  TemaPagina,
} from './types'
import type { ResultadoBusca } from './utils/buscaLivro'
import { encontrarTrechoNaPosicao } from './utils/localizacaoNarracao'
import {
  type PDFDocumentProxy,
  type SegmentoDestaque,
  calcularRetangulosDosSegmentos,
} from './utils/pdf'
import { carimbarPosicao } from './utils/posicao'
import { encontrarBlocoPorPagina } from './utils/sincronizacao'

interface ConteudoLeitorProps {
  livro: LivroAudio
  documento: PDFDocumentProxy
}

const CHAVE_MODO_DESTAQUE = 'livros-audio:modo-destaque'

function lerModoDestaque(): ModoDestaqueNarracao {
  try {
    return localStorage.getItem(CHAVE_MODO_DESTAQUE) === 'palavra' ? 'palavra' : 'frase'
  } catch {
    return 'frase'
  }
}

function salvarModoDestaque(modo: ModoDestaqueNarracao) {
  try {
    localStorage.setItem(CHAVE_MODO_DESTAQUE, modo)
  } catch {}
}

const CHAVE_TEMA_PAGINA = 'livros-audio:tema-pagina'
const ORDEM_TEMAS: TemaPagina[] = ['claro', 'sepia', 'escuro']

function lerTemaPagina(): TemaPagina {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA_PAGINA)
    return ORDEM_TEMAS.includes(salvo as TemaPagina) ? (salvo as TemaPagina) : 'claro'
  } catch {
    return 'claro'
  }
}

function salvarTemaPagina(tema: TemaPagina) {
  try {
    localStorage.setItem(CHAVE_TEMA_PAGINA, tema)
  } catch {}
}

const ConteudoLeitor = memo(function ConteudoLeitor({ livro, documento }: ConteudoLeitorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const salvarPosicaoMutation = useSalvarPosicaoLivroAudio()
  const { data: blocos = [] } = useBlocosLivroAudio(livro.uuid)
  const [acompanharAudio, setAcompanharAudio] = useState(true)
  const [narracao, setNarracao] = useState<NarracaoAtual | null>(null)
  const [modoDestaque, setModoDestaque] = useState<ModoDestaqueNarracao>(lerModoDestaque)
  const [tema, setTema] = useState<TemaPagina>(lerTemaPagina)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [marcacoesAbertas, setMarcacoesAbertas] = useState(false)
  const [resultadoBusca, setResultadoBusca] = useState<ResultadoBusca | null>(null)
  const [frase, setFrase] = useState<FraseSelecionada | null>(null)
  const [alvoReproducao, setAlvoReproducao] = useState<AlvoReproducao | null>(null)
  const segmentosFraseRef = useRef<SegmentoDestaque[]>([])
  const cliqueAtualRef = useRef(0)
  const queryClient = useQueryClient()
  const { data: marcacoes = [], isLoading: carregandoMarcacoes } = useMarcacoesLivro(livro.uuid)
  const criarMarcacaoMutation = useCriarMarcacao(livro.uuid)
  const atualizarMarcacaoMutation = useAtualizarMarcacao(livro.uuid)
  const removerMarcacaoMutation = useRemoverMarcacao(livro.uuid)
  const marcacoesNaPagina = useMemo(
    () => marcacoes.filter((marcacao) => marcacao.tipo !== 'marcador'),
    [marcacoes]
  )
  const totalPaginas = documento.numPages || livro.totalPaginas || 1

  function salvarPosicao(pagina: number, bloco?: number | null, segundos?: number) {
    salvarPosicaoMutation.mutate({
      uuid: livro.uuid,
      posicao: carimbarPosicao(livro.uuid, {
        paginaAtual: pagina,
        blocoAtual: bloco !== undefined ? bloco : livro.blocoAtual,
        segundosNoBloco: segundos ?? 0,
      }),
    })
  }

  function alternarModoDestaque() {
    setModoDestaque((atual) => {
      const novo = atual === 'palavra' ? 'frase' : 'palavra'
      salvarModoDestaque(novo)
      return novo
    })
  }

  function alternarTema() {
    setTema((atual) => {
      const novo = ORDEM_TEMAS[(ORDEM_TEMAS.indexOf(atual) + 1) % ORDEM_TEMAS.length] ?? 'claro'
      salvarTemaPagina(novo)
      return novo
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

  function pedirReproducao(
    dados: Omit<AlvoReproducao, 'id' | 'numeroBloco'> & { numeroBloco?: number | null }
  ) {
    const numeroBloco =
      dados.numeroBloco ?? encontrarBlocoPorPagina(blocos, dados.pagina)?.numeroBloco ?? null
    if (numeroBloco === null) return
    setAcompanharAudio(true)
    irParaPagina(dados.pagina)
    setAlvoReproducao({ ...dados, numeroBloco, id: Date.now() })
  }

  function folhearPara(pagina: number) {
    setAcompanharAudio(false)
    irParaPagina(pagina)
  }

  const tratarCliqueTexto = useCallback(
    async (clique: CliqueTextoPagina) => {
      const id = ++cliqueAtualRef.current
      const bloco = blocos.find(
        (item) => clique.pagina >= item.paginaInicio && clique.pagina <= item.paginaFim
      )
      const selecionada: FraseSelecionada = {
        x: clique.x,
        y: clique.y,
        pagina: clique.pagina,
        numeroBloco: bloco?.numeroBloco ?? null,
        indiceTrecho: null,
        indicePalavra: null,
        texto: null,
        existente: null,
      }
      segmentosFraseRef.current = []

      if (bloco?.isPronto && bloco.possuiTrechos) {
        try {
          const { trechos, localizacoes } = await buscarLocalizacaoBloco(
            queryClient,
            livro.uuid,
            bloco,
            null,
            documento
          )
          const achado = encontrarTrechoNaPosicao(
            localizacoes,
            clique.pagina,
            clique.posicao.item,
            clique.posicao.caractere
          )
          const trecho = achado ? trechos[achado.trecho] : undefined
          if (achado && trecho) {
            selecionada.indiceTrecho = achado.trecho
            selecionada.indicePalavra = achado.palavra
            selecionada.texto = trecho.texto
            segmentosFraseRef.current = localizacoes[achado.trecho]?.segmentos ?? []
            selecionada.existente =
              marcacoes.find(
                (marcacao) =>
                  marcacao.tipo !== 'marcador' &&
                  marcacao.numeroBloco === bloco.numeroBloco &&
                  marcacao.indiceTrecho === achado.trecho
              ) ?? null
          }
        } catch {}
      }

      if (cliqueAtualRef.current === id) setFrase(selecionada)
    },
    [blocos, documento, livro.uuid, marcacoes, queryClient]
  )

  async function ouvirResultadoBusca(resultado: ResultadoBusca) {
    const bloco = blocos.find(
      (item) => resultado.pagina >= item.paginaInicio && resultado.pagina <= item.paginaFim
    )
    const segmento = resultado.segmentos[0]
    if (bloco?.isPronto && bloco.possuiTrechos && segmento) {
      try {
        const { trechos, localizacoes } = await buscarLocalizacaoBloco(
          queryClient,
          livro.uuid,
          bloco,
          null,
          documento
        )
        const achado = encontrarTrechoNaPosicao(
          localizacoes,
          segmento.pagina,
          segmento.itemInicio,
          segmento.caractereInicio
        )
        const trecho = achado ? trechos[achado.trecho] : undefined
        if (achado && trecho) {
          pedirReproducao({
            numeroBloco: bloco.numeroBloco,
            pagina: resultado.pagina,
            indiceTrecho: achado.trecho,
            indicePalavra: achado.palavra,
            texto: trecho.texto,
          })
          return
        }
      } catch {}
    }
    pedirReproducao({ pagina: resultado.pagina, busca: resultado.encontrado })
  }

  async function salvarFrase(tipo: 'destaque' | 'nota', nota?: string) {
    if (!frase) return
    if (frase.existente) {
      await atualizarMarcacaoMutation.mutateAsync({
        marcacao: frase.existente.uuid,
        nota: nota ?? null,
      })
      setFrase(null)
      return
    }
    const retangulos = await calcularRetangulosDosSegmentos(
      documento,
      segmentosFraseRef.current
    ).catch(() => [])
    await criarMarcacaoMutation.mutateAsync({
      tipo,
      pagina: frase.pagina,
      numeroBloco: frase.numeroBloco,
      indiceTrecho: frase.indiceTrecho,
      texto: frase.texto,
      nota: nota ?? null,
      retangulos,
    })
    setFrase(null)
  }

  function ouvirMarcacao(marcacao: MarcacaoLivro) {
    pedirReproducao({
      numeroBloco: marcacao.numeroBloco,
      pagina: marcacao.pagina,
      indiceTrecho: marcacao.indiceTrecho,
      texto: marcacao.texto,
      segundos: marcacao.indiceTrecho === null ? marcacao.segundos : null,
    })
  }

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
        buscaAberta={buscaAberta}
        onAlternarBusca={() => {
          setMarcacoesAbertas(false)
          setBuscaAberta((aberta) => {
            if (aberta) setResultadoBusca(null)
            return !aberta
          })
        }}
        marcacoesAbertas={marcacoesAbertas}
        totalMarcacoes={marcacoes.length}
        onAlternarMarcacoes={() => {
          setBuscaAberta(false)
          setResultadoBusca(null)
          setMarcacoesAbertas((aberta) => !aberta)
        }}
        tema={tema}
        onAlternarTema={alternarTema}
      />

      {buscaAberta && (
        <PainelBusca
          documento={documento}
          resultadoAtivo={resultadoBusca?.id ?? null}
          onSelecionar={(resultado) => {
            setResultadoBusca(resultado)
            folhearPara(resultado.pagina)
          }}
          onOuvir={(resultado) => {
            setResultadoBusca(resultado)
            ouvirResultadoBusca(resultado)
          }}
          onFechar={() => {
            setBuscaAberta(false)
            setResultadoBusca(null)
          }}
        />
      )}

      {marcacoesAbertas && (
        <PainelMarcacoes
          titulo={livro.titulo}
          marcacoes={marcacoes}
          carregando={carregandoMarcacoes}
          onOuvir={ouvirMarcacao}
          onIrParaPagina={folhearPara}
          onSalvarNota={(marcacao, nota) =>
            atualizarMarcacaoMutation.mutate({ marcacao: marcacao.uuid, nota })
          }
          onRemover={(marcacao) => removerMarcacaoMutation.mutate(marcacao.uuid)}
          onFechar={() => setMarcacoesAbertas(false)}
        />
      )}

      {frase && (
        <MenuFrase
          key={`${frase.pagina}-${frase.indiceTrecho}-${frase.x}-${frase.y}`}
          frase={frase}
          salvando={criarMarcacaoMutation.isPending || atualizarMarcacaoMutation.isPending}
          onOuvir={() => {
            pedirReproducao({
              numeroBloco: frase.numeroBloco,
              pagina: frase.pagina,
              indiceTrecho: frase.indiceTrecho,
              indicePalavra: frase.indicePalavra,
              texto: frase.texto,
            })
            setFrase(null)
          }}
          onDestacar={() => salvarFrase('destaque')}
          onSalvarNota={(nota) => salvarFrase('nota', nota)}
          onRemover={(marcacao) => {
            removerMarcacaoMutation.mutate(marcacao.uuid)
            setFrase(null)
          }}
          onFechar={() => setFrase(null)}
        />
      )}

      <VisualizadorLivro
        documento={documento}
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        escala={escala}
        modoDuplo={modoDuplo}
        destaque={narracao?.localizacao ?? null}
        destaquePalavra={modoDestaque === 'palavra' ? (narracao?.localizacaoPalavra ?? null) : null}
        seguirDestaque={acompanharAudio}
        tema={tema}
        marcacoes={marcacoesNaPagina}
        destaqueBusca={resultadoBusca?.segmentos}
        onClicarTexto={tratarCliqueTexto}
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
        modoDestaque={modoDestaque}
        onAlternarModoDestaque={alternarModoDestaque}
        onMudarPaginaLeitor={irParaPagina}
        onAvancarPaginaLeitor={avancarPagina}
        onVoltarPaginaLeitor={voltarPagina}
        onSalvarPosicao={salvarPosicao}
        onSalvarMarcador={() => salvarPosicao(paginaAtual)}
        alvoReproducao={alvoReproducao}
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
