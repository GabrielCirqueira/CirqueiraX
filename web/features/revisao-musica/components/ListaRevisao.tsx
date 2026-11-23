import { useDebounce } from '@/shared/hooks/useDebounce'
import { Box, Button, Checkbox, Flex, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import {
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GitBranch,
  ListChecks,
  ListMusic,
  Music,
  Split,
} from 'lucide-react'
import { type ReactNode, memo, useState } from 'react'
import {
  useAcaoEmLote,
  useAcaoPorFiltro,
  useAceitarSugestoesEmLote,
  useClassificarCanaisEmLote,
  useClassificarCanal,
  useCorrigirVideo,
  useDefinirMusicaEmLote,
  useDescartarDuplicata,
  useListaRevisao,
  useResolverDuplicatasEmLote,
  useUnirMusicas,
  useUnirVariasMusicas,
} from '../hooks'
import type {
  AcaoLoteRevisao,
  ContagensRevisao,
  CorrecaoVideoPayload,
  DuplicataRevisao,
  FiltrosRevisao,
  MusicaDuplicata,
  TipoRevisao,
  VideoRevisao,
} from '../types'
import {
  FILTROS_PADRAO_REVISAO,
  filtraVideos,
  filtrosAtivos,
  payloadAceitarSugestao,
  proximaAbaComPendencias,
  totalPaginas,
} from '../utils'
import { BarraFiltrosRevisao } from './BarraFiltrosRevisao'
import { type AcaoBarraLoteRevisao, BarraLoteRevisao } from './BarraLoteRevisao'
import { CartaoCanalRevisao } from './CartaoCanalRevisao'
import { CartaoDuplicataRevisao } from './CartaoDuplicataRevisao'
import { CartaoVideoRevisao } from './CartaoVideoRevisao'
import { JanelaVersoesDeOutraMusica } from './JanelaVersoesDeOutraMusica'
import { LinhaCompactaVideoRevisao } from './LinhaCompactaVideoRevisao'
import { PainelAcaoFiltroRevisao } from './PainelAcaoFiltroRevisao'
import { type ModoCorrecaoVideo, PainelCorrecaoVideo } from './PainelCorrecaoVideo'

const ESPERA_BUSCA_MS = 300
const ROTULOS_VIDEOS: [string, string] = ['vídeo selecionado', 'vídeos selecionados']
const ROTULOS_CANAIS: [string, string] = ['canal selecionado', 'canais selecionados']
const ROTULOS_PARES: [string, string] = ['par selecionado', 'pares selecionados']

interface AlvoPainel {
  modo: ModoCorrecaoVideo
  videos: VideoRevisao[]
}

function chaveDuplicata(duplicata: DuplicataRevisao): string {
  return duplicata.musicas.map((musica) => musica.uuid).join('-')
}

function ComSelecao({
  selecionado,
  rotulo,
  onAlternar,
  children,
}: {
  selecionado: boolean
  rotulo: string
  onAlternar: () => void
  children: ReactNode
}) {
  return (
    <Flex gap={2} align="start">
      <Checkbox.Root
        checked={selecionado}
        onCheckedChange={onAlternar}
        colorPalette="green"
        size="sm"
        pt={4}
        flexShrink={0}
        aria-label={rotulo}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control borderColor="cirqueira.musica.textoSecundario" />
      </Checkbox.Root>
      <Box flex={1} minW={0}>
        {children}
      </Box>
    </Flex>
  )
}

export interface ListaRevisaoProps {
  tipo: TipoRevisao
  contagens: ContagensRevisao | undefined
  onIrParaAba: (tipo: TipoRevisao) => void
}

export const ListaRevisao = memo(function ListaRevisao({
  tipo,
  contagens,
  onIrParaAba,
}: ListaRevisaoProps) {
  const [pagina, setPagina] = useState(1)
  const [filtros, setFiltros] = useState<FiltrosRevisao>(FILTROS_PADRAO_REVISAO)
  const [compacto, setCompacto] = useState(true)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [painel, setPainel] = useState<AlvoPainel | null>(null)
  const buscaAdiada = useDebounce(filtros.busca, ESPERA_BUSCA_MS)
  const filtrosConsulta = { ...filtros, busca: buscaAdiada }
  const { data, isLoading, isError, isPlaceholderData } = useListaRevisao(
    tipo,
    pagina,
    filtrosConsulta
  )
  const corrigir = useCorrigirVideo(tipo)
  const lote = useDefinirMusicaEmLote(tipo)
  const canal = useClassificarCanal(tipo)
  const unir = useUnirMusicas(tipo)
  const unirVarias = useUnirVariasMusicas(tipo)
  const descartar = useDescartarDuplicata()
  const acaoLote = useAcaoEmLote(tipo)
  const acaoFiltro = useAcaoPorFiltro(tipo)
  const aceitarLote = useAceitarSugestoesEmLote(tipo)
  const canaisLote = useClassificarCanaisEmLote()
  const duplicatasLote = useResolverDuplicatasEmLote()
  const [versoesDe, setVersoesDe] = useState<MusicaDuplicata[] | null>(null)

  const paginas = totalPaginas(data)
  const videos = data?.videos ?? []
  const canais = data?.canais ?? []
  const duplicatas = data?.duplicatas ?? []
  const chavesPagina =
    tipo === 'canal_novo'
      ? canais.map((item) => item.canal)
      : tipo === 'possivel_duplicata'
        ? duplicatas.map(chaveDuplicata)
        : videos.map((video) => video.uuid)
  const marcados = selecionados.filter((chave) => chavesPagina.includes(chave))
  const videosSelecionados = videos.filter((video) => marcados.includes(video.uuid))
  const comSugestao = videosSelecionados.filter((video) => payloadAceitarSugestao(video) !== null)
  const ocupadoLote =
    acaoLote.isPending ||
    aceitarLote.isPending ||
    canaisLote.isPending ||
    duplicatasLote.isPending ||
    lote.isPending

  function alternarSelecao(chave: string) {
    setSelecionados((atuais) =>
      atuais.includes(chave) ? atuais.filter((item) => item !== chave) : [...atuais, chave]
    )
  }

  function alternarTodos() {
    setSelecionados(marcados.length === chavesPagina.length ? [] : chavesPagina)
  }

  function limparSelecao() {
    setSelecionados([])
  }

  function mudarFiltros(novos: FiltrosRevisao) {
    setFiltros(novos)
    setPagina(1)
    limparSelecao()
  }

  function aplicarCorrecao(video: VideoRevisao, payload: CorrecaoVideoPayload) {
    setSelecionados((atuais) => atuais.filter((item) => item !== video.uuid))
    corrigir.mutate({ videoUuid: video.uuid, payload }, { onSuccess: () => setPainel(null) })
  }

  function confirmarPainel(payload: CorrecaoVideoPayload) {
    const video = painel?.videos[0]
    if (video) aplicarCorrecao(video, payload)
  }

  function confirmarLote(musicaUuid: string) {
    const videoUuids = painel?.videos.map((video) => video.uuid) ?? []
    lote.mutate(
      { videoUuids, musicaUuid },
      {
        onSuccess: () => {
          setPainel(null)
          limparSelecao()
        },
      }
    )
  }

  function aplicarAcaoVideos(acao: AcaoLoteRevisao) {
    acaoLote.mutate({ videoUuids: videosSelecionados.map((video) => video.uuid), acao })
    limparSelecao()
  }

  function mudarPagina(nova: number) {
    limparSelecao()
    setPagina(nova)
  }

  const acoesBarra: AcaoBarraLoteRevisao[] =
    tipo === 'canal_novo'
      ? [
          {
            chave: 'musica',
            rotulo: 'Sempre música',
            icone: <Music size={12} />,
            destaque: true,
            onClick: () => {
              canaisLote.mutate({ canais: marcados, classificacao: 'musica' })
              limparSelecao()
            },
          },
          {
            chave: 'nao_musica',
            rotulo: 'Nunca música',
            icone: <Ban size={12} />,
            onClick: () => {
              canaisLote.mutate({ canais: marcados, classificacao: 'nao_musica' })
              limparSelecao()
            },
          },
        ]
      : tipo === 'possivel_duplicata'
        ? [
            {
              chave: 'principal',
              rotulo: 'Mais ouvida vira a principal',
              icone: <GitBranch size={12} />,
              destaque: true,
              onClick: () => {
                duplicatasLote.mutate({
                  pares: duplicatas.filter((par) => marcados.includes(chaveDuplicata(par))),
                  modo: 'mais_ouvida_principal',
                })
                limparSelecao()
              },
            },
            {
              chave: 'diferentes',
              rotulo: 'São músicas diferentes',
              icone: <Split size={12} />,
              onClick: () => {
                duplicatasLote.mutate({
                  pares: duplicatas.filter((par) => marcados.includes(chaveDuplicata(par))),
                  modo: 'diferentes',
                })
                limparSelecao()
              },
            },
          ]
        : [
            {
              chave: 'aceitar',
              rotulo:
                comSugestao.length > 0 && comSugestao.length < videosSelecionados.length
                  ? `Aceitar sugestões (${comSugestao.length})`
                  : 'Aceitar sugestões',
              icone: <Check size={12} />,
              destaque: true,
              desabilitada: comSugestao.length === 0,
              onClick: () => {
                aceitarLote.mutate(comSugestao)
                limparSelecao()
              },
            },
            {
              chave: 'mesma',
              rotulo: 'São todos a mesma música',
              icone: <ListChecks size={12} />,
              onClick: () => setPainel({ modo: 'escolher', videos: videosSelecionados }),
            },
            ...(tipo === 'compilacao'
              ? [
                  {
                    chave: 'compilacao',
                    rotulo: 'Manter como compilação',
                    icone: <ListMusic size={12} />,
                    onClick: () => aplicarAcaoVideos('manter_compilacao'),
                  },
                ]
              : []),
            {
              chave: 'nao_musica',
              rotulo: 'Não é música',
              icone: <Ban size={12} />,
              onClick: () => aplicarAcaoVideos('nao_musica'),
            },
          ]

  const acoesFiltro: AcaoLoteRevisao[] =
    tipo === 'compilacao' ? ['manter_compilacao', 'nao_musica'] : ['nao_musica']
  const mostrarAcaoFiltro =
    filtraVideos(tipo) &&
    (data?.total ?? 0) > 0 &&
    (filtrosAtivos(filtrosConsulta) || tipo === 'indisponivel' || tipo === 'compilacao')

  const barraFiltros = (
    <BarraFiltrosRevisao
      tipo={tipo}
      filtros={filtros}
      compacto={compacto}
      onMudar={mudarFiltros}
      onAlternarCompacto={() => setCompacto((atual) => !atual)}
    />
  )

  if (isLoading) {
    return (
      <VStack align="stretch" gap={3}>
        {barraFiltros}
        <Skeleton h="220px" borderRadius="12px" />
        <Skeleton h="220px" borderRadius="12px" />
      </VStack>
    )
  }

  if (isError || !data) {
    return (
      <VStack align="stretch" gap={3}>
        {barraFiltros}
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario" py={8} textAlign="center">
          Não foi possível carregar a revisão. Tente de novo em instantes.
        </Text>
      </VStack>
    )
  }

  const vazio = chavesPagina.length === 0
  const comFiltro = filtrosAtivos(filtrosConsulta)
  const proximaAba = vazio && !comFiltro ? proximaAbaComPendencias(contagens, tipo) : null

  return (
    <VStack align="stretch" gap={3} opacity={isPlaceholderData ? 0.7 : 1}>
      {barraFiltros}

      {comFiltro && (
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
          {data.total} {data.total === 1 ? 'resultado' : 'resultados'} com estes filtros.
        </Text>
      )}

      {mostrarAcaoFiltro && (
        <PainelAcaoFiltroRevisao
          key={JSON.stringify(filtrosConsulta)}
          total={data.total}
          acoes={acoesFiltro}
          ocupado={acaoFiltro.isPending}
          descricao={
            comFiltro
              ? 'Resolver de uma vez todos os vídeos deste filtro (não só os desta página):'
              : 'Resolver de uma vez todos os vídeos desta aba:'
          }
          onAplicar={(acao) => {
            acaoFiltro.mutate({ filtros: filtrosConsulta, acao })
            limparSelecao()
          }}
        />
      )}

      {!vazio && (
        <BarraLoteRevisao
          quantidade={marcados.length}
          totalPagina={chavesPagina.length}
          rotuloItens={
            tipo === 'canal_novo'
              ? ROTULOS_CANAIS
              : tipo === 'possivel_duplicata'
                ? ROTULOS_PARES
                : ROTULOS_VIDEOS
          }
          ocupado={ocupadoLote}
          acoes={acoesBarra}
          onAlternarTodos={alternarTodos}
          onLimpar={limparSelecao}
        />
      )}

      {vazio && (
        <VStack
          py={10}
          px={4}
          gap={3}
          borderRadius="12px"
          bg="cirqueira.musica.cartao"
          color="cirqueira.musica.textoSecundario"
          textAlign="center"
        >
          <CheckCircle2 size={32} color="var(--chakra-colors-cirqueira-musica-verde)" />
          <Text fontSize="md" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
            {comFiltro ? 'Nada com estes filtros' : 'Nada para revisar nesta categoria'}
          </Text>
          {comFiltro ? (
            <Button
              size="sm"
              variant="ghost"
              color="cirqueira.musica.textoSecundario"
              onClick={() =>
                mudarFiltros({ ...FILTROS_PADRAO_REVISAO, porPagina: filtros.porPagina })
              }
            >
              Limpar filtros
            </Button>
          ) : proximaAba ? (
            <Button
              size="sm"
              borderRadius="full"
              bg="cirqueira.musica.verde"
              color="cirqueira.musica.fundo"
              _hover={{ bg: 'cirqueira.musica.verdeHover' }}
              onClick={() => onIrParaAba(proximaAba.tipo)}
            >
              Ir para {proximaAba.rotulo} ({contagens?.[proximaAba.tipo] ?? 0})
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Text fontSize="sm">Todas as categorias estão em dia.</Text>
          )}
        </VStack>
      )}

      {videos.length > 0 && (
        <VStack align="stretch" gap={compacto ? 1.5 : 3}>
          {videos.map((video) =>
            compacto ? (
              <LinhaCompactaVideoRevisao
                key={video.uuid}
                video={video}
                selecionado={marcados.includes(video.uuid)}
                ocupado={corrigir.isPending && corrigir.variables?.videoUuid === video.uuid}
                onAlternarSelecao={alternarSelecao}
                onCorrigir={aplicarCorrecao}
                onEscolherMusica={(alvo) => setPainel({ modo: 'escolher', videos: [alvo] })}
              />
            ) : (
              <CartaoVideoRevisao
                key={video.uuid}
                video={video}
                tipo={tipo}
                selecionado={marcados.includes(video.uuid)}
                ocupado={corrigir.isPending && corrigir.variables?.videoUuid === video.uuid}
                onAlternarSelecao={alternarSelecao}
                onCorrigir={aplicarCorrecao}
                onEscolherMusica={(alvo) => setPainel({ modo: 'escolher', videos: [alvo] })}
                onMarcarMashup={(alvo) => setPainel({ modo: 'mashup', videos: [alvo] })}
                onClassificarCanal={(nome, classificacao) =>
                  canal.mutate({ canal: nome, classificacao })
                }
              />
            )
          )}
        </VStack>
      )}

      {canais.map((item) => (
        <ComSelecao
          key={item.canal}
          selecionado={marcados.includes(item.canal)}
          rotulo={`Selecionar o canal ${item.canal}`}
          onAlternar={() => alternarSelecao(item.canal)}
        >
          <CartaoCanalRevisao
            canal={item}
            ocupado={canal.isPending && canal.variables?.canal === item.canal}
            onClassificar={(nome, classificacao) => canal.mutate({ canal: nome, classificacao })}
          />
        </ComSelecao>
      ))}

      {duplicatas.map((duplicata) => (
        <ComSelecao
          key={chaveDuplicata(duplicata)}
          selecionado={marcados.includes(chaveDuplicata(duplicata))}
          rotulo="Selecionar este par"
          onAlternar={() => alternarSelecao(chaveDuplicata(duplicata))}
        >
          <CartaoDuplicataRevisao
            duplicata={duplicata}
            ocupado={unir.isPending || descartar.isPending || unirVarias.isPending}
            onUnir={(origemUuid, destinoUuid) => unir.mutate({ origemUuid, destinoUuid })}
            onDescartar={(origemUuid, destinoUuid) => descartar.mutate({ origemUuid, destinoUuid })}
            onVersoesDeOutra={(alvo) => setVersoesDe(alvo.musicas)}
          />
        </ComSelecao>
      ))}

      {paginas > 1 && (
        <HStack justify="center" gap={1} pt={2}>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Primeira página"
            disabled={pagina <= 1}
            onClick={() => mudarPagina(1)}
          >
            <ChevronsLeft size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Página anterior"
            disabled={pagina <= 1}
            onClick={() => mudarPagina(pagina - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario" px={2}>
            Página {pagina} de {paginas}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Próxima página"
            disabled={pagina >= paginas}
            onClick={() => mudarPagina(pagina + 1)}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Última página"
            disabled={pagina >= paginas}
            onClick={() => mudarPagina(paginas)}
          >
            <ChevronsRight size={16} />
          </Button>
        </HStack>
      )}

      {painel && (
        <PainelCorrecaoVideo
          key={`${painel.modo}-${painel.videos.map((video) => video.uuid).join('-')}`}
          modo={painel.modo}
          videos={painel.videos}
          salvando={corrigir.isPending || lote.isPending}
          onFechar={() => setPainel(null)}
          onConfirmar={confirmarPainel}
          onConfirmarLote={confirmarLote}
        />
      )}

      <JanelaVersoesDeOutraMusica
        musicas={versoesDe}
        ocupado={unirVarias.isPending}
        onFechar={() => setVersoesDe(null)}
        onConfirmar={(origemUuids, destinoUuid) => {
          unirVarias.mutate({ origemUuids, destinoUuid })
          setVersoesDe(null)
        }}
      />
    </VStack>
  )
})
