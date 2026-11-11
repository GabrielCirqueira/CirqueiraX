import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Badge,
  Box,
  Button,
  Center,
  Dialog,
  Drawer,
  Flex,
  HStack,
  Heading,
  Input,
  NativeSelect,
  Portal,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  Calendar,
  CalendarDays,
  ChevronRight,
  Disc3,
  Filter,
  Infinity as IconeInfinito,
  Music2,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import type { FiltroIntervaloRankingParams, PeriodoMusicasItem } from '../api'
import {
  useCapsulasMusica,
  useImagensItensMusica,
  useImagensMusica,
  useRankingIntervaloMusica,
} from '../hooks'
import type {
  AlbumAnalise,
  ItemRankingArtista,
  ItemRankingMusica,
  RespostaConsultaImagens,
  ResumoGeralMusica,
} from '../types'
import { formatarPercentualVariacao, gerarChaveArtista, gerarChaveFaixa } from '../utils'
import { ItemRankingAlbum, ItemRankingArtistaLinha, ItemRankingFaixa } from './ItensRankingMusica'
import { MinutosMusica } from './MinutosMusica'

export interface SecaoHojeSemanaProps {
  resumo?: ResumoGeralMusica
  carregando?: boolean
  mapaImagens?: RespostaConsultaImagens
}

type TipoFiltroSecao = 'dias' | 'mes' | 'ano' | 'todos' | 'personalizado'

type AbaRanking = 'musicas' | 'artistas' | 'albuns'

const TITULOS_ABA: Record<AbaRanking, string> = {
  musicas: 'Músicas Mais Ouvidas',
  artistas: 'Artistas Mais Ouvidos',
  albuns: 'Álbuns Mais Ouvidos',
}

const SEM_ALBUNS: AlbumAnalise[] = []

const OPCOES_DIAS = [
  { rotulo: 'Hoje', dias: 1 },
  { rotulo: '7 dias', dias: 7 },
  { rotulo: '14 dias', dias: 14 },
  { rotulo: '30 dias', dias: 30 },
  { rotulo: '90 dias', dias: 90 },
]

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
}: SecaoHojeSemanaProps) {
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltroSecao>('dias')
  const [diasSelecionados, setDiasSelecionados] = useState<number>(7)
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
  const [modalRankingAberto, setModalRankingAberto] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

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

  const usarResumoLocal =
    (ehPadraoHoje && Boolean(resumo?.hoje)) || (ehPadraoSemana && Boolean(resumo?.semana))

  const { data: dadosRankingRemoto, isLoading: carregandoRanking } = useRankingIntervaloMusica(
    paramsRanking,
    !usarResumoLocal || !resumo
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

  const totalAba =
    aba === 'musicas'
      ? topMusicas.length
      : aba === 'artistas'
        ? topArtistas.length
        : topAlbuns.length

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
          <Box
            w={{ base: 'full', md: 'auto' }}
            maxW="100%"
            overflowX="auto"
            py={0.5}
            css={{
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <HStack
              gap={1}
              bg="cirqueira.musica.cartao"
              p={1}
              borderRadius="full"
              border="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
              w="max-content"
              minW="min-content"
            >
              {OPCOES_DIAS.map((opcao) => {
                const ativo = tipoFiltro === 'dias' && diasSelecionados === opcao.dias
                return (
                  <Button
                    key={opcao.rotulo}
                    size="xs"
                    borderRadius="full"
                    px={{ base: 3, sm: 3.5 }}
                    h={{ base: '28px', sm: '32px' }}
                    fontSize="xs"
                    fontWeight="bold"
                    bg={ativo ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
                    color={
                      ativo ? 'cirqueira.musica.textoPrincipal' : 'cirqueira.musica.textoSecundario'
                    }
                    _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
                    onClick={() => {
                      setTipoFiltro('dias')
                      setDiasSelecionados(opcao.dias)
                    }}
                    flexShrink={0}
                  >
                    {opcao.rotulo}
                  </Button>
                )
              })}

              <Button
                size="xs"
                borderRadius="full"
                px={{ base: 3, sm: 3.5 }}
                h={{ base: '28px', sm: '32px' }}
                fontSize="xs"
                fontWeight="bold"
                bg={tipoFiltro === 'mes' ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
                color={
                  tipoFiltro === 'mes'
                    ? 'cirqueira.musica.verde'
                    : 'cirqueira.musica.textoSecundario'
                }
                _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
                onClick={() => setTipoFiltro('mes')}
                flexShrink={0}
              >
                <HStack gap={1.5}>
                  <Calendar size={13} />
                  <Text as="span">Mês</Text>
                </HStack>
              </Button>

              <Button
                size="xs"
                borderRadius="full"
                px={{ base: 3, sm: 3.5 }}
                h={{ base: '28px', sm: '32px' }}
                fontSize="xs"
                fontWeight="bold"
                bg={tipoFiltro === 'ano' ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
                color={
                  tipoFiltro === 'ano'
                    ? 'cirqueira.musica.amarelo'
                    : 'cirqueira.musica.textoSecundario'
                }
                _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
                onClick={() => setTipoFiltro('ano')}
                flexShrink={0}
              >
                <HStack gap={1.5}>
                  <CalendarDays size={13} />
                  <Text as="span">Ano</Text>
                </HStack>
              </Button>

              <Button
                size="xs"
                borderRadius="full"
                px={{ base: 3, sm: 3.5 }}
                h={{ base: '28px', sm: '32px' }}
                fontSize="xs"
                fontWeight="bold"
                bg={tipoFiltro === 'todos' ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
                color={
                  tipoFiltro === 'todos'
                    ? 'cirqueira.musica.verde'
                    : 'cirqueira.musica.textoSecundario'
                }
                _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
                onClick={() => setTipoFiltro('todos')}
                flexShrink={0}
              >
                <HStack gap={1.5}>
                  <IconeInfinito size={13} />
                  <Text as="span">Sempre</Text>
                </HStack>
              </Button>

              <Button
                size="xs"
                borderRadius="full"
                px={{ base: 3, sm: 3.5 }}
                h={{ base: '28px', sm: '32px' }}
                fontSize="xs"
                fontWeight="bold"
                bg={
                  tipoFiltro === 'personalizado' ? 'cirqueira.musica.cartaoElevado' : 'transparent'
                }
                color={
                  tipoFiltro === 'personalizado'
                    ? 'cirqueira.musica.azul'
                    : 'cirqueira.musica.textoSecundario'
                }
                _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
                onClick={() => setTipoFiltro('personalizado')}
                flexShrink={0}
              >
                <HStack gap={1.5}>
                  <SlidersHorizontal size={13} />
                  <Text as="span">Personalizado</Text>
                </HStack>
              </Button>
            </HStack>
          </Box>

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

        {tipoFiltro === 'mes' && (
          <Flex
            p={{ base: 2.5, sm: 3 }}
            bg="cirqueira.musica.cartao"
            borderRadius="8px"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            align={{ base: 'stretch', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            gap={2.5}
            w="full"
          >
            <HStack gap={2} align="center">
              <Calendar size={14} color="var(--chakra-colors-cirqueira-musica-verde)" />
              <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                Selecione o mês:
              </Text>
            </HStack>

            <Flex gap={2} direction={{ base: 'column', sm: 'row' }} flex={1} w="full">
              <NativeSelect.Root size="xs" w={{ base: 'full', sm: '160px' }}>
                <NativeSelect.Field
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(Number(e.target.value))}
                  bg="cirqueira.musica.cartaoElevado"
                  borderColor="border.subtle"
                  borderRadius="8px"
                  fontSize="xs"
                  color="cirqueira.musica.textoPrincipal"
                >
                  {NOMES_MESES.map((m) => (
                    <Box
                      as="option"
                      key={m.valor}
                      value={m.valor}
                      bg="cirqueira.musica.cartao"
                      color="cirqueira.musica.textoPrincipal"
                    >
                      {m.rotulo}
                    </Box>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>

              <NativeSelect.Root size="xs" w={{ base: 'full', sm: '120px' }}>
                <NativeSelect.Field
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                  bg="cirqueira.musica.cartaoElevado"
                  borderColor="border.subtle"
                  borderRadius="8px"
                  fontSize="xs"
                  color="cirqueira.musica.textoPrincipal"
                >
                  {anosDisponiveis.map((ano) => (
                    <Box
                      as="option"
                      key={ano}
                      value={ano}
                      bg="cirqueira.musica.cartao"
                      color="cirqueira.musica.textoPrincipal"
                    >
                      {ano}
                    </Box>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Flex>
          </Flex>
        )}

        {tipoFiltro === 'ano' && (
          <Flex
            p={{ base: 2.5, sm: 3 }}
            bg="cirqueira.musica.cartao"
            borderRadius="8px"
            border="1px solid"
            borderColor="border.subtle"
            align={{ base: 'stretch', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            gap={2.5}
            w="full"
          >
            <HStack gap={2} align="center">
              <CalendarDays size={14} color="var(--chakra-colors-cirqueira-musica-amarelo)" />
              <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                Selecione o ano:
              </Text>
            </HStack>

            <NativeSelect.Root size="xs" w={{ base: 'full', sm: '140px' }}>
              <NativeSelect.Field
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                bg="cirqueira.musica.cartaoElevado"
                borderColor="border.subtle"
                borderRadius="8px"
                fontSize="xs"
                color="cirqueira.musica.textoPrincipal"
              >
                {anosDisponiveis.map((ano) => (
                  <Box
                    as="option"
                    key={ano}
                    value={ano}
                    bg="cirqueira.musica.cartao"
                    color="cirqueira.musica.textoPrincipal"
                  >
                    {ano}
                  </Box>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Flex>
        )}

        {tipoFiltro === 'personalizado' && (
          <Flex
            p={{ base: 2.5, sm: 3 }}
            bg="cirqueira.musica.cartao"
            borderRadius="8px"
            border="1px solid"
            borderColor="border.subtle"
            align={{ base: 'stretch', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            gap={2.5}
            w="full"
          >
            <HStack gap={2} align="center">
              <SlidersHorizontal size={14} color="var(--chakra-colors-cirqueira-musica-azul)" />
              <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                Intervalo de datas:
              </Text>
            </HStack>

            <Flex gap={2} direction={{ base: 'column', sm: 'row' }} flex={1} w="full">
              <HStack gap={1.5} align="center" flex={1} w="full">
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" minW="22px">
                  De:
                </Text>
                <Input
                  type="date"
                  size="xs"
                  w="full"
                  value={dataInicioPersonalizada}
                  onChange={(e) => setDataInicioPersonalizada(e.target.value)}
                  bg="cirqueira.musica.cartaoElevado"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="8px"
                  color="cirqueira.musica.textoPrincipal"
                  fontSize="xs"
                />
              </HStack>

              <HStack gap={1.5} align="center" flex={1} w="full">
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" minW="22px">
                  Até:
                </Text>
                <Input
                  type="date"
                  size="xs"
                  w="full"
                  value={dataFimPersonalizada}
                  onChange={(e) => setDataFimPersonalizada(e.target.value)}
                  bg="cirqueira.musica.cartaoElevado"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="8px"
                  color="cirqueira.musica.textoPrincipal"
                  fontSize="xs"
                />
              </HStack>
            </Flex>
          </Flex>
        )}
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

          {carregandoRanking && !dadosAtivos ? (
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

          {totalAba > 0 && (
            <Button
              variant="ghost"
              size="sm"
              w="full"
              mt={1}
              py={2.5}
              h="auto"
              borderRadius="6px"
              justifyContent="space-between"
              color="cirqueira.musica.textoSecundario"
              _hover={{
                color: 'cirqueira.musica.textoPrincipal',
                bg: 'cirqueira.musica.cartaoElevado',
              }}
              onClick={() => setModalRankingAberto(true)}
            >
              <Text as="span" fontSize="xs" fontWeight="semibold">
                {`Ver ranking completo (Top ${Math.min(totalAba, 50)} ${aba === 'musicas' ? 'músicas' : aba === 'artistas' ? 'artistas' : 'álbuns'})`}
              </Text>
              <ChevronRight size={16} />
            </Button>
          )}
        </VStack>
      </Box>

      {modalRankingAberto && (
        <ModalRankingHojeSemana
          aberto={modalRankingAberto}
          onFechar={() => setModalRankingAberto(false)}
          tipo={aba}
          rotuloPeriodo={rotuloAtivo}
          periodo={periodoMusicasItem}
          topMusicas={topMusicas}
          topArtistas={topArtistas}
          topAlbuns={topAlbuns}
          imagemAlbum={imagemAlbum}
          mapaImagens={mapaImagensCompleto}
          isDesktop={isDesktop}
        />
      )}
    </VStack>
  )
})

interface ModalRankingHojeSemanaProps {
  aberto: boolean
  onFechar: () => void
  tipo: AbaRanking
  rotuloPeriodo: string
  periodo: PeriodoMusicasItem
  topMusicas: ItemRankingMusica[]
  topArtistas: ItemRankingArtista[]
  topAlbuns: AlbumAnalise[]
  imagemAlbum: (item: AlbumAnalise) => string | null
  mapaImagens?: RespostaConsultaImagens
  isDesktop: boolean
}

function ModalRankingHojeSemana({
  aberto,
  onFechar,
  tipo,
  rotuloPeriodo,
  periodo,
  topMusicas,
  topArtistas,
  topAlbuns,
  imagemAlbum,
  mapaImagens,
  isDesktop,
}: ModalRankingHojeSemanaProps) {
  const titulo = `Top 50 ${TITULOS_ABA[tipo]}`

  const total =
    tipo === 'musicas'
      ? topMusicas.length
      : tipo === 'artistas'
        ? topArtistas.length
        : topAlbuns.length
  const subtitulo = `${rotuloPeriodo} • Mostrando ${Math.min(total, 50)} no ranking`

  const renderConteudo = () => (
    <VStack
      gap={2}
      align="stretch"
      w="full"
      maxH={isDesktop ? '70vh' : 'auto'}
      overflowY={isDesktop ? 'auto' : 'visible'}
      pr={1}
    >
      {tipo === 'albuns' &&
        topAlbuns
          .slice(0, 50)
          .map((album, indice) => (
            <ItemRankingAlbum
              key={`${album.album}-${album.artista}`}
              item={album}
              posicao={indice + 1}
              imagemUrl={imagemAlbum(album)}
              periodo={periodo}
              rotuloPeriodo={rotuloPeriodo}
            />
          ))}
      {tipo === 'musicas' &&
        topMusicas.slice(0, 50).map((musica) => {
          const chave = gerarChaveFaixa(
            musica.codigoFaixa,
            musica.artistaPrincipal,
            musica.nomeFaixa
          )
          return (
            <ItemRankingFaixa
              key={`${musica.posicao}-${musica.nomeFaixa}-${musica.artistaPrincipal}`}
              item={musica}
              imagemUrlResolvida={mapaImagens?.[chave]?.imagemUrl}
            />
          )
        })}
      {tipo === 'artistas' &&
        topArtistas.slice(0, 50).map((artista) => {
          const chave = gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)
          return (
            <ItemRankingArtistaLinha
              key={`${artista.posicao}-${artista.nomeArtista}`}
              item={artista}
              periodo={periodo}
              rotuloPeriodo={rotuloPeriodo}
              imagemUrlResolvida={mapaImagens?.[chave]?.imagemUrl}
            />
          )
        })}
    </VStack>
  )

  if (!isDesktop) {
    return (
      <Drawer.Root
        open={aberto}
        onOpenChange={(detalhes) => !detalhes.open && onFechar()}
        placement="bottom"
      >
        <Portal>
          <Drawer.Backdrop bg="rgba(0, 0, 0, 0.85)" backdropFilter="blur(4px)" />
          <Drawer.Positioner>
            <Drawer.Content
              bg="cirqueira.musica.cartao"
              borderTop="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
              borderTopRadius="16px"
              p={{ base: 3.5, sm: 5 }}
              maxH="90vh"
              display="flex"
              flexDirection="column"
              color="cirqueira.musica.textoPrincipal"
            >
              <Drawer.Header
                p={0}
                mb={3}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <VStack align="flex-start" gap={0.5} maxW="calc(100% - 36px)">
                  <Drawer.Title
                    fontSize={{ base: 'sm', sm: 'md' }}
                    fontWeight="bold"
                    truncate
                    maxW="full"
                  >
                    {titulo}
                  </Drawer.Title>
                  <Text
                    fontSize="2xs"
                    color="cirqueira.musica.textoSecundario"
                    truncate
                    maxW="full"
                  >
                    {subtitulo}
                  </Text>
                </VStack>

                <Drawer.CloseTrigger asChild>
                  <Button
                    size="xs"
                    variant="ghost"
                    borderRadius="full"
                    color="cirqueira.musica.textoSecundario"
                    _hover={{
                      color: 'cirqueira.musica.textoPrincipal',
                      bg: 'cirqueira.musica.cartaoElevado',
                    }}
                    onClick={onFechar}
                  >
                    <X size={16} />
                  </Button>
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body p={0} overflowY="auto" maxH="75vh">
                {renderConteudo()}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(detalhes) => !detalhes.open && onFechar()}>
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.85)" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            borderRadius="8px"
            p={6}
            maxW="2xl"
            w="full"
            color="cirqueira.musica.textoPrincipal"
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.7)"
          >
            <Dialog.Header
              p={0}
              mb={4}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <VStack align="flex-start" gap={0.5}>
                <Dialog.Title fontSize="lg" fontWeight="bold">
                  {titulo}
                </Dialog.Title>
                <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                  {subtitulo}
                </Text>
              </VStack>

              <Dialog.CloseTrigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.musica.textoSecundario"
                  _hover={{
                    color: 'cirqueira.musica.textoPrincipal',
                    bg: 'cirqueira.musica.cartaoElevado',
                  }}
                  onClick={onFechar}
                >
                  <X size={16} />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={0}>{renderConteudo()}</Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
