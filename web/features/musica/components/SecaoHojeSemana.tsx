import { Badge, Box, Button, Flex, HStack, Heading, Skeleton, Text, VStack } from '@chakra-ui/react'
import { Disc3, ListOrdered, Music2, Users } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import type { FiltroIntervaloRankingParams, PeriodoMusicasItem } from '../api'
import {
  useCapsulasMusica,
  useImagensItensMusica,
  useImagensMusica,
  useRankingIntervaloMusica,
} from '../hooks'
import type { AlbumAnalise, RespostaConsultaImagens, ResumoGeralMusica } from '../types'
import {
  formatarPercentualVariacao,
  gerarChaveArtista,
  gerarChaveFaixa,
  linhasRankingAlbuns,
  linhasRankingArtistas,
  linhasRankingMusicas,
} from '../utils'
import { ItemRankingAlbum, ItemRankingArtistaLinha, ItemRankingFaixa } from './ItensRankingMusica'
import { MinutosMusica } from './MinutosMusica'
import { ModalTop50Musica } from './ModalTop50Musica'
import { CHAVE_PERIODO_ANO, CHAVE_PERIODO_MES, SeletorPeriodoMusica } from './SeletorPeriodoMusica'
import { TabelaRankingMusica } from './TabelaRankingMusica'

export interface SecaoHojeSemanaProps {
  resumo?: ResumoGeralMusica
  carregando?: boolean
  mapaImagens?: RespostaConsultaImagens
  /** visao = top 5; rankings = top 5 + modal completo */
  modo?: 'visao' | 'rankings'
}

type TipoFiltroSecao = 'dias' | 'ontem' | 'mes' | 'ano' | 'todos' | 'personalizado'

type AbaRanking = 'musicas' | 'artistas' | 'albuns'

const TITULOS_ABA: Record<AbaRanking, string> = {
  musicas: 'Músicas Mais Ouvidas',
  artistas: 'Artistas Mais Ouvidos',
  albuns: 'Álbuns Mais Ouvidos',
}

const SEM_ALBUNS: AlbumAnalise[] = []

const ROTULO_ONTEM = 'Ontem'

const OPCOES_DIAS: { rotulo: string; tipo: 'dias' | 'ontem'; dias: number }[] = [
  { rotulo: 'Hoje', tipo: 'dias', dias: 1 },
  { rotulo: ROTULO_ONTEM, tipo: 'ontem', dias: 1 },
  { rotulo: '7 dias', tipo: 'dias', dias: 7 },
  { rotulo: '14 dias', tipo: 'dias', dias: 14 },
  { rotulo: '30 dias', tipo: 'dias', dias: 30 },
  { rotulo: '90 dias', tipo: 'dias', dias: 90 },
]

function formatarDataCurta(data: string): string {
  const [ano, mes, dia] = data.split('-')
  return dia && mes && ano ? `${dia}/${mes}/${ano.slice(2)}` : data
}

function dataLocalDeslocada(dias: number): string {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

const NOMES_MESES = [
  { valor: 1, rotulo: 'Janeiro' },
  { valor: 2, rotulo: 'Fevereiro' },
  { valor: 3, rotulo: 'Março' },
  { valor: 4, rotulo: 'Abril' },
  { valor: 5, rotulo: 'Maio' },
  { valor: 6, rotulo: 'Junho' },
  { valor: 7, rotulo: 'Julho' },
  { valor: 8, rotulo: 'Agosto' },
  { valor: 9, rotulo: 'Setembro' },
  { valor: 10, rotulo: 'Outubro' },
  { valor: 11, rotulo: 'Novembro' },
  { valor: 12, rotulo: 'Dezembro' },
]

export const SecaoHojeSemana = memo(function SecaoHojeSemana({
  resumo,
  carregando = false,
  mapaImagens,
  modo = 'visao',
}: SecaoHojeSemanaProps) {
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltroSecao>('dias')
  const [diasSelecionados, setDiasSelecionados] = useState<number>(1)
  const [top50Aberto, setTop50Aberto] = useState(false)
  const [anoSelecionado, setAnoSelecionado] = useState<number>(() => new Date().getFullYear())
  const [mesSelecionado, setMesSelecionado] = useState<number>(() => new Date().getMonth() + 1)
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10)
  })

  const [aba, setAba] = useState<AbaRanking>('musicas')

  const { data: mesesDisponiveis } = useCapsulasMusica()

  const anosDisponiveis = useMemo(() => {
    const anoAtual = new Date().getFullYear()
    if (!mesesDisponiveis || mesesDisponiveis.length === 0) {
      return [anoAtual, anoAtual - 1, anoAtual - 2]
    }
    const anos = Array.from(new Set(mesesDisponiveis.map((m) => m.ano)))
    if (!anos.includes(anoAtual)) {
      anos.unshift(anoAtual)
    }
    return anos.sort((a, b) => b - a)
  }, [mesesDisponiveis])

  const paramsRanking = useMemo<FiltroIntervaloRankingParams>(() => {
    if (tipoFiltro === 'dias') {
      return { tipo: 'dias', dias: diasSelecionados, limite: 50 }
    }
    if (tipoFiltro === 'ontem') {
      const ontem = dataLocalDeslocada(-1)
      return { tipo: 'personalizado', inicio: ontem, fim: ontem, limite: 50 }
    }
    if (tipoFiltro === 'mes') {
      return { tipo: 'mes', ano: anoSelecionado, mes: mesSelecionado, limite: 50 }
    }
    if (tipoFiltro === 'ano') {
      return { tipo: 'ano', ano: anoSelecionado, limite: 50 }
    }
    if (tipoFiltro === 'todos') {
      return { tipo: 'todos', limite: 50 }
    }
    return {
      tipo: 'personalizado',
      inicio: dataInicioPersonalizada,
      fim: dataFimPersonalizada,
      limite: 50,
    }
  }, [
    tipoFiltro,
    diasSelecionados,
    anoSelecionado,
    mesSelecionado,
    dataInicioPersonalizada,
    dataFimPersonalizada,
  ])

  const periodoMusicasItem = useMemo<PeriodoMusicasItem>(() => {
    const { limite: _limite, ...periodo } = paramsRanking
    return periodo
  }, [paramsRanking])

  const ehPadraoHoje = tipoFiltro === 'dias' && diasSelecionados === 1
  const ehPadraoSemana = tipoFiltro === 'dias' && diasSelecionados === 7
  const periodoCobertoPeloResumo = ehPadraoHoje || ehPadraoSemana

  const usarResumoLocal =
    (ehPadraoHoje && Boolean(resumo?.hoje)) || (ehPadraoSemana && Boolean(resumo?.semana))

  const { data: dadosRankingRemoto, isLoading: carregandoRanking } = useRankingIntervaloMusica(
    paramsRanking,
    !periodoCobertoPeloResumo || (Boolean(resumo) && !usarResumoLocal)
  )

  const dadosAtivos = useMemo(() => {
    if (dadosRankingRemoto) {
      return dadosRankingRemoto
    }
    if (ehPadraoHoje && resumo?.hoje) {
      return {
        totalMinutos: resumo.hoje.totalMinutos,
        totalStreams: resumo.hoje.totalStreams,
        variacaoMinutosPercentual: resumo.hoje.variacaoMinutosPercentual,
        topMusicas: resumo.hoje.topMusicas,
        topArtistas: resumo.hoje.topArtistas,
        rotuloPeriodo: 'Hoje',
        dataInicio: '',
        dataFim: '',
      }
    }
    if (ehPadraoSemana && resumo?.semana) {
      return {
        totalMinutos: resumo.semana.totalMinutos,
        totalStreams: resumo.semana.totalStreams,
        variacaoMinutosPercentual: resumo.semana.variacaoMinutosPercentual,
        topMusicas: resumo.semana.topMusicas,
        topArtistas: resumo.semana.topArtistas,
        rotuloPeriodo: 'Últimos 7 dias',
        dataInicio: '',
        dataFim: '',
      }
    }
    return null
  }, [dadosRankingRemoto, ehPadraoHoje, ehPadraoSemana, resumo])

  const chavesFaltantesRanking = useMemo(() => {
    if (!dadosAtivos) return []
    const chaves: string[] = []
    dadosAtivos.topMusicas.forEach((m) => {
      if (!m.imagemUrl) {
        chaves.push(gerarChaveFaixa(m.codigoFaixa, m.artistaPrincipal, m.nomeFaixa))
      }
    })
    dadosAtivos.topArtistas.forEach((a) => {
      if (!a.imagemUrl) {
        chaves.push(gerarChaveArtista(a.codigoArtista, a.nomeArtista))
      }
    })
    return chaves
  }, [dadosAtivos])

  const { data: mapaImagensRanking } = useImagensMusica(chavesFaltantesRanking)

  const topAlbuns = dadosRankingRemoto?.topAlbuns ?? SEM_ALBUNS
  const imagemAlbum = useImagensItensMusica(topAlbuns)

  const mapaImagensCompleto = useMemo(() => {
    return {
      ...(mapaImagens ?? {}),
      ...(mapaImagensRanking ?? {}),
    }
  }, [mapaImagens, mapaImagensRanking])

  if (carregando && !resumo && !dadosAtivos) {
    return (
      <VStack gap={4} align="stretch" w="full">
        <Skeleton h="40px" w="200px" borderRadius="full" />
        <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Skeleton h="240px" borderRadius="8px" />
          <Skeleton h="240px" borderRadius="8px" />
        </Box>
      </VStack>
    )
  }

  const totalMinutos = dadosAtivos?.totalMinutos ?? 0
  const totalStreams = dadosAtivos?.totalStreams ?? 0
  const variacao = dadosAtivos?.variacaoMinutosPercentual ?? null

  const topMusicas = dadosAtivos?.topMusicas ?? []
  const topArtistas = dadosAtivos?.topArtistas ?? []

  const topMusicasExibidas = topMusicas.slice(0, 5)
  const topArtistasExibidos = topArtistas.slice(0, 5)

  const rotuloAtivo =
    (tipoFiltro === 'ontem' ? ROTULO_ONTEM : null) ??
    dadosAtivos?.rotuloPeriodo ??
    (tipoFiltro === 'dias'
      ? (OPCOES_DIAS.find((o) => o.dias === diasSelecionados)?.rotulo ?? 'Período')
      : tipoFiltro === 'mes'
        ? `${NOMES_MESES.find((m) => m.valor === mesSelecionado)?.rotulo} de ${anoSelecionado}`
        : tipoFiltro === 'ano'
          ? `Ano de ${anoSelecionado}`
          : tipoFiltro === 'todos'
            ? 'Desde sempre'
            : 'Personalizado')

  const opcoesSeletor = [
    ...OPCOES_DIAS.map((opcao) => ({
      chave: opcao.tipo === 'ontem' ? 'ontem' : `d${opcao.dias}`,
      rotulo: opcao.rotulo,
    })),
    { chave: 'todos', rotulo: 'Sempre' },
  ]
  const chaveSelecionada =
    tipoFiltro === 'dias'
      ? `d${diasSelecionados}`
      : tipoFiltro === 'mes'
        ? CHAVE_PERIODO_MES
        : tipoFiltro === 'ano'
          ? CHAVE_PERIODO_ANO
          : tipoFiltro
  const rotuloSeletor =
    tipoFiltro === 'mes'
      ? `${NOMES_MESES.find((m) => m.valor === mesSelecionado)?.rotulo} de ${anoSelecionado}`
      : tipoFiltro === 'ano'
        ? `Ano de ${anoSelecionado}`
        : tipoFiltro === 'personalizado'
          ? `${formatarDataCurta(dataInicioPersonalizada)} – ${formatarDataCurta(dataFimPersonalizada)}`
          : undefined

  function selecionarPreset(chave: string) {
    if (chave === 'ontem' || chave === 'todos') {
      setTipoFiltro(chave)
      return
    }
    setTipoFiltro('dias')
    setDiasSelecionados(Number(chave.slice(1)))
  }

  const linhasTabela =
    aba === 'musicas'
      ? linhasRankingMusicas(
          topMusicas,
          (musica) =>
            musica.imagemUrl ??
            mapaImagensCompleto?.[
              gerarChaveFaixa(musica.codigoFaixa, musica.artistaPrincipal, musica.nomeFaixa)
            ]?.imagemUrl ??
            null
        )
      : aba === 'artistas'
        ? linhasRankingArtistas(
            topArtistas,
            (artista) =>
              artista.imagemUrl ??
              mapaImagensCompleto?.[gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)]
                ?.imagemUrl ??
              null
          )
        : linhasRankingAlbuns(topAlbuns, imagemAlbum)

  return (
    <VStack gap={4} align="stretch" w="full" maxW="100%">
      <VStack gap={2.5} align="stretch" w="full" maxW="100%">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={2.5}
          w="full"
          maxW="100%"
        >
          <SeletorPeriodoMusica
            opcoes={opcoesSeletor}
            selecionada={chaveSelecionada}
            rotuloSelecionado={rotuloSeletor}
            onSelecionar={selecionarPreset}
            mes={{
              ano: anoSelecionado,
              mes: mesSelecionado,
              anos: anosDisponiveis,
              onAplicar: (ano, mes) => {
                setTipoFiltro('mes')
                setAnoSelecionado(ano)
                setMesSelecionado(mes)
              },
            }}
            ano={{
              ano: anoSelecionado,
              anos: anosDisponiveis,
              onAplicar: (ano) => {
                setTipoFiltro('ano')
                setAnoSelecionado(ano)
              },
            }}
            personalizado={{
              inicio: dataInicioPersonalizada,
              fim: dataFimPersonalizada,
              onAplicar: (inicio, fim) => {
                setTipoFiltro('personalizado')
                setDataInicioPersonalizada(inicio)
                setDataFimPersonalizada(fim)
              },
            }}
          />

          <Flex
            justify={{ base: 'space-between', md: 'flex-end' }}
            align="center"
            gap={{ base: 3, md: 4 }}
            w={{ base: 'full', md: 'auto' }}
            px={{ base: 1, md: 0 }}
            flexShrink={0}
          >
            <HStack gap={1.5} align="center">
              <Text fontSize={{ base: '2xs', sm: 'xs' }} color="cirqueira.musica.textoSecundario">
                Tempo ouvido:
              </Text>
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="bold"
                color="cirqueira.musica.verde"
              >
                <MinutosMusica minutos={totalMinutos} />
              </Text>
              {variacao !== null && (
                <Badge size="xs" variant="subtle" colorPalette={variacao >= 0 ? 'green' : 'red'}>
                  {formatarPercentualVariacao(variacao)}
                </Badge>
              )}
            </HStack>
            <HStack gap={1.5} align="center">
              <Text fontSize={{ base: '2xs', sm: 'xs' }} color="cirqueira.musica.textoSecundario">
                Streams:
              </Text>
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="bold"
                color="cirqueira.musica.textoPrincipal"
              >
                {totalStreams}
              </Text>
            </HStack>
          </Flex>
        </Flex>
      </VStack>

      <Box
        p={{ base: 3, sm: 5 }}
        bg="cirqueira.musica.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="border.subtle"
        w="full"
        maxW="100%"
      >
        <VStack gap={4} align="stretch" w="full">
          <Flex
            justify="space-between"
            align={{ base: 'stretch', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            borderBottom="1px solid"
            borderColor="border.subtle"
            pb={3}
            gap={2.5}
            w="full"
          >
            <VStack align="flex-start" gap={0.5} maxW="full">
              <Heading
                as="h3"
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="bold"
                color="cirqueira.musica.amarelo"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {TITULOS_ABA[aba]}
              </Heading>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
                Exibindo ranking de {rotuloAtivo}
              </Text>
            </VStack>

            {modo === 'visao' ? (
              <Button
                size="xs"
                borderRadius="full"
                variant="outline"
                borderColor="cirqueira.musica.cartaoElevado"
                color="cirqueira.musica.textoPrincipal"
                fontSize="2xs"
                fontWeight="semibold"
                onClick={() => setTop50Aberto(true)}
              >
                <ListOrdered size={12} />
                Top 50
              </Button>
            ) : null}

            <HStack
              gap={1}
              bg="cirqueira.musica.cartaoElevado"
              p={0.5}
              borderRadius="full"
              w={{ base: 'full', sm: 'auto' }}
              justify="center"
            >
              <Button
                size="xs"
                borderRadius="full"
                px={3}
                flex={{ base: 1, sm: 'initial' }}
                fontSize="2xs"
                fontWeight="semibold"
                bg={aba === 'musicas' ? 'cirqueira.musica.cartao' : 'transparent'}
                color={
                  aba === 'musicas'
                    ? 'cirqueira.musica.amarelo'
                    : 'cirqueira.musica.textoSecundario'
                }
                onClick={() => setAba('musicas')}
              >
                <HStack gap={1.5} justify="center">
                  <Music2 size={12} />
                  <Text as="span">Músicas</Text>
                </HStack>
              </Button>
              <Button
                size="xs"
                borderRadius="full"
                px={3}
                flex={{ base: 1, sm: 'initial' }}
                fontSize="2xs"
                fontWeight="semibold"
                bg={aba === 'artistas' ? 'cirqueira.musica.cartao' : 'transparent'}
                color={
                  aba === 'artistas' ? 'cirqueira.musica.azul' : 'cirqueira.musica.textoSecundario'
                }
                onClick={() => setAba('artistas')}
              >
                <HStack gap={1.5} justify="center">
                  <Users size={12} />
                  <Text as="span">Artistas</Text>
                </HStack>
              </Button>
              <Button
                size="xs"
                borderRadius="full"
                px={3}
                flex={{ base: 1, sm: 'initial' }}
                fontSize="2xs"
                fontWeight="semibold"
                bg={aba === 'albuns' ? 'cirqueira.musica.cartao' : 'transparent'}
                color={
                  aba === 'albuns' ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoSecundario'
                }
                onClick={() => setAba('albuns')}
              >
                <HStack gap={1.5} justify="center">
                  <Disc3 size={12} />
                  <Text as="span">Álbuns</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>

          {modo === 'rankings' ? (
            carregandoRanking && !dadosAtivos ? (
              <Skeleton h="320px" w="full" borderRadius="8px" />
            ) : (
              <TabelaRankingMusica linhas={linhasTabela} />
            )
          ) : carregandoRanking && !dadosAtivos ? (
            <VStack gap={2} py={4}>
              <Skeleton h="56px" w="full" borderRadius="8px" />
              <Skeleton h="56px" w="full" borderRadius="8px" />
              <Skeleton h="56px" w="full" borderRadius="8px" />
            </VStack>
          ) : aba === 'musicas' ? (
            topMusicas.length === 0 ? (
              <Box py={8} textAlign="center" color="cirqueira.musica.textoSecundario" fontSize="xs">
                Nenhuma reprodução registrada para o período selecionado ({rotuloAtivo}).
              </Box>
            ) : (
              <VStack gap={2} align="stretch">
                {topMusicasExibidas.map((musica) => {
                  const chave = gerarChaveFaixa(
                    musica.codigoFaixa,
                    musica.artistaPrincipal,
                    musica.nomeFaixa
                  )
                  return (
                    <ItemRankingFaixa
                      key={`${musica.nomeFaixa}-${musica.artistaPrincipal}`}
                      item={musica}
                      imagemUrlResolvida={mapaImagensCompleto?.[chave]?.imagemUrl}
                      periodo={periodoMusicasItem}
                    />
                  )
                })}
              </VStack>
            )
          ) : aba === 'albuns' ? (
            topAlbuns.length === 0 ? (
              <Box py={8} textAlign="center" color="cirqueira.musica.textoSecundario" fontSize="xs">
                {dadosRankingRemoto
                  ? `Nenhum álbum registrado para o período selecionado (${rotuloAtivo}).`
                  : 'Carregando álbuns...'}
              </Box>
            ) : (
              <VStack gap={2} align="stretch">
                {topAlbuns.slice(0, 5).map((album, indice) => (
                  <ItemRankingAlbum
                    key={`${album.album}-${album.artista}`}
                    item={album}
                    posicao={indice + 1}
                    imagemUrl={imagemAlbum(album)}
                    periodo={periodoMusicasItem}
                    rotuloPeriodo={rotuloAtivo}
                  />
                ))}
              </VStack>
            )
          ) : topArtistas.length === 0 ? (
            <Box py={8} textAlign="center" color="cirqueira.musica.textoSecundario" fontSize="xs">
              Nenhum artista registrado para o período selecionado ({rotuloAtivo}).
            </Box>
          ) : (
            <VStack gap={2} align="stretch">
              {topArtistasExibidos.map((artista) => {
                const chave = gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)
                return (
                  <ItemRankingArtistaLinha
                    key={artista.nomeArtista}
                    item={artista}
                    periodo={periodoMusicasItem}
                    rotuloPeriodo={rotuloAtivo}
                    imagemUrlResolvida={mapaImagensCompleto?.[chave]?.imagemUrl}
                  />
                )
              })}
            </VStack>
          )}
        </VStack>
      </Box>

      {top50Aberto ? (
        <ModalTop50Musica
          periodo={periodoMusicasItem}
          rotuloPeriodo={rotuloAtivo}
          abaInicial={aba}
          onFechar={() => setTop50Aberto(false)}
        />
      ) : null}
    </VStack>
  )
})
