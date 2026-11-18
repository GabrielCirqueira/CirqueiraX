import { Box, Flex, Grid, HStack, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import {
  CalendarHeart,
  Clock3,
  History,
  PieChart as IconePizza,
  UserPlus,
  Wind,
} from 'lucide-react'
import { memo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import {
  useBlocoMusica,
  useFonteMusica,
  useImagensItensMusica,
  useUltimasOuvidasMusica,
} from '../hooks'
import type { ArtistaAnalise } from '../types'
import type { NesteDiaMusica, SaudadeMusica, VisaoGeralMusica } from '../typesBlocos'
import {
  CORES_FAIXA_DO_DIA,
  CORES_FONTE_REPRODUCAO,
  CORES_GRAFICO_MUSICA,
  ROTULOS_FONTE_REPRODUCAO,
  encontrarPico,
  faixaDaHora,
  fatiasPorFonte,
  formatarDiasSemOuvir,
  formatarMinutos,
  gerarRotaArtista,
  gerarRotaMusica,
  horaDaReproducao,
  musicasValidas,
  proporcao,
} from '../utils'
import { CapaMusica } from './CapaMusica'
import { IconeFonteMusica } from './IconeFonteMusica'
import { LinkMusica } from './LinkMusica'
import {
  AtalhoAbaMusica,
  CartaoBlocoMusica,
  MosaicoCapasMusica,
  VazioBlocoMusica,
} from './PecasBlocoMusica'

const CORES_PIZZA = {
  spotify: CORES_GRAFICO_MUSICA.fonteSpotify,
  youtube_music: CORES_GRAFICO_MUSICA.fonteYoutubeMusic,
}

export const VisaoGeralAtalhos = memo(function VisaoGeralAtalhos({
  dados,
  habilitado,
}: {
  dados: VisaoGeralMusica
  habilitado: boolean
}) {
  const { fonte } = useFonteMusica()
  const mostrarRosca = fonte === 'todas' && fatiasPorFonte(dados.totais.porFonte).length > 0

  return (
    <VStack align="stretch" gap={4}>
      <Grid
        templateColumns={{ base: '1fr', md: mostrarRosca ? '1fr 1.3fr 1.3fr' : '1fr 1fr' }}
        gap={4}
      >
        {mostrarRosca ? <RoscaServicos dados={dados} /> : null}
        <RotinaMini porHora={dados.porHora} />
        <RostosNovos artistas={dados.artistasNovos} />
      </Grid>
      <Grid templateColumns={{ base: '1fr', md: '1.4fr 1fr 1fr' }} gap={4}>
        <UltimasOuvidasMini habilitado={habilitado} />
        <SaudadeMini habilitado={habilitado} />
        <NesteDiaMini habilitado={habilitado} />
      </Grid>
    </VStack>
  )
})

function RoscaServicos({ dados }: { dados: VisaoGeralMusica }) {
  const fatias = fatiasPorFonte(dados.totais.porFonte)
  return (
    <CartaoBlocoMusica
      titulo="Onde você ouviu"
      descricao="Proporção de minutos entre Spotify e YouTube Music no período da visão geral."
      icone={<IconePizza size={14} />}
      cor="cirqueira.musica.textoPrincipal"
      acao={<AtalhoAbaMusica aba="servicos" rotulo="Comparar" />}
    >
      <Flex align="center" gap={4}>
        <Box boxSize="112px" flexShrink={0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fatias}
                dataKey="minutos"
                innerRadius="62%"
                outerRadius="100%"
                stroke="none"
                paddingAngle={2}
              >
                {fatias.map((fatia) => (
                  <Cell key={fatia.fonte} fill={CORES_PIZZA[fatia.fonte]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <VStack align="stretch" gap={2} minW={0}>
          {fatias.map((fatia) => (
            <HStack key={fatia.fonte} gap={2}>
              <IconeFonteMusica fonte={fatia.fonte} tamanho={14} />
              <VStack align="flex-start" gap={0}>
                <Text
                  fontSize="lg"
                  fontWeight="black"
                  color={CORES_FONTE_REPRODUCAO[fatia.fonte]}
                  lineHeight="1.1"
                >
                  {fatia.percentual}%
                </Text>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                  {ROTULOS_FONTE_REPRODUCAO[fatia.fonte]} · {formatarMinutos(fatia.minutos)}
                </Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
      </Flex>
    </CartaoBlocoMusica>
  )
}

function RotinaMini({ porHora }: { porHora: { hora: number; minutos: number }[] }) {
  const pico = encontrarPico(porHora)
  const maximo = pico?.minutos ?? 0
  return (
    <CartaoBlocoMusica
      titulo="Rotina"
      descricao="Miniatura das 24 horas: em quais horários você mais ouviu no período."
      icone={<Clock3 size={14} />}
      acao={<AtalhoAbaMusica aba="habitos" rotulo="Hábitos" />}
    >
      <Flex align="flex-end" gap="3px" h="84px">
        {porHora.map((hora) => (
          <Box
            key={hora.hora}
            flex={1}
            h={`${Math.max(4, proporcao(hora.minutos, maximo))}%`}
            bg={CORES_FAIXA_DO_DIA[faixaDaHora(hora.hora)]}
            opacity={pico?.hora === hora.hora ? 1 : 0.55}
            borderRadius="2px"
            title={`${hora.hora}h · ${formatarMinutos(hora.minutos)}`}
          />
        ))}
      </Flex>
      <Flex justify="space-between" mt={1}>
        {['0h', '6h', '12h', '18h', '23h'].map((rotulo) => (
          <Text key={rotulo} fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
            {rotulo}
          </Text>
        ))}
      </Flex>
      {pico && pico.minutos > 0 ? (
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mt={2}>
          Pico às{' '}
          <Text as="span" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
            {pico.hora}h
          </Text>{' '}
          · {formatarMinutos(pico.minutos)}
        </Text>
      ) : null}
    </CartaoBlocoMusica>
  )
}

function RostosNovos({ artistas }: { artistas: ArtistaAnalise[] }) {
  const imagemDe = useImagensItensMusica(artistas)
  return (
    <CartaoBlocoMusica
      titulo="Artistas novos"
      descricao="Artistas que você ouviu pela primeira vez neste período."
      icone={<UserPlus size={14} />}
      cor="cirqueira.musica.verde"
      acao={<AtalhoAbaMusica aba="descobertas" rotulo="Descobertas" />}
    >
      {artistas.length === 0 ? (
        <VazioBlocoMusica texto="Nenhum artista novo neste período." />
      ) : (
        <SimpleGrid columns={4} gap={3}>
          {artistas.slice(0, 8).map((artista) => (
            <LinkMusica key={artista.nome} to={gerarRotaArtista(artista.nome, artista.artistaUuid)}>
              <VStack gap={1} title={artista.nome}>
                <CapaMusica
                  url={imagemDe(artista)}
                  alt={artista.nome}
                  tipo="artista"
                  boxSize="52px"
                />
                <Text
                  fontSize="2xs"
                  color="cirqueira.musica.textoSecundario"
                  lineClamp={1}
                  textAlign="center"
                  w="full"
                >
                  {artista.nome}
                </Text>
              </VStack>
            </LinkMusica>
          ))}
        </SimpleGrid>
      )}
    </CartaoBlocoMusica>
  )
}

function UltimasOuvidasMini({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useUltimasOuvidasMusica(habilitado, 6)
  const itens = data?.pages[0]?.itens ?? []
  const imagemDe = useImagensItensMusica(musicasValidas(itens.map((item) => item.musica)))

  return (
    <CartaoBlocoMusica
      titulo="Últimas ouvidas"
      descricao="As reproduções mais recentes, com horário e de qual serviço vieram."
      icone={<History size={14} />}
      cor="cirqueira.musica.azul"
      acao={<AtalhoAbaMusica aba="historico" rotulo="Histórico" />}
    >
      {isLoading ? (
        <Skeleton h="120px" borderRadius="8px" />
      ) : itens.length === 0 ? (
        <VazioBlocoMusica texto="Nenhuma reprodução ainda." />
      ) : (
        <SimpleGrid columns={{ base: 3, sm: 6, md: 3 }} gap={2}>
          {itens.map((item) => (
            <LinkMusica
              key={item.tocadaEmUtc + item.musicaUuid}
              to={gerarRotaMusica(
                item.musica?.nomeFaixa ?? '',
                item.musica?.artista ?? '',
                item.musicaUuid
              )}
            >
              <Box
                position="relative"
                title={`${item.musica?.nomeFaixa ?? ''} · ${item.musica?.artista ?? ''}`}
              >
                <CapaMusica
                  url={item.musica ? imagemDe(item.musica) : null}
                  alt={item.musica?.nomeFaixa ?? ''}
                  w="full"
                  aspectRatio={1}
                  borderRadius="6px"
                />
                <HStack
                  position="absolute"
                  bottom={1}
                  left={1}
                  gap={1}
                  px={1.5}
                  borderRadius="full"
                  bg="cirqueira.musica.fundo"
                >
                  <IconeFonteMusica fonte={item.fonte} tamanho={9} />
                  <Text fontSize="2xs" color="cirqueira.musica.textoPrincipal">
                    {horaDaReproducao(item.tocadaEm)}
                  </Text>
                </HStack>
              </Box>
            </LinkMusica>
          ))}
        </SimpleGrid>
      )}
    </CartaoBlocoMusica>
  )
}

function SaudadeMini({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useBlocoMusica<SaudadeMusica>('saudade', habilitado, { dias: 90 })
  const itens = (data?.itens ?? []).slice(0, 3)
  const imagemDe = useImagensItensMusica(musicasValidas(itens.map((item) => item.musica)))

  return (
    <CartaoBlocoMusica
      titulo="Saudade"
      descricao="Músicas que você ouvia bastante e não toca há mais de 90 dias."
      icone={<Wind size={14} />}
      cor="cirqueira.musica.azul"
      acao={<AtalhoAbaMusica aba="descobertas" />}
    >
      {isLoading ? (
        <Skeleton h="120px" borderRadius="8px" />
      ) : itens.length === 0 ? (
        <VazioBlocoMusica texto="Nada esquecido por aqui." />
      ) : (
        <VStack align="stretch" gap={2}>
          {itens.map((item) => (
            <LinkMusica
              key={item.musicaUuid}
              to={gerarRotaMusica(item.nome, item.artista, item.musicaUuid)}
            >
              <HStack gap={3}>
                <CapaMusica
                  url={item.musica ? imagemDe(item.musica) : null}
                  alt={item.nome}
                  boxSize="40px"
                />
                <VStack align="flex-start" gap={0} minW={0}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="cirqueira.musica.textoPrincipal"
                    lineClamp={1}
                  >
                    {item.nome}
                  </Text>
                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                    {formatarDiasSemOuvir(item.diasSemOuvir)}
                  </Text>
                </VStack>
              </HStack>
            </LinkMusica>
          ))}
        </VStack>
      )}
    </CartaoBlocoMusica>
  )
}

function NesteDiaMini({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useBlocoMusica<NesteDiaMusica>('neste-dia', habilitado)
  const anos = (data?.anos ?? []).filter((ano) => ano.ano < new Date().getFullYear())
  const imagemDe = useImagensItensMusica(anos.flatMap((ano) => ano.musicas))
  const destaque = anos[0]

  return (
    <CartaoBlocoMusica
      titulo="Neste dia"
      descricao="O que você ouviu nesta mesma data em anos anteriores."
      icone={<CalendarHeart size={14} />}
      cor="cirqueira.musica.verde"
      acao={<AtalhoAbaMusica aba="historico" />}
    >
      {isLoading ? (
        <Skeleton h="120px" borderRadius="8px" />
      ) : !destaque ? (
        <VazioBlocoMusica texto="Sem escuta nesta data em anos anteriores." />
      ) : (
        <HStack gap={3} align="center">
          <MosaicoCapasMusica musicas={destaque.musicas} imagemDe={imagemDe} tamanho="96px" />
          <VStack align="flex-start" gap={0} minW={0}>
            <Text
              fontSize="2xl"
              fontWeight="black"
              color="cirqueira.musica.textoPrincipal"
              lineHeight="1"
            >
              {destaque.ano}
            </Text>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              {formatarMinutos(destaque.minutos)}
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={2}>
              {destaque.musicas[0]?.nomeFaixa}
            </Text>
          </VStack>
        </HStack>
      )}
    </CartaoBlocoMusica>
  )
}
