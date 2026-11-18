import { Box, Flex, Grid, HStack, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { Clock3, Moon, Sunrise, Timer } from 'lucide-react'
import { type ReactNode, memo, useState } from 'react'
import { useBlocoMusica, useImagensItensMusica } from '../hooks'
import type {
  ExtremosDiaMusica,
  FiltroBlocoMusica,
  RotinaMusica,
  SessoesMusica,
} from '../typesBlocos'
import {
  CORES_FAIXA_DO_DIA,
  NOMES_DIAS_SEMANA_CURTO,
  ROTULOS_FAIXA_DO_DIA,
  criarOpcoesPeriodoBlocos,
  encontrarPico,
  faixaDaHora,
  filtroDaOpcao,
  formatarDataHoraPtBr,
  formatarMinutos,
  formatarNumeroPtBr,
  gerarRotaArtista,
  gerarRotaMusica,
  musicasValidas,
  proporcao,
  rotuloFaixaSessao,
} from '../utils'
import { CabecalhoSecaoMusica } from './CabecalhoSecaoMusica'
import { CapaMusica } from './CapaMusica'
import { LinkMusica } from './LinkMusica'
import { CartaoBlocoMusica, MosaicoCapasMusica, VazioBlocoMusica } from './PecasBlocoMusica'
import { SecaoHabitos } from './SecaoHabitos'
import { SeletorPeriodoAnalise } from './SeletorPeriodoAnalise'

export const AbaHabitos = memo(function AbaHabitos({ habilitado }: { habilitado: boolean }) {
  const opcoes = criarOpcoesPeriodoBlocos(new Date().getFullYear())
  const [chavePeriodo, setChavePeriodo] = useState('90d')
  const filtro = filtroDaOpcao(opcoes, chavePeriodo)

  return (
    <VStack align="stretch" gap={6}>
      <CabecalhoSecaoMusica
        titulo="Hábitos"
        descricao="Quando, quanto tempo seguido e com o que você abre e fecha o dia"
        acoes={
          <SeletorPeriodoAnalise
            opcoes={opcoes}
            selecionada={chavePeriodo}
            onSelecionar={setChavePeriodo}
          />
        }
      />
      <BlocoRotina habilitado={habilitado} filtro={filtro} />
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
        <BlocoSessoes habilitado={habilitado} filtro={filtro} />
        <BlocoExtremos habilitado={habilitado} filtro={filtro} />
      </Grid>
      <SecaoHabitos habilitado={habilitado} filtroExterno={filtro} />
    </VStack>
  )
})

function BlocoRotina({ habilitado, filtro }: { habilitado: boolean; filtro: FiltroBlocoMusica }) {
  const { data, isLoading } = useBlocoMusica<RotinaMusica>('rotina', habilitado, { ...filtro })
  const artistas = (data?.periodos ?? []).flatMap((periodo) =>
    periodo.topArtista ? [periodo.topArtista] : []
  )
  const imagemDe = useImagensItensMusica(artistas)

  if (isLoading || !data) return <Skeleton h="360px" borderRadius="12px" />

  const pico = encontrarPico(data.porHora)
  const maximoHora = pico?.minutos ?? 0
  const maximoDia = encontrarPico(data.porDiaSemana)?.minutos ?? 0

  return (
    <CartaoBlocoMusica
      titulo="Sua rotina"
      descricao="Minutos por hora e por dia da semana no período, com o pico destacado e o artista favorito de cada faixa do dia."
      icone={<Clock3 size={14} />}
    >
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        <VStack align="stretch" gap={2}>
          <Flex align="flex-end" gap={{ base: '2px', md: '4px' }} h="160px">
            {data.porHora.map((hora) => {
              const ehPico = pico?.hora === hora.hora && hora.minutos > 0
              return (
                <VStack
                  key={hora.hora}
                  flex={1}
                  h="full"
                  justify="flex-end"
                  gap={1}
                  title={`${hora.hora}h · ${formatarMinutos(hora.minutos)}`}
                >
                  {ehPico ? (
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      color="cirqueira.musica.textoPrincipal"
                      whiteSpace="nowrap"
                    >
                      pico
                    </Text>
                  ) : null}
                  <Box
                    w="full"
                    h={`${Math.max(3, proporcao(hora.minutos, maximoHora))}%`}
                    bg={CORES_FAIXA_DO_DIA[faixaDaHora(hora.hora)]}
                    opacity={ehPico ? 1 : 0.6}
                    borderRadius="3px"
                  />
                </VStack>
              )
            })}
          </Flex>
          <Flex justify="space-between">
            {[0, 6, 12, 18, 23].map((hora) => (
              <Text key={hora} fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
                {hora}h
              </Text>
            ))}
          </Flex>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            color="cirqueira.musica.textoSecundario"
            textTransform="uppercase"
            pt={3}
          >
            Dias da semana
          </Text>
          <SimpleGrid columns={7} gap={2}>
            {data.porDiaSemana.map((dia) => (
              <VStack key={dia.diaSemana} gap={1}>
                <Flex
                  h="56px"
                  w="full"
                  align="flex-end"
                  bg="cirqueira.musica.cartaoElevado"
                  borderRadius="4px"
                  overflow="hidden"
                >
                  <Box
                    w="full"
                    h={`${Math.max(4, proporcao(dia.minutos, maximoDia))}%`}
                    bg="cirqueira.musica.verde"
                  />
                </Flex>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                  {NOMES_DIAS_SEMANA_CURTO[dia.diaSemana]}
                </Text>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>

        <SimpleGrid columns={{ base: 2, lg: 1 }} gap={2}>
          {data.periodos.map((periodo) => (
            <HStack
              key={periodo.faixa}
              gap={3}
              p={2.5}
              borderRadius="8px"
              bg="cirqueira.musica.cartaoElevado"
              borderLeft="3px solid"
              borderLeftColor={CORES_FAIXA_DO_DIA[periodo.faixa]}
            >
              {periodo.topArtista ? (
                <LinkMusica
                  to={gerarRotaArtista(periodo.topArtista.nome, periodo.topArtista.artistaUuid)}
                >
                  <CapaMusica
                    url={imagemDe(periodo.topArtista)}
                    alt={periodo.topArtista.nome}
                    tipo="artista"
                    boxSize="40px"
                  />
                </LinkMusica>
              ) : null}
              <VStack align="flex-start" gap={0} minW={0}>
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  color={CORES_FAIXA_DO_DIA[periodo.faixa]}
                >
                  {ROTULOS_FAIXA_DO_DIA[periodo.faixa]} · {formatarMinutos(periodo.minutos)}
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="cirqueira.musica.textoPrincipal"
                  lineClamp={1}
                >
                  {periodo.topArtista?.nome ?? '—'}
                </Text>
              </VStack>
            </HStack>
          ))}
        </SimpleGrid>
      </Grid>
    </CartaoBlocoMusica>
  )
}

function BlocoSessoes({ habilitado, filtro }: { habilitado: boolean; filtro: FiltroBlocoMusica }) {
  const { data, isLoading } = useBlocoMusica<SessoesMusica>('sessoes', habilitado, { ...filtro })
  const imagemDe = useImagensItensMusica(data?.maratonaMusicas ?? [])

  if (isLoading || !data) return <Skeleton h="320px" borderRadius="12px" />

  const maximo =
    encontrarPico(data.histograma.map((faixa) => ({ ...faixa, minutos: faixa.sessoes })))
      ?.minutos ?? 0

  return (
    <CartaoBlocoMusica
      titulo="Sessões de escuta"
      descricao="Quanto tempo você costuma ouvir de uma vez: distribuição das sessões e a maior maratona do período."
      icone={<Timer size={14} />}
      cor="cirqueira.musica.azul"
    >
      <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mb={3}>
        {formatarNumeroPtBr(data.sessoes)} sessões · média de{' '}
        {formatarMinutos(data.duracaoMediaMinutos)}
      </Text>
      <VStack align="stretch" gap={1.5}>
        {data.histograma.map((faixa, indice) => (
          <HStack key={faixa.ateMinutos ?? 'mais'} gap={2}>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" w="72px" flexShrink={0}>
              {rotuloFaixaSessao(faixa.ateMinutos, data.histograma[indice - 1]?.ateMinutos ?? null)}
            </Text>
            <Box
              flex={1}
              h="14px"
              bg="cirqueira.musica.cartaoElevado"
              borderRadius="3px"
              overflow="hidden"
            >
              <Box
                h="full"
                w={`${Math.max(1, proporcao(faixa.sessoes, maximo))}%`}
                bg="cirqueira.musica.azul"
                borderRadius="3px"
              />
            </Box>
            <Text
              fontSize="2xs"
              fontWeight="bold"
              color="cirqueira.musica.textoPrincipal"
              w="36px"
              textAlign="right"
            >
              {formatarNumeroPtBr(faixa.sessoes)}
            </Text>
          </HStack>
        ))}
      </VStack>
      {data.maratonaMinutos > 0 ? (
        <HStack mt={5} gap={4} p={3} borderRadius="10px" bg="cirqueira.musica.cartaoElevado">
          <MosaicoCapasMusica musicas={data.maratonaMusicas} imagemDe={imagemDe} tamanho="88px" />
          <VStack align="flex-start" gap={0} minW={0}>
            <Text
              fontSize="2xs"
              fontWeight="bold"
              textTransform="uppercase"
              color="cirqueira.musica.amarelo"
            >
              Maior maratona
            </Text>
            <Text
              fontSize="2xl"
              fontWeight="black"
              color="cirqueira.musica.textoPrincipal"
              lineHeight="1.1"
            >
              {formatarMinutos(data.maratonaMinutos)}
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
              {formatarNumeroPtBr(data.maratonaFaixas)} faixas ·{' '}
              {formatarDataHoraPtBr(data.maratonaInicio)}
            </Text>
          </VStack>
        </HStack>
      ) : null}
    </CartaoBlocoMusica>
  )
}

function BlocoExtremos({ habilitado, filtro }: { habilitado: boolean; filtro: FiltroBlocoMusica }) {
  const { data, isLoading } = useBlocoMusica<ExtremosDiaMusica>('extremos-dia', habilitado, {
    ...filtro,
  })
  const imagemDe = useImagensItensMusica(
    musicasValidas(
      [...(data?.aberturas ?? []), ...(data?.fechamentos ?? [])].map((item) => item.musica)
    )
  )

  if (isLoading || !data) return <Skeleton h="320px" borderRadius="12px" />

  return (
    <CartaoBlocoMusica
      titulo="Primeira e última do dia"
      descricao="As músicas que mais abrem e fecham o seu dia no período — a primeira e a última tocada em cada jornada."
      icone={<Sunrise size={14} />}
    >
      <SimpleGrid columns={2} gap={4}>
        <ColunaExtremo
          titulo="Abre o dia"
          icone={<Sunrise size={12} />}
          itens={data.aberturas}
          imagemDe={imagemDe}
        />
        <ColunaExtremo
          titulo="Fecha o dia"
          icone={<Moon size={12} />}
          itens={data.fechamentos}
          imagemDe={imagemDe}
        />
      </SimpleGrid>
    </CartaoBlocoMusica>
  )
}

function ColunaExtremo({
  titulo,
  icone,
  itens,
  imagemDe,
}: {
  titulo: string
  icone: ReactNode
  itens: ExtremosDiaMusica['aberturas']
  imagemDe: ReturnType<typeof useImagensItensMusica>
}) {
  const [primeiro, ...resto] = itens
  return (
    <VStack align="stretch" gap={2} minW={0}>
      <HStack gap={1.5} color="cirqueira.musica.textoSecundario">
        {icone}
        <Text fontSize="2xs" fontWeight="bold" textTransform="uppercase">
          {titulo}
        </Text>
      </HStack>
      {!primeiro ? (
        <VazioBlocoMusica texto="Sem dados." />
      ) : (
        <>
          <LinkMusica to={gerarRotaMusica(primeiro.nome, primeiro.artista, primeiro.musicaUuid)}>
            <CapaMusica
              url={primeiro.musica ? imagemDe(primeiro.musica) : null}
              alt={primeiro.nome}
              w="full"
              aspectRatio={1}
              borderRadius="10px"
              tamanhoIcone={32}
            />
          </LinkMusica>
          <Box>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="cirqueira.musica.textoPrincipal"
              lineClamp={1}
            >
              {primeiro.nome}
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
              {primeiro.artista} · {primeiro.dias} dias
            </Text>
          </Box>
          {resto.slice(0, 3).map((item) => (
            <LinkMusica
              key={item.musicaUuid}
              to={gerarRotaMusica(item.nome, item.artista, item.musicaUuid)}
            >
              <HStack gap={2}>
                <CapaMusica
                  url={item.musica ? imagemDe(item.musica) : null}
                  alt={item.nome}
                  boxSize="32px"
                />
                <VStack align="flex-start" gap={0} minW={0}>
                  <Text fontSize="xs" color="cirqueira.musica.textoPrincipal" lineClamp={1}>
                    {item.nome}
                  </Text>
                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                    {item.dias} dias
                  </Text>
                </VStack>
              </HStack>
            </LinkMusica>
          ))}
        </>
      )}
    </VStack>
  )
}
