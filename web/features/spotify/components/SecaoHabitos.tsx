import {
  Box,
  Flex,
  HStack,
  Link,
  Progress,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Fingerprint, Repeat1, Shuffle, SkipForward, Sparkle, Target } from 'lucide-react'
import { memo, useState } from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import { useHabitosSpotify, useImagensItensSpotify } from '../hooks'
import type { HabitosSpotify } from '../types'
import {
  criarOpcoesPeriodoAnalise,
  descreverPerfilGosto,
  formatarMinutosParaHorasEMinutos,
  formatarNumeroPtBr,
  formatarPercentualSimples,
  gerarRotaArtista,
} from '../utils'
import { CabecalhoSecaoSpotify } from './CabecalhoSecaoSpotify'
import { CapaSpotify } from './CapaSpotify'
import { CartaoMetricaSpotify } from './CartaoMetricaSpotify'
import { MapaHorariosSpotify } from './MapaHorariosSpotify'
import { SeletorPeriodoAnalise } from './SeletorPeriodoAnalise'

export interface SecaoHabitosProps {
  habilitado: boolean
}

export const SecaoHabitos = memo(function SecaoHabitos({ habilitado }: SecaoHabitosProps) {
  const opcoes = criarOpcoesPeriodoAnalise(new Date().getFullYear())
  const [chavePeriodo, setChavePeriodo] = useState('90d')
  const filtro = (opcoes.find((opcao) => opcao.chave === chavePeriodo) ?? opcoes[0])?.filtro ?? {
    periodo: 'dias',
    dias: 30,
  }
  const { data, isLoading } = useHabitosSpotify(filtro, habilitado)

  return (
    <VStack align="stretch" gap={4} w="full">
      <CabecalhoSecaoSpotify
        titulo="Seus Hábitos"
        descricao="Quando você ouve, quanto se concentra nos favoritos e como você ouve"
        acoes={
          <SeletorPeriodoAnalise
            opcoes={opcoes}
            selecionada={chavePeriodo}
            onSelecionar={setChavePeriodo}
          />
        }
      />

      {isLoading || !data ? (
        <Skeleton h="320px" borderRadius="8px" />
      ) : (
        <ConteudoHabitos dados={data} />
      )}
    </VStack>
  )
})

function ConteudoHabitos({ dados }: { dados: HabitosSpotify }) {
  const { concentracao, comportamento } = dados
  const perfil = descreverPerfilGosto(
    concentracao.percentualTopArtistas,
    concentracao.percentualUmaVez
  )
  const imagemDe = useImagensItensSpotify(concentracao.topArtistas)

  return (
    <VStack align="stretch" gap={4}>
      <Box
        p={{ base: 3, sm: 5 }}
        bg="cirqueira.spotify.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="cirqueira.spotify.cartaoElevado"
      >
        <VStack align="stretch" gap={3}>
          <Text fontSize="xs" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
            Mapa de horários · {dados.periodo.rotulo}
          </Text>
          <MapaHorariosSpotify celulas={dados.mapaHorarios} />
        </VStack>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        <Box
          p={{ base: 3, sm: 5 }}
          bg="cirqueira.spotify.cartao"
          borderRadius="8px"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
        >
          <VStack align="stretch" gap={4}>
            <HStack gap={2} color="cirqueira.spotify.amarelo">
              <Target size={15} />
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                Concentração do gosto
              </Text>
            </HStack>

            <VStack align="stretch" gap={1.5}>
              <Flex justify="space-between" align="baseline">
                <Text fontSize="sm" color="cirqueira.spotify.textoPrincipal">
                  Tempo nos 5 artistas do topo
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="cirqueira.spotify.verde">
                  {formatarPercentualSimples(concentracao.percentualTopArtistas)}
                </Text>
              </Flex>
              <Progress.Root
                value={concentracao.percentualTopArtistas}
                size="sm"
                colorPalette="green"
              >
                <Progress.Track bg="cirqueira.spotify.cartaoElevado" borderRadius="full">
                  <Progress.Range bg="cirqueira.spotify.verde" borderRadius="full" />
                </Progress.Track>
              </Progress.Root>
              <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
                {formatarMinutosParaHorasEMinutos(concentracao.minutosTopArtistas)} de{' '}
                {formatarMinutosParaHorasEMinutos(dados.totalMinutos)} entre{' '}
                {formatarNumeroPtBr(concentracao.artistasDistintos)} artistas
              </Text>
            </VStack>

            <VStack align="stretch" gap={2}>
              {concentracao.topArtistas.map((artista) => {
                const percentual =
                  dados.totalMinutos > 0 ? (artista.minutos / dados.totalMinutos) * 100 : 0
                return (
                  <Link
                    key={artista.nome}
                    asChild
                    _hover={{ textDecoration: 'none' }}
                    display="block"
                  >
                    <LinkRouter to={gerarRotaArtista(artista.nome)}>
                      <HStack gap={2.5}>
                        <CapaSpotify
                          url={imagemDe(artista)}
                          alt={artista.nome}
                          tipo="artista"
                          boxSize="28px"
                          tamanhoIcone={12}
                        />
                        <VStack align="stretch" gap={1} flex={1} minW={0}>
                          <Flex justify="space-between" gap={2}>
                            <Text fontSize="xs" color="cirqueira.spotify.textoPrincipal" truncate>
                              {artista.nome}
                            </Text>
                            <Text
                              fontSize="2xs"
                              color="cirqueira.spotify.textoSecundario"
                              flexShrink={0}
                            >
                              {formatarPercentualSimples(Math.round(percentual * 10) / 10)}
                            </Text>
                          </Flex>
                          <Box h="3px" borderRadius="full" bg="cirqueira.spotify.cartaoElevado">
                            <Box
                              h="full"
                              w={`${percentual}%`}
                              borderRadius="full"
                              bg="cirqueira.spotify.azul"
                            />
                          </Box>
                        </VStack>
                      </HStack>
                    </LinkRouter>
                  </Link>
                )
              })}
            </VStack>

            <HStack
              gap={3}
              p={3}
              borderRadius="8px"
              bg="cirqueira.spotify.cartaoElevado"
              align="flex-start"
            >
              <Box color="cirqueira.spotify.amarelo" pt={0.5}>
                <Fingerprint size={18} />
              </Box>
              <VStack align="flex-start" gap={0.5}>
                <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                  {perfil.titulo}
                </Text>
                <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                  {perfil.descricao}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>

        <SimpleGrid columns={2} gap={{ base: 2, md: 3 }} alignContent="start">
          <CartaoMetricaSpotify
            icone={Sparkle}
            cor="cirqueira.spotify.azul"
            rotulo="Ouvidas uma única vez"
            valor={formatarPercentualSimples(concentracao.percentualUmaVez)}
            detalhe={`${formatarNumeroPtBr(concentracao.faixasUmaVez)} de ${formatarNumeroPtBr(concentracao.faixasDistintas)} músicas diferentes`}
          />
          <CartaoMetricaSpotify
            icone={Repeat1}
            cor="cirqueira.spotify.verde"
            rotulo="Proporção de repetição"
            valor={formatarPercentualSimples(concentracao.percentualRepeticao)}
            detalhe={`Em média ${concentracao.streamsPorFaixa.toLocaleString('pt-BR')} streams por música`}
          />
          <CartaoMetricaSpotify
            icone={SkipForward}
            cor="cirqueira.spotify.amarelo"
            rotulo="Taxa de pulos"
            valor={formatarPercentualSimples(comportamento.taxaPulos)}
            detalhe={
              comportamento.comDadoPulo > 0
                ? `${formatarNumeroPtBr(comportamento.puladas)} de ${formatarNumeroPtBr(comportamento.comDadoPulo)} reproduções puladas`
                : 'Importe o histórico estendido para ver'
            }
          />
          <CartaoMetricaSpotify
            icone={Shuffle}
            cor="cirqueira.spotify.azul"
            rotulo="No modo aleatório"
            valor={formatarPercentualSimples(comportamento.taxaAleatorio)}
            detalhe={
              comportamento.comDadoAleatorio > 0
                ? `${formatarNumeroPtBr(comportamento.aleatorias)} reproduções com aleatório ligado`
                : 'Importe o histórico estendido para ver'
            }
          />
        </SimpleGrid>
      </SimpleGrid>
    </VStack>
  )
}
