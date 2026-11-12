import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Collapsible,
  Dialog,
  Drawer,
  Flex,
  HStack,
  Heading,
  Portal,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Flame,
  Minus,
  Music2,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  useCapsulasMusica,
  useDetalheCapsulaMusica,
  useFonteMusica,
  useImagensMusica,
  useMesCapsulaUrl,
} from '../hooks'
import type {
  CapsulaMensal,
  ItemRankingArtistaCapsula,
  ItemRankingMusicaCapsula,
  RespostaConsultaImagens,
} from '../types'
import {
  NOTA_CALIBRACAO_CAPSULA,
  atribuicaoFonteMusica,
  baixarArquivoCsv,
  exportarResumoCapsulaParaCsv,
  formatarDataPtBr,
  formatarMinutos,
  formatarMinutosEmHorasExtenso,
  formatarNomeMes,
  formatarPercentualVariacao,
  formatarRotuloMesAno,
  gerarChaveArtista,
  gerarChaveFaixa,
  incluiYoutubeMusic,
} from '../utils'
import { urlCapaExibicao } from '../utils/capaMusica'
import { DivisaoFontesMusica } from './DivisaoFontesMusica'
import { ListaMusicasItem } from './ListaMusicasItem'
import { MinutosMusica, TooltipMusica } from './MinutosMusica'
import { BotaoImagemCapsula } from './ModalImagemCapsula'
import { TopsMesCapsula } from './TopsMesCapsula'

export interface SecaoCapsulaSonoraProps {
  conectada: boolean
}

export const SecaoCapsulaSonora = memo(function SecaoCapsulaSonora({
  conectada,
}: SecaoCapsulaSonoraProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { fonte } = useFonteMusica()
  const { data: mesesDisponiveis, isLoading: carregandoMeses } = useCapsulasMusica(conectada)
  const { anoSelecionado, mesSelecionado, selecionarMes } = useMesCapsulaUrl()

  const [modalDetalhe, setModalDetalhe] = useState<
    'musicas' | 'artistas' | 'tempo' | 'variedade' | null
  >(null)

  const mesAtivo = useMemo(() => {
    if (!mesesDisponiveis || mesesDisponiveis.length === 0) return null
    if (anoSelecionado && mesSelecionado) {
      const encontrado = mesesDisponiveis.find(
        (m) => m.ano === anoSelecionado && m.mes === mesSelecionado
      )
      if (encontrado) return encontrado
    }
    return mesesDisponiveis[0]
  }, [mesesDisponiveis, anoSelecionado, mesSelecionado])

  const { data: capsula, isLoading: carregandoCapsula } = useDetalheCapsulaMusica(
    mesAtivo?.ano ?? null,
    mesAtivo?.mes ?? null,
    conectada && Boolean(mesAtivo)
  )

  const chavesFaltantes = useMemo(() => {
    if (!capsula) return []
    const chaves: string[] = []
    capsula.topMusicas.forEach((m) => {
      if (!m.imagemUrl) {
        chaves.push(gerarChaveFaixa(m.codigoFaixa, m.artistaPrincipal, m.nomeFaixa))
      }
    })
    capsula.topArtistas.forEach((a) => {
      if (!a.imagemUrl) {
        chaves.push(gerarChaveArtista(a.codigoArtista, a.nomeArtista))
      }
    })
    return chaves
  }, [capsula])

  const { data: mapaImagensConsultadas } = useImagensMusica(chavesFaltantes)

  const chaveArtistaMaisOuvido = capsula?.artistaMaisOuvido
    ? gerarChaveArtista(
        capsula.artistaMaisOuvido.codigoArtista,
        capsula.artistaMaisOuvido.nomeArtista
      )
    : null
  const fotoArtistaMaisOuvido =
    capsula?.artistaMaisOuvido?.imagemUrl ||
    (chaveArtistaMaisOuvido ? mapaImagensConsultadas?.[chaveArtistaMaisOuvido]?.imagemUrl : null)

  const chaveMusicaMaisOuvida = capsula?.musicaMaisOuvida
    ? gerarChaveFaixa(
        capsula.musicaMaisOuvida.codigoFaixa,
        capsula.musicaMaisOuvida.artistaPrincipal,
        capsula.musicaMaisOuvida.nomeFaixa
      )
    : null
  const fotoMusicaMaisOuvida =
    capsula?.musicaMaisOuvida?.imagemUrl ||
    (chaveMusicaMaisOuvida ? mapaImagensConsultadas?.[chaveMusicaMaisOuvida]?.imagemUrl : null)

  function handleExportarCsv() {
    if (!capsula) return
    const csv = exportarResumoCapsulaParaCsv(capsula, atribuicaoFonteMusica(fonte))
    const nomeArquivo = `capsula-musica-${capsula.ano}-${String(capsula.mes).padStart(2, '0')}.csv`
    baixarArquivoCsv(csv, nomeArquivo)
  }

  if (carregandoMeses) {
    return (
      <VStack gap={4} align="stretch" w="full">
        <Skeleton h="32px" w="260px" borderRadius="8px" />
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <Skeleton h="180px" borderRadius="8px" />
          <Skeleton h="180px" borderRadius="8px" />
          <Skeleton h="180px" borderRadius="8px" />
          <Skeleton h="180px" borderRadius="8px" />
        </SimpleGrid>
      </VStack>
    )
  }

  if (!mesesDisponiveis || mesesDisponiveis.length === 0) {
    return (
      <Box
        p={8}
        borderRadius="8px"
        bg="cirqueira.musica.cartao"
        border="1px solid"
        borderColor="cirqueira.musica.cartaoElevado"
        textAlign="center"
      >
        <VStack gap={2}>
          <Heading as="h3" fontSize="md" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
            Nenhuma Cápsula Sonora encontrada
          </Heading>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
            Importe seu histórico de reproduções ou aguarde a sincronização periódica para gerar sua
            Cápsula.
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <VStack gap={5} align="stretch" w="full">
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align={{ base: 'flex-start', sm: 'center' }}
        justify="space-between"
        gap={4}
      >
        <VStack align="flex-start" gap={0.5}>
          <HStack gap={2} align="baseline">
            <Heading
              as="h2"
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="black"
              color="cirqueira.musica.textoPrincipal"
            >
              Sua Cápsula sonora
            </Heading>
            {mesAtivo && (
              <HStack gap={1.5} align="baseline">
                <Text
                  as="span"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="black"
                  color="cirqueira.musica.verde"
                >
                  {formatarNomeMes(mesAtivo.mes).toLowerCase()}
                </Text>
                <Text
                  as="span"
                  fontSize={{ base: 'lg', md: 'xl' }}
                  fontWeight="normal"
                  color="cirqueira.musica.textoSecundario"
                >
                  {mesAtivo.ano}
                </Text>
              </HStack>
            )}
          </HStack>

          {mesAtivo?.isEmAndamento && (
            <HStack gap={1.5}>
              <Box boxSize={2} borderRadius="full" bg="cirqueira.musica.verde" />
              <Text
                fontSize="2xs"
                color="cirqueira.musica.verde"
                fontWeight="bold"
                textTransform="uppercase"
              >
                Mês em andamento
              </Text>
            </HStack>
          )}
        </VStack>

        <HStack gap={3} wrap="wrap">
          <Box position="relative">
            <Box
              as="select"
              value={mesAtivo ? `${mesAtivo.ano}-${mesAtivo.mes}` : ''}
              onChange={(e) => {
                const [ano, mes] = e.target.value.split('-').map(Number)
                selecionarMes(ano, mes)
              }}
              bg="cirqueira.musica.cartaoElevado"
              color="cirqueira.musica.textoPrincipal"
              fontSize="xs"
              fontWeight="semibold"
              py={2}
              pl={3}
              pr={8}
              borderRadius="full"
              border="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
              cursor="pointer"
              outline="none"
              _hover={{ borderColor: 'cirqueira.musica.textoSecundario' }}
            >
              {mesesDisponiveis.map((m) => (
                <Box
                  as="option"
                  key={`${m.ano}-${m.mes}`}
                  value={`${m.ano}-${m.mes}`}
                  bg="cirqueira.musica.cartao"
                  color="cirqueira.musica.textoPrincipal"
                >
                  {formatarRotuloMesAno(m.ano, m.mes)} {m.isEmAndamento ? '(em andamento)' : ''}
                </Box>
              ))}
            </Box>
            <Box
              position="absolute"
              right={3}
              top="50%"
              transform="translateY(-50%)"
              pointerEvents="none"
              color="cirqueira.musica.textoSecundario"
            >
              <ChevronDown size={14} />
            </Box>
          </Box>

          <BotaoImagemCapsula
            capsula={capsula}
            imagens={{
              musicas: (capsula?.topMusicas ?? [])
                .slice(0, 5)
                .map(
                  (m) =>
                    m.imagemUrl ||
                    mapaImagensConsultadas?.[
                      gerarChaveFaixa(m.codigoFaixa, m.artistaPrincipal, m.nomeFaixa)
                    ]?.imagemUrl ||
                    null
                ),
              artistaPrincipal: (() => {
                const topo = capsula?.topArtistas[0]
                if (!topo) return null
                return (
                  topo.imagemUrl ||
                  mapaImagensConsultadas?.[gerarChaveArtista(topo.codigoArtista, topo.nomeArtista)]
                    ?.imagemUrl ||
                  null
                )
              })(),
            }}
          />

          <Button
            size="sm"
            variant="outline"
            borderRadius="full"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            _hover={{
              bg: 'cirqueira.musica.cartaoElevado',
              borderColor: 'cirqueira.musica.textoSecundario',
            }}
            onClick={handleExportarCsv}
            disabled={!capsula}
            h="36px"
            px={3}
          >
            <HStack gap={1.5}>
              <Download size={14} />
              <Text as="span" fontSize="xs">
                Exportar CSV
              </Text>
            </HStack>
          </Button>
        </HStack>
      </Flex>

      {incluiYoutubeMusic(fonte) && (
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
          {NOTA_CALIBRACAO_CAPSULA}
        </Text>
      )}

      {carregandoCapsula || !capsula ? (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
          <Skeleton h="180px" borderRadius="8px" />
          <Skeleton h="180px" borderRadius="8px" />
          <Skeleton h="180px" borderRadius="8px" />
          <Skeleton h="180px" borderRadius="8px" />
        </SimpleGrid>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
          <Box
            p={5}
            borderRadius="8px"
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="border.subtle"
            _hover={{
              bg: 'cirqueira.musica.cartaoElevado',
              borderColor: 'cirqueira.musica.verde',
            }}
            cursor="pointer"
            onClick={() => setModalDetalhe('tempo')}
            transition="all 0.15s ease"
            position="relative"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <VStack align="flex-start" gap={2}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Tempo ouvindo
              </Text>
              <TooltipMusica conteudo={formatarMinutosEmHorasExtenso(capsula.totalMinutos)}>
                <Text
                  fontSize="2xl"
                  fontWeight="black"
                  color="cirqueira.musica.verde"
                  cursor="default"
                >
                  {capsula.totalMinutos.toLocaleString('pt-BR')} minutos
                </Text>
              </TooltipMusica>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                ouvidos em {capsula.totalStreams.toLocaleString('pt-BR')} reproduções
              </Text>
            </VStack>

            <HStack
              justify="space-between"
              align="center"
              pt={4}
              color="cirqueira.musica.textoSecundario"
              fontSize="xs"
            >
              <Text as="span">Ver gráfico diário</Text>
              <ChevronRight size={16} />
            </HStack>
          </Box>

          <Box
            p={5}
            borderRadius="8px"
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="border.subtle"
            _hover={{
              bg: 'cirqueira.musica.cartaoElevado',
              borderColor: 'cirqueira.musica.azul',
            }}
            cursor="pointer"
            onClick={() => setModalDetalhe('artistas')}
            transition="all 0.15s ease"
            position="relative"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <VStack align="flex-start" gap={3}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Artista mais ouvido
              </Text>

              {capsula.artistaMaisOuvido ? (
                <HStack gap={3} align="center">
                  <Box
                    boxSize={14}
                    borderRadius="full"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="cirqueira.musica.cartaoElevado"
                    flexShrink={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {fotoArtistaMaisOuvido ? (
                      <Box
                        as="img"
                        referrerPolicy="no-referrer"
                        src={urlCapaExibicao(fotoArtistaMaisOuvido) ?? undefined}
                        alt={capsula.artistaMaisOuvido.nomeArtista}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    ) : (
                      <Avatar.Root size="lg" shape="full">
                        <Avatar.Fallback
                          name={capsula.artistaMaisOuvido.nomeArtista}
                          bg="cirqueira.musica.cartaoElevado"
                          color="cirqueira.musica.textoSecundario"
                        />
                      </Avatar.Root>
                    )}
                  </Box>

                  <VStack align="flex-start" gap={0.5}>
                    <Text
                      fontSize="lg"
                      fontWeight="black"
                      color="cirqueira.musica.azul"
                      truncate
                      maxW="150px"
                    >
                      {capsula.artistaMaisOuvido.nomeArtista}
                    </Text>
                    <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                      {capsula.artistaMaisOuvido.totalStreams} reproduções
                    </Text>
                  </VStack>
                </HStack>
              ) : (
                <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                  Nenhum artista registrado
                </Text>
              )}
            </VStack>

            <HStack
              justify="space-between"
              align="center"
              pt={4}
              color="cirqueira.musica.textoSecundario"
              fontSize="xs"
            >
              <Text as="span">Ver top artistas</Text>
              <ChevronRight size={16} />
            </HStack>
          </Box>

          <Box
            p={5}
            borderRadius="8px"
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="border.subtle"
            _hover={{
              bg: 'cirqueira.musica.cartaoElevado',
              borderColor: 'cirqueira.musica.amarelo',
            }}
            cursor="pointer"
            onClick={() => setModalDetalhe('musicas')}
            transition="all 0.15s ease"
            position="relative"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <VStack align="flex-start" gap={3}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Música mais ouvida
              </Text>

              {capsula.musicaMaisOuvida ? (
                <HStack gap={3} align="center">
                  <Box
                    boxSize={14}
                    borderRadius="4px"
                    overflow="hidden"
                    bg="cirqueira.musica.cartaoElevado"
                    flexShrink={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {fotoMusicaMaisOuvida ? (
                      <Box
                        as="img"
                        referrerPolicy="no-referrer"
                        src={urlCapaExibicao(fotoMusicaMaisOuvida) ?? undefined}
                        alt={capsula.musicaMaisOuvida.nomeFaixa}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    ) : (
                      <Music2 size={24} color="var(--chakra-colors-cirqueira-musica-amarelo)" />
                    )}
                  </Box>

                  <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="cirqueira.musica.amarelo"
                      truncate
                      maxW="full"
                    >
                      {capsula.musicaMaisOuvida.nomeFaixa}
                    </Text>
                    <Text
                      fontSize="xs"
                      color="cirqueira.musica.textoSecundario"
                      truncate
                      maxW="full"
                    >
                      {capsula.musicaMaisOuvida.artistaPrincipal}
                    </Text>
                    <Text fontSize="2xs" color="cirqueira.musica.verde" fontWeight="bold">
                      {capsula.musicaMaisOuvida.totalStreams} streams
                    </Text>
                  </VStack>
                </HStack>
              ) : (
                <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                  Nenhuma música registrada
                </Text>
              )}
            </VStack>

            <HStack
              justify="space-between"
              align="center"
              pt={4}
              color="cirqueira.musica.textoSecundario"
              fontSize="xs"
            >
              <Text as="span">Ver ranking completo</Text>
              <ChevronRight size={16} />
            </HStack>
          </Box>

          <Box
            p={5}
            borderRadius="8px"
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="border.subtle"
            _hover={{
              bg: 'cirqueira.musica.cartaoElevado',
              borderColor: 'cirqueira.musica.verde',
            }}
            cursor="pointer"
            onClick={() => setModalDetalhe('variedade')}
            transition="all 0.15s ease"
            position="relative"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <VStack align="flex-start" gap={2}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Variedade musical
              </Text>
              <Text fontSize="2xl" fontWeight="black" color="cirqueira.musica.textoPrincipal">
                {capsula.faixasDistintas.toLocaleString('pt-BR')} músicas
              </Text>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario" lineHeight="tall">
                Você explorou {capsula.faixasDistintas} faixas diferentes neste mês
                {capsula.variacaoFaixasDistintasPercentual !== null && (
                  <Text
                    as="span"
                    color={
                      capsula.variacaoFaixasDistintasPercentual >= 0
                        ? 'cirqueira.musica.verde'
                        : 'red.400'
                    }
                    fontWeight="bold"
                    ml={1}
                  >
                    ({formatarPercentualVariacao(capsula.variacaoFaixasDistintasPercentual)})
                  </Text>
                )}
              </Text>
            </VStack>

            <VStack align="stretch" gap={3} pt={3}>
              <HStack gap={1.5} wrap="wrap">
                {capsula.topMusicas.slice(0, 4).map((m) => {
                  const chavePreview = gerarChaveFaixa(
                    m.codigoFaixa,
                    m.artistaPrincipal,
                    m.nomeFaixa
                  )
                  const fotoPreview =
                    m.imagemUrl || mapaImagensConsultadas?.[chavePreview]?.imagemUrl

                  return (
                    <Box
                      key={m.nomeFaixa}
                      boxSize={8}
                      borderRadius="6px"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="border.subtle"
                      bg="cirqueira.musica.cartaoElevado"
                    >
                      {fotoPreview ? (
                        <Box
                          as="img"
                          referrerPolicy="no-referrer"
                          src={urlCapaExibicao(fotoPreview) ?? undefined}
                          alt={m.nomeFaixa}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      ) : (
                        <Center w="full" h="full" color="cirqueira.musica.textoDesabilitado">
                          <Music2 size={12} />
                        </Center>
                      )}
                    </Box>
                  )
                })}
              </HStack>

              <HStack
                justify="space-between"
                align="center"
                pt={1}
                color="cirqueira.musica.textoSecundario"
                fontSize="xs"
              >
                <Text as="span">Ver detalhes da variedade</Text>
                <ChevronRight size={16} />
              </HStack>
            </VStack>
          </Box>
        </SimpleGrid>
      )}

      {!carregandoCapsula && capsula && (
        <TopsMesCapsula capsula={capsula} mapaImagens={mapaImagensConsultadas} />
      )}

      {modalDetalhe && capsula && (
        <ModalDetalheCapsula
          tipo={modalDetalhe}
          capsula={capsula}
          aberto={Boolean(modalDetalhe)}
          onFechar={() => setModalDetalhe(null)}
          isDesktop={isDesktop}
          mapaImagens={mapaImagensConsultadas}
        />
      )}
    </VStack>
  )
})

interface ModalDetalheCapsulaProps {
  tipo: 'musicas' | 'artistas' | 'tempo' | 'variedade'
  capsula: CapsulaMensal
  aberto: boolean
  onFechar: () => void
  isDesktop: boolean
  mapaImagens?: RespostaConsultaImagens
}

interface LinhaArtistaRankingCapsulaProps {
  artista: ItemRankingArtistaCapsula
  ano: number
  mes: number
  imagemUrlResolvida?: string | null
}

const LinhaArtistaRankingCapsula = memo(function LinhaArtistaRankingCapsula({
  artista,
  ano,
  mes,
  imagemUrlResolvida,
}: LinhaArtistaRankingCapsulaProps) {
  const [expandido, setExpandido] = useState(false)
  const [urlComErro, setUrlComErro] = useState<string | null>(null)
  const foto = artista.imagemUrl || imagemUrlResolvida
  const temFoto = Boolean(foto) && urlComErro !== foto

  return (
    <Collapsible.Root open={expandido} unmountOnExit>
      <Box
        borderRadius="8px"
        bg="cirqueira.musica.cartaoElevado"
        border="1px solid"
        borderColor={expandido ? 'cirqueira.musica.azul' : 'transparent'}
        transition="border-color 0.15s ease, background-color 0.15s ease"
        overflow="hidden"
      >
        <Flex
          align="center"
          justify="space-between"
          p={{ base: 2, sm: 3 }}
          cursor="pointer"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          onClick={() => setExpandido((prev) => !prev)}
          gap={{ base: 2, sm: 3 }}
          w="full"
          minW={0}
        >
          <HStack gap={{ base: 2, sm: 3 }} flex={1} minW={0} align="center">
            <Center
              boxSize={{ base: 6, sm: 8 }}
              borderRadius="8px"
              fontWeight="bold"
              fontSize={{ base: 'xs', sm: 'sm' }}
              color="cirqueira.musica.azul"
              flexShrink={0}
            >
              {artista.posicao}
            </Center>

            <Box
              boxSize={{ base: 9, sm: 10 }}
              borderRadius="full"
              overflow="hidden"
              border="1px solid"
              borderColor="border.subtle"
              bg="cirqueira.musica.cartaoElevado"
              flexShrink={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {temFoto ? (
                <Box
                  as="img"
                  referrerPolicy="no-referrer"
                  src={urlCapaExibicao(foto) ?? undefined}
                  alt={artista.nomeArtista}
                  w="full"
                  h="full"
                  objectFit="cover"
                  onError={() => {
                    if (foto) setUrlComErro(foto)
                  }}
                />
              ) : (
                <Avatar.Root size="md" shape="full">
                  <Avatar.Fallback
                    name={artista.nomeArtista}
                    bg="cirqueira.musica.cartaoElevado"
                    color="cirqueira.musica.textoSecundario"
                  />
                </Avatar.Root>
              )}
            </Box>

            <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
              <HStack gap={1.5} maxW="full">
                <Text
                  fontSize={{ base: 'xs', sm: 'sm' }}
                  fontWeight="bold"
                  color="cirqueira.musica.textoPrincipal"
                  truncate
                >
                  {artista.nomeArtista}
                </Text>
                {artista.urlSpotify && (
                  <Box
                    as="a"
                    href={artista.urlSpotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="cirqueira.musica.textoSecundario"
                    _hover={{ color: 'cirqueira.musica.verde' }}
                    flexShrink={0}
                    onClick={(e) => e.stopPropagation()}
                    display="inline-flex"
                    alignItems="center"
                  >
                    <ExternalLink size={12} />
                  </Box>
                )}
              </HStack>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                {artista.totalStreams} reproduções
              </Text>
              <DivisaoFontesMusica porFonte={artista.porFonte} />
            </VStack>
          </HStack>

          <HStack gap={{ base: 1.5, sm: 3 }} flexShrink={0} align="center">
            {artista.movimento !== null && (
              <HStack gap={1} fontSize="xs">
                {artista.movimento > 0 ? (
                  <HStack gap={0.5} color="cirqueira.musica.verde">
                    <ArrowUp size={14} />
                    <Text as="span">{artista.movimento}</Text>
                  </HStack>
                ) : artista.movimento < 0 ? (
                  <HStack gap={0.5} color="red.400">
                    <ArrowDown size={14} />
                    <Text as="span">{Math.abs(artista.movimento)}</Text>
                  </HStack>
                ) : (
                  <Minus
                    size={14}
                    color="var(--chakra-colors-cirqueira-musica-textoDesabilitado)"
                  />
                )}
              </HStack>
            )}

            {artista.isEstreia && (
              <Badge size="xs" variant="subtle" colorPalette="blue">
                Estreia
              </Badge>
            )}

            <Text
              fontSize={{ base: 'xs', sm: 'sm' }}
              fontWeight="bold"
              color="cirqueira.musica.verde"
            >
              <MinutosMusica minutos={artista.totalMinutos} />
            </Text>

            <Box
              color="cirqueira.musica.textoSecundario"
              transition="transform 0.2s ease"
              transform={expandido ? 'rotate(180deg)' : 'none'}
            >
              <ChevronDown size={16} />
            </Box>
          </HStack>
        </Flex>

        <Collapsible.Content>
          <Box px={3} pb={3} pt={1} borderTop="1px solid" borderColor="border.subtle">
            <ListaMusicasItem
              artista={artista.nomeArtista}
              periodo={{ tipo: 'mes', ano, mes }}
              aberto={expandido}
            />
          </Box>
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  )
})

function ModalDetalheCapsula({
  tipo,
  capsula,
  aberto,
  onFechar,
  isDesktop,
  mapaImagens,
}: ModalDetalheCapsulaProps) {
  const titulo =
    tipo === 'musicas'
      ? 'Músicas Mais Ouvidas'
      : tipo === 'artistas'
        ? 'Artistas Mais Ouvidos'
        : tipo === 'tempo'
          ? 'Tempo Ouvindo por Dia'
          : 'Variedade Musical'

  const subtitulo =
    tipo === 'musicas'
      ? `Você ouviu ${capsula.faixasDistintas.toLocaleString('pt-BR')} músicas diferentes este mês`
      : tipo === 'artistas'
        ? `${capsula.topArtistas.length} artistas no ranking principal`
        : tipo === 'tempo'
          ? `Total de ${formatarMinutos(capsula.totalMinutos)} distribuídos ao longo do mês`
          : `Exploração do catálogo no período de ${capsula.rotulo}`

  const renderConteudo = () => (
    <VStack gap={4} align="stretch" w="full">
      {tipo === 'musicas' && (
        <VStack gap={2} align="stretch">
          {capsula.topMusicas.map((m) => {
            const chaveMusica = gerarChaveFaixa(m.codigoFaixa, m.artistaPrincipal, m.nomeFaixa)
            const fotoMusica = m.imagemUrl || mapaImagens?.[chaveMusica]?.imagemUrl

            return (
              <Flex
                key={`${m.posicao}-${m.nomeFaixa}`}
                align="center"
                justify="space-between"
                p={{ base: 2, sm: 3 }}
                borderRadius="8px"
                bg="cirqueira.musica.cartaoElevado"
                gap={{ base: 2, sm: 3 }}
                w="full"
                minW={0}
              >
                <HStack gap={{ base: 2, sm: 3 }} flex={1} minW={0} align="center">
                  <Center
                    boxSize={{ base: 6, sm: 8 }}
                    borderRadius="8px"
                    fontWeight="bold"
                    fontSize={{ base: 'xs', sm: 'sm' }}
                    color="cirqueira.musica.amarelo"
                    flexShrink={0}
                  >
                    {m.posicao}
                  </Center>

                  <Box
                    boxSize={{ base: 10, sm: 12 }}
                    borderRadius="4px"
                    overflow="hidden"
                    bg="cirqueira.musica.cartao"
                    flexShrink={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {fotoMusica ? (
                      <Box
                        as="img"
                        referrerPolicy="no-referrer"
                        src={urlCapaExibicao(fotoMusica) ?? undefined}
                        alt={m.nomeFaixa}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    ) : (
                      <Center w="full" h="full" color="cirqueira.musica.textoDesabilitado">
                        <Music2 size={16} />
                      </Center>
                    )}
                  </Box>

                  <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
                    <HStack gap={1.5} maxW="full">
                      <Text
                        fontSize={{ base: 'xs', sm: 'sm' }}
                        fontWeight="bold"
                        color="cirqueira.musica.textoPrincipal"
                        truncate
                      >
                        {m.nomeFaixa}
                      </Text>
                      {m.urlSpotify && (
                        <Box
                          as="a"
                          href={m.urlSpotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="cirqueira.musica.textoSecundario"
                          _hover={{ color: 'cirqueira.musica.verde' }}
                          flexShrink={0}
                          display="inline-flex"
                          alignItems="center"
                        >
                          <ExternalLink size={12} />
                        </Box>
                      )}
                    </HStack>
                    <Text
                      fontSize="2xs"
                      color="cirqueira.musica.textoSecundario"
                      truncate
                      maxW="full"
                    >
                      {m.artistaPrincipal} • {m.album}
                    </Text>
                    <DivisaoFontesMusica porFonte={m.porFonte} />
                  </VStack>
                </HStack>

                <HStack gap={{ base: 1.5, sm: 3 }} flexShrink={0} align="center">
                  {m.movimento !== null && (
                    <HStack gap={1} fontSize="xs" display={{ base: 'none', sm: 'flex' }}>
                      {m.movimento > 0 ? (
                        <HStack gap={0.5} color="cirqueira.musica.verde">
                          <ArrowUp size={14} />
                          <Text as="span">{m.movimento}</Text>
                        </HStack>
                      ) : m.movimento < 0 ? (
                        <HStack gap={0.5} color="red.400">
                          <ArrowDown size={14} />
                          <Text as="span">{Math.abs(m.movimento)}</Text>
                        </HStack>
                      ) : (
                        <Minus
                          size={14}
                          color="var(--chakra-colors-cirqueira-musica-textoDesabilitado)"
                        />
                      )}
                    </HStack>
                  )}

                  {m.isEstreia && (
                    <Badge size="xs" variant="subtle" colorPalette="yellow">
                      Estreia
                    </Badge>
                  )}

                  {m.mesesNoTop5 > 1 && (
                    <Text
                      fontSize="2xs"
                      color="cirqueira.musica.textoSecundario"
                      display={{ base: 'none', md: 'block' }}
                    >
                      {m.mesesNoTop5} meses no top 5
                    </Text>
                  )}

                  <VStack align="flex-end" gap={0}>
                    <Text
                      fontSize={{ base: 'xs', sm: 'sm' }}
                      fontWeight="bold"
                      color="cirqueira.musica.amarelo"
                    >
                      {m.totalStreams} streams
                    </Text>
                    <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                      <MinutosMusica minutos={m.totalMinutos} />
                    </Text>
                  </VStack>
                </HStack>
              </Flex>
            )
          })}
        </VStack>
      )}

      {tipo === 'artistas' && (
        <VStack gap={2} align="stretch">
          {capsula.topArtistas.map((a) => {
            const chave = gerarChaveArtista(a.codigoArtista, a.nomeArtista)
            const imagemUrl = a.imagemUrl || mapaImagens?.[chave]?.imagemUrl
            return (
              <LinhaArtistaRankingCapsula
                key={`${a.posicao}-${a.nomeArtista}`}
                artista={a}
                ano={capsula.ano}
                mes={capsula.mes}
                imagemUrlResolvida={imagemUrl}
              />
            )
          })}
        </VStack>
      )}

      {tipo === 'tempo' && (
        <VStack gap={4} align="stretch">
          <Box h="280px" w="full" pt={4}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={capsula.minutosPorDia}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chakra-colors-border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="dia"
                  stroke="var(--chakra-colors-cirqueira-musica-textoSecundario)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--chakra-colors-cirqueira-musica-textoSecundario)"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const dado = payload[0].payload
                    return (
                      <Box
                        bg="cirqueira.musica.cartaoElevado"
                        border="1px solid"
                        borderColor="border.subtle"
                        p={2}
                        borderRadius="6px"
                        fontSize="xs"
                      >
                        <Text fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                          Dia {dado.dia}
                        </Text>
                        <Text color="cirqueira.musica.verde">{formatarMinutos(dado.minutos)}</Text>
                        {dado.minutos >= 60 && (
                          <Text color="cirqueira.musica.textoSecundario">
                            {formatarMinutosEmHorasExtenso(dado.minutos)}
                          </Text>
                        )}
                      </Box>
                    )
                  }}
                />
                <Bar
                  dataKey="minutos"
                  fill="var(--chakra-colors-cirqueira-musica-verde)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </VStack>
      )}

      {tipo === 'variedade' && (
        <VStack gap={4} align="stretch" w="full">
          <SimpleGrid columns={{ base: 2, sm: 4 }} gap={{ base: 2, sm: 3 }}>
            <Box
              p={{ base: 2.5, sm: 3 }}
              borderRadius="8px"
              bg="cirqueira.musica.cartaoElevado"
              border="1px solid"
              borderColor="border.subtle"
            >
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
                fontWeight="bold"
              >
                Faixas Distintas
              </Text>
              <Text
                fontSize={{ base: 'lg', sm: '2xl' }}
                fontWeight="black"
                color="cirqueira.musica.textoPrincipal"
                mt={1}
              >
                {capsula.faixasDistintas.toLocaleString('pt-BR')}
              </Text>
              {capsula.variacaoFaixasDistintasPercentual !== null && (
                <HStack gap={1} mt={1} fontSize="xs">
                  {capsula.variacaoFaixasDistintasPercentual > 0 ? (
                    <HStack gap={0.5} color="cirqueira.musica.verde">
                      <ArrowUp size={12} />
                      <Text as="span">
                        +{capsula.variacaoFaixasDistintasPercentual.toFixed(1)}%
                      </Text>
                    </HStack>
                  ) : capsula.variacaoFaixasDistintasPercentual < 0 ? (
                    <HStack gap={0.5} color="red.400">
                      <ArrowDown size={12} />
                      <Text as="span">{capsula.variacaoFaixasDistintasPercentual.toFixed(1)}%</Text>
                    </HStack>
                  ) : (
                    <Text as="span" color="cirqueira.musica.textoSecundario">
                      0% vs mês anterior
                    </Text>
                  )}
                </HStack>
              )}
            </Box>

            <Box
              p={{ base: 2.5, sm: 3 }}
              borderRadius="8px"
              bg="cirqueira.musica.cartaoElevado"
              border="1px solid"
              borderColor="border.subtle"
            >
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
                fontWeight="bold"
              >
                Total de Streams
              </Text>
              <Text
                fontSize={{ base: 'lg', sm: '2xl' }}
                fontWeight="black"
                color="cirqueira.musica.textoPrincipal"
                mt={1}
              >
                {capsula.totalStreams.toLocaleString('pt-BR')}
              </Text>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" mt={1}>
                <MinutosMusica minutos={capsula.totalMinutos} sufixo="ouvidos" />
              </Text>
            </Box>

            <Box
              p={{ base: 2.5, sm: 3 }}
              borderRadius="8px"
              bg="cirqueira.musica.cartaoElevado"
              border="1px solid"
              borderColor="border.subtle"
            >
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
                fontWeight="bold"
              >
                Média por Faixa
              </Text>
              <Text
                fontSize={{ base: 'lg', sm: '2xl' }}
                fontWeight="black"
                color="cirqueira.musica.textoPrincipal"
                mt={1}
              >
                {(capsula.totalStreams / Math.max(1, capsula.faixasDistintas)).toFixed(1)}x
              </Text>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" mt={1}>
                reproduções por música
              </Text>
            </Box>

            <Box
              p={{ base: 2.5, sm: 3 }}
              borderRadius="8px"
              bg="cirqueira.musica.cartaoElevado"
              border="1px solid"
              borderColor="border.subtle"
            >
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
                fontWeight="bold"
              >
                Índice de Variedade
              </Text>
              <Text
                fontSize={{ base: 'lg', sm: '2xl' }}
                fontWeight="black"
                color="cirqueira.musica.verde"
                mt={1}
              >
                {Math.min(
                  100,
                  Math.round((capsula.faixasDistintas / Math.max(1, capsula.totalStreams)) * 100)
                )}
                %
              </Text>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" mt={1}>
                faixas únicas ouvidas
              </Text>
            </Box>
          </SimpleGrid>

          <Text
            fontSize="xs"
            fontWeight="bold"
            color="cirqueira.musica.textoSecundario"
            textTransform="uppercase"
            mt={2}
          >
            Músicas exploradas no mês ({capsula.topMusicas.length})
          </Text>

          <VStack gap={2} align="stretch">
            {capsula.topMusicas.map((m) => {
              const chaveMusica = gerarChaveFaixa(m.codigoFaixa, m.artistaPrincipal, m.nomeFaixa)
              const fotoMusica = m.imagemUrl || mapaImagens?.[chaveMusica]?.imagemUrl

              return (
                <Flex
                  key={`variedade-${m.posicao}-${m.nomeFaixa}`}
                  align="center"
                  justify="space-between"
                  p={{ base: 2, sm: 3 }}
                  borderRadius="8px"
                  bg="cirqueira.musica.cartaoElevado"
                  gap={{ base: 2, sm: 3 }}
                >
                  <HStack gap={{ base: 2, sm: 3 }} flex={1} minW={0} align="center">
                    <Center
                      boxSize={{ base: 6, sm: 8 }}
                      borderRadius="8px"
                      fontWeight="bold"
                      fontSize={{ base: 'xs', sm: 'sm' }}
                      color="cirqueira.musica.amarelo"
                      flexShrink={0}
                    >
                      {m.posicao}
                    </Center>

                    <Box
                      boxSize={{ base: 10, sm: 12 }}
                      borderRadius="4px"
                      overflow="hidden"
                      bg="cirqueira.musica.cartao"
                      flexShrink={0}
                    >
                      {fotoMusica ? (
                        <Box
                          as="img"
                          referrerPolicy="no-referrer"
                          src={urlCapaExibicao(fotoMusica) ?? undefined}
                          alt={m.nomeFaixa}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      ) : (
                        <Center w="full" h="full" color="cirqueira.musica.textoDesabilitado">
                          <Music2 size={18} />
                        </Center>
                      )}
                    </Box>

                    <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
                      <HStack gap={1.5} maxW="full">
                        <Text
                          fontSize={{ base: 'xs', sm: 'sm' }}
                          fontWeight="bold"
                          color="cirqueira.musica.textoPrincipal"
                          truncate
                        >
                          {m.nomeFaixa}
                        </Text>
                        {m.urlSpotify && (
                          <Box
                            as="a"
                            href={m.urlSpotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="cirqueira.musica.textoSecundario"
                            _hover={{ color: 'cirqueira.musica.verde' }}
                            display="inline-flex"
                            alignItems="center"
                            flexShrink={0}
                          >
                            <ExternalLink size={12} />
                          </Box>
                        )}
                      </HStack>
                      <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate>
                        {m.artistaPrincipal} • {m.album}
                      </Text>
                      <DivisaoFontesMusica porFonte={m.porFonte} />
                    </VStack>
                  </HStack>

                  <VStack align="flex-end" gap={0} flexShrink={0}>
                    <Text
                      fontSize={{ base: 'xs', sm: 'sm' }}
                      fontWeight="bold"
                      color="cirqueira.musica.verde"
                      lineHeight="short"
                    >
                      <MinutosMusica minutos={m.totalMinutos} />
                    </Text>
                    <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                      {m.totalStreams} {m.totalStreams === 1 ? 'stream' : 'streams'}
                    </Text>
                  </VStack>
                </Flex>
              )
            })}
          </VStack>
        </VStack>
      )}
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
                <VStack align="flex-start" gap={0.5}>
                  <Drawer.Title fontSize={{ base: 'sm', sm: 'md' }} fontWeight="bold">
                    {titulo}
                  </Drawer.Title>
                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
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
