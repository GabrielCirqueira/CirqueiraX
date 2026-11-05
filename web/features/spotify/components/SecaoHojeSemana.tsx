import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
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
  Filter,
  Music2,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import type { FiltroIntervaloRankingParams } from '../api'
import { useCapsulasSpotify, useImagensSpotify, useRankingIntervaloSpotify } from '../hooks'
import type {
  ItemRankingArtista,
  ItemRankingMusica,
  RespostaConsultaImagens,
  ResumoGeralSpotify,
} from '../types'
import {
  formatarMinutosParaHorasEMinutos,
  formatarPercentualVariacao,
  gerarChaveArtista,
  gerarChaveFaixa,
} from '../utils'
import { ItemRankingArtistaLinha, ItemRankingFaixa } from './ItensRankingSpotify'

export interface SecaoHojeSemanaProps {
  resumo?: ResumoGeralSpotify
  carregando?: boolean
  mapaImagens?: RespostaConsultaImagens
}

type TipoFiltroSecao = 'dias' | 'mes' | 'ano' | 'personalizado'

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

  const [aba, setAba] = useState<'musicas' | 'artistas'>('musicas')
  const [modalRankingAberto, setModalRankingAberto] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const { data: mesesDisponiveis } = useCapsulasSpotify()

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

  const ehPadraoHoje = tipoFiltro === 'dias' && diasSelecionados === 1
  const ehPadraoSemana = tipoFiltro === 'dias' && diasSelecionados === 7

  const usarResumoLocal =
    (ehPadraoHoje && Boolean(resumo?.hoje)) || (ehPadraoSemana && Boolean(resumo?.semana))

  const { data: dadosRankingRemoto, isLoading: carregandoRanking } = useRankingIntervaloSpotify(
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

  const { data: mapaImagensRanking } = useImagensSpotify(chavesFaltantesRanking)

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
          : 'Personalizado')

  return (
    <VStack gap={4} align="stretch" w="full">
      <VStack gap={3} align="stretch" w="full">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={3}
          wrap="wrap"
        >
          <HStack
            gap={1}
            bg="cirqueira.spotify.cartao"
            p={1}
            borderRadius="full"
            border="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            overflowX="auto"
            maxW="full"
          >
            {OPCOES_DIAS.map((opcao) => {
              const ativo = tipoFiltro === 'dias' && diasSelecionados === opcao.dias
              return (
                <Button
                  key={opcao.rotulo}
                  size="sm"
                  borderRadius="full"
                  px={3.5}
                  h="32px"
                  fontSize="xs"
                  fontWeight="bold"
                  bg={ativo ? 'cirqueira.spotify.cartaoElevado' : 'transparent'}
                  color={
                    ativo ? 'cirqueira.spotify.textoPrincipal' : 'cirqueira.spotify.textoSecundario'
                  }
                  _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}
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
              size="sm"
              borderRadius="full"
              px={3.5}
              h="32px"
              fontSize="xs"
              fontWeight="bold"
              bg={tipoFiltro === 'mes' ? 'cirqueira.spotify.cartaoElevado' : 'transparent'}
              color={
                tipoFiltro === 'mes'
                  ? 'cirqueira.spotify.verde'
                  : 'cirqueira.spotify.textoSecundario'
              }
              _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}
              onClick={() => setTipoFiltro('mes')}
              flexShrink={0}
            >
              <HStack gap={1.5}>
                <Calendar size={13} />
                <Text as="span">Mês</Text>
              </HStack>
            </Button>

            <Button
              size="sm"
              borderRadius="full"
              px={3.5}
              h="32px"
              fontSize="xs"
              fontWeight="bold"
              bg={tipoFiltro === 'ano' ? 'cirqueira.spotify.cartaoElevado' : 'transparent'}
              color={
                tipoFiltro === 'ano'
                  ? 'cirqueira.spotify.amarelo'
                  : 'cirqueira.spotify.textoSecundario'
              }
              _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}
              onClick={() => setTipoFiltro('ano')}
              flexShrink={0}
            >
              <HStack gap={1.5}>
                <CalendarDays size={13} />
                <Text as="span">Ano</Text>
              </HStack>
            </Button>

            <Button
              size="sm"
              borderRadius="full"
              px={3.5}
              h="32px"
              fontSize="xs"
              fontWeight="bold"
              bg={
                tipoFiltro === 'personalizado' ? 'cirqueira.spotify.cartaoElevado' : 'transparent'
              }
              color={
                tipoFiltro === 'personalizado'
                  ? 'cirqueira.spotify.azul'
                  : 'cirqueira.spotify.textoSecundario'
              }
              _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}
              onClick={() => setTipoFiltro('personalizado')}
              flexShrink={0}
            >
              <HStack gap={1.5}>
                <SlidersHorizontal size={13} />
                <Text as="span">Personalizado</Text>
              </HStack>
            </Button>
          </HStack>

          <HStack gap={4} justify={{ base: 'space-between', md: 'flex-end' }}>
            <HStack gap={1.5}>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                Tempo ouvido:
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.verde">
                {formatarMinutosParaHorasEMinutos(totalMinutos)}
              </Text>
              {variacao !== null && (
                <Box
                  px={1.5}
                  py={0.5}
                  borderRadius="md"
                  bg={variacao >= 0 ? 'rgba(30, 215, 96, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
                  color={variacao >= 0 ? 'cirqueira.spotify.verde' : 'red.400'}
                  fontSize="2xs"
                  fontWeight="bold"
                >
                  {formatarPercentualVariacao(variacao)}
                </Box>
              )}
            </HStack>
            <HStack gap={1.5}>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                Streams:
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                {totalStreams}
              </Text>
            </HStack>
          </HStack>
        </Flex>

        {tipoFiltro === 'mes' && (
          <Flex
            p={3}
            bg="cirqueira.spotify.cartao"
            borderRadius="8px"
            border="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            align="center"
            gap={3}
            wrap="wrap"
          >
            <HStack gap={2} align="center">
              <Calendar size={14} color="var(--chakra-colors-cirqueira-spotify-verde)" />
              <Text fontSize="xs" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                Selecione o mês:
              </Text>
            </HStack>

            <HStack gap={2} wrap="wrap" flex={1}>
              <NativeSelect.Root size="xs" w={{ base: 'full', sm: '160px' }}>
                <NativeSelect.Field
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(Number(e.target.value))}
                  bg="cirqueira.spotify.cartaoElevado"
                  borderColor="rgba(255, 255, 255, 0.08)"
                  borderRadius="md"
                  fontSize="xs"
                  color="cirqueira.spotify.textoPrincipal"
                >
                  {NOMES_MESES.map((m) => (
                    <Box as="option" key={m.valor} value={m.valor} bg="#181818" color="#FFFFFF">
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
                  bg="cirqueira.spotify.cartaoElevado"
                  borderColor="rgba(255, 255, 255, 0.08)"
                  borderRadius="md"
                  fontSize="xs"
                  color="cirqueira.spotify.textoPrincipal"
                >
                  {anosDisponiveis.map((ano) => (
                    <Box as="option" key={ano} value={ano} bg="#181818" color="#FFFFFF">
                      {ano}
                    </Box>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </HStack>
          </Flex>
        )}

        {tipoFiltro === 'ano' && (
          <Flex
            p={3}
            bg="cirqueira.spotify.cartao"
            borderRadius="8px"
            border="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            align="center"
            gap={3}
            wrap="wrap"
          >
            <HStack gap={2} align="center">
              <CalendarDays size={14} color="var(--chakra-colors-cirqueira-spotify-amarelo)" />
              <Text fontSize="xs" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                Selecione o ano:
              </Text>
            </HStack>

            <NativeSelect.Root size="xs" w={{ base: 'full', sm: '140px' }}>
              <NativeSelect.Field
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                bg="cirqueira.spotify.cartaoElevado"
                borderColor="rgba(255, 255, 255, 0.08)"
                borderRadius="md"
                fontSize="xs"
                color="cirqueira.spotify.textoPrincipal"
              >
                {anosDisponiveis.map((ano) => (
                  <Box as="option" key={ano} value={ano} bg="#181818" color="#FFFFFF">
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
            p={3}
            bg="cirqueira.spotify.cartao"
            borderRadius="8px"
            border="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            align="center"
            gap={3}
            wrap="wrap"
          >
            <HStack gap={2} align="center">
              <SlidersHorizontal size={14} color="var(--chakra-colors-cirqueira-spotify-azul)" />
              <Text fontSize="xs" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                Intervalo de datas:
              </Text>
            </HStack>

            <HStack gap={2} wrap="wrap" flex={1}>
              <HStack gap={1.5} align="center">
                <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
                  De:
                </Text>
                <Input
                  type="date"
                  size="xs"
                  w="140px"
                  value={dataInicioPersonalizada}
                  onChange={(e) => setDataInicioPersonalizada(e.target.value)}
                  bg="cirqueira.spotify.cartaoElevado"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.08)"
                  borderRadius="md"
                  color="cirqueira.spotify.textoPrincipal"
                  fontSize="xs"
                />
              </HStack>

              <HStack gap={1.5} align="center">
                <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
                  Até:
                </Text>
                <Input
                  type="date"
                  size="xs"
                  w="140px"
                  value={dataFimPersonalizada}
                  onChange={(e) => setDataFimPersonalizada(e.target.value)}
                  bg="cirqueira.spotify.cartaoElevado"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.08)"
                  borderRadius="md"
                  color="cirqueira.spotify.textoPrincipal"
                  fontSize="xs"
                />
              </HStack>
            </HStack>
          </Flex>
        )}
      </VStack>

      <Box
        p={5}
        bg="cirqueira.spotify.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="cirqueira.spotify.cartaoElevado"
      >
        <VStack gap={4} align="stretch">
          <Flex
            justify="space-between"
            align={{ base: 'flex-start', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            borderBottom="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            pb={3}
            gap={2}
          >
            <VStack align="flex-start" gap={0.5}>
              <Heading
                as="h3"
                fontSize="sm"
                fontWeight="bold"
                color="cirqueira.spotify.amarelo"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {aba === 'musicas' ? 'Músicas Mais Ouvidas' : 'Artistas Mais Ouvidos'}
              </Heading>
              <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
                Exibindo ranking de {rotuloAtivo}
              </Text>
            </VStack>

            <HStack gap={1} bg="cirqueira.spotify.cartaoElevado" p={0.5} borderRadius="full">
              <Button
                size="xs"
                borderRadius="full"
                px={3}
                fontSize="2xs"
                fontWeight="semibold"
                bg={aba === 'musicas' ? 'cirqueira.spotify.cartao' : 'transparent'}
                color={
                  aba === 'musicas'
                    ? 'cirqueira.spotify.amarelo'
                    : 'cirqueira.spotify.textoSecundario'
                }
                onClick={() => setAba('musicas')}
              >
                <HStack gap={1.5}>
                  <Music2 size={12} />
                  <Text as="span">Músicas</Text>
                </HStack>
              </Button>
              <Button
                size="xs"
                borderRadius="full"
                px={3}
                fontSize="2xs"
                fontWeight="semibold"
                bg={aba === 'artistas' ? 'cirqueira.spotify.cartao' : 'transparent'}
                color={
                  aba === 'artistas'
                    ? 'cirqueira.spotify.azul'
                    : 'cirqueira.spotify.textoSecundario'
                }
                onClick={() => setAba('artistas')}
              >
                <HStack gap={1.5}>
                  <Users size={12} />
                  <Text as="span">Artistas</Text>
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
              <Box
                py={8}
                textAlign="center"
                color="cirqueira.spotify.textoSecundario"
                fontSize="xs"
              >
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
          ) : topArtistas.length === 0 ? (
            <Box py={8} textAlign="center" color="cirqueira.spotify.textoSecundario" fontSize="xs">
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
                    ano={tipoFiltro === 'mes' || tipoFiltro === 'ano' ? anoSelecionado : null}
                    mes={tipoFiltro === 'mes' ? mesSelecionado : null}
                    imagemUrlResolvida={mapaImagensCompleto?.[chave]?.imagemUrl}
                  />
                )
              })}
            </VStack>
          )}

          {((aba === 'musicas' && topMusicas.length > 0) ||
            (aba === 'artistas' && topArtistas.length > 0)) && (
            <Button
              variant="ghost"
              size="sm"
              w="full"
              mt={1}
              py={2.5}
              h="auto"
              borderRadius="6px"
              justifyContent="space-between"
              color="cirqueira.spotify.textoSecundario"
              _hover={{
                color: 'cirqueira.spotify.textoPrincipal',
                bg: 'cirqueira.spotify.cartaoElevado',
              }}
              onClick={() => setModalRankingAberto(true)}
            >
              <Text as="span" fontSize="xs" fontWeight="semibold">
                {aba === 'musicas'
                  ? `Ver ranking completo (Top ${Math.min(topMusicas.length, 50)} músicas)`
                  : `Ver ranking completo (Top ${Math.min(topArtistas.length, 50)} artistas)`}
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
          ano={tipoFiltro === 'mes' || tipoFiltro === 'ano' ? anoSelecionado : null}
          mes={tipoFiltro === 'mes' ? mesSelecionado : null}
          topMusicas={topMusicas}
          topArtistas={topArtistas}
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
  tipo: 'musicas' | 'artistas'
  rotuloPeriodo: string
  ano?: number | null
  mes?: number | null
  topMusicas: ItemRankingMusica[]
  topArtistas: ItemRankingArtista[]
  mapaImagens?: RespostaConsultaImagens
  isDesktop: boolean
}

function ModalRankingHojeSemana({
  aberto,
  onFechar,
  tipo,
  rotuloPeriodo,
  ano,
  mes,
  topMusicas,
  topArtistas,
  mapaImagens,
  isDesktop,
}: ModalRankingHojeSemanaProps) {
  const titulo = tipo === 'musicas' ? 'Top 50 Músicas Mais Ouvidas' : 'Top 50 Artistas Mais Ouvidos'

  const total = tipo === 'musicas' ? topMusicas.length : topArtistas.length
  const subtitulo = `${rotuloPeriodo} • Mostrando ${Math.min(total, 50)} no ranking`

  const renderConteudo = () => (
    <VStack gap={2} align="stretch" w="full" maxH="70vh" overflowY="auto" pr={1}>
      {tipo === 'musicas'
        ? topMusicas.slice(0, 50).map((musica) => {
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
          })
        : topArtistas.slice(0, 50).map((artista) => {
            const chave = gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)
            return (
              <ItemRankingArtistaLinha
                key={`${artista.posicao}-${artista.nomeArtista}`}
                item={artista}
                ano={ano}
                mes={mes}
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
              bg="cirqueira.spotify.cartao"
              borderTop="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
              borderTopRadius="16px"
              p={5}
              maxH="85vh"
              overflowY="auto"
              color="cirqueira.spotify.textoPrincipal"
            >
              <Drawer.Header
                p={0}
                mb={4}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <VStack align="flex-start" gap={0.5}>
                  <Drawer.Title fontSize="md" fontWeight="bold">
                    {titulo}
                  </Drawer.Title>
                  <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                    {subtitulo}
                  </Text>
                </VStack>

                <Drawer.CloseTrigger asChild>
                  <Button
                    size="xs"
                    variant="ghost"
                    borderRadius="full"
                    color="cirqueira.spotify.textoSecundario"
                    _hover={{
                      color: 'cirqueira.spotify.textoPrincipal',
                      bg: 'cirqueira.spotify.cartaoElevado',
                    }}
                    onClick={onFechar}
                  >
                    <X size={16} />
                  </Button>
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body p={0}>{renderConteudo()}</Drawer.Body>
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
            bg="cirqueira.spotify.cartao"
            border="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            borderRadius="8px"
            p={6}
            maxW="2xl"
            w="full"
            color="cirqueira.spotify.textoPrincipal"
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
                <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                  {subtitulo}
                </Text>
              </VStack>

              <Dialog.CloseTrigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.spotify.textoSecundario"
                  _hover={{
                    color: 'cirqueira.spotify.textoPrincipal',
                    bg: 'cirqueira.spotify.cartaoElevado',
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
