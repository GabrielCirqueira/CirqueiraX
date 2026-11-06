import { AppContainer } from '@/layouts'
import { useSEO } from '@/shared/hooks'
import { Container, HStack, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import {
  CalendarClock,
  CalendarPlus,
  CalendarRange,
  Clock3,
  Headphones,
  Repeat,
  Shuffle,
  SkipForward,
} from 'lucide-react'
import { Link as LinkRouter, useSearchParams } from 'react-router-dom'
import {
  CapaSpotify,
  CarregandoDetalheSpotify,
  CartaoMetricaSpotify,
  HeroDetalheSpotify,
  NaoEncontradoDetalheSpotify,
  PainelEvolucaoDetalhe,
  TemaSpotify,
} from './components'
import { useDetalheMusicaSpotify, useImagensItensSpotify, useRelogioSpotify } from './hooks'
import type { DetalheMusica } from './types'
import {
  extrairMensagemErroApi,
  formatarDataExtensa,
  formatarDuracaoMs,
  formatarMinutosParaHorasEMinutos,
  formatarNumeroPtBr,
  formatarPercentualSimples,
  formatarTempoRelativo,
  gerarRotaArtista,
  gerarRotaMusica,
} from './utils'

export function DetalheMusicaSpotify() {
  const [parametros] = useSearchParams()
  const nome = parametros.get('nome') ?? ''
  const artista = parametros.get('artista') ?? ''
  const { data, isLoading, error } = useDetalheMusicaSpotify(nome, artista)

  useSEO({
    title: nome ? `${nome} · Spotify` : 'Música · Spotify',
    description: 'Seu histórico com esta música.',
  })

  return (
    <TemaSpotify>
      <AppContainer>
        <Container maxW="6xl" py={{ base: 4, md: 8 }} px={{ base: 3, md: 6 }}>
          {isLoading ? (
            <CarregandoDetalheSpotify />
          ) : !data ? (
            <NaoEncontradoDetalheSpotify
              mensagem={extrairMensagemErroApi(
                error,
                'Não encontramos essa música no seu histórico.'
              )}
            />
          ) : (
            <ConteudoMusica dados={data} />
          )}
        </Container>
      </AppContainer>
    </TemaSpotify>
  )
}

function ConteudoMusica({ dados }: { dados: DetalheMusica }) {
  const agora = useRelogioSpotify()
  const imagemDe = useImagensItensSpotify([dados.musica, dados.artista, ...dados.outrasDoArtista])
  const { comportamento, musica } = dados
  const mediaPorStream =
    musica.streams > 0 && dados.duracaoMs
      ? (musica.minutos * 60_000) / musica.streams / dados.duracaoMs
      : null

  return (
    <VStack align="stretch" gap={{ base: 5, md: 7 }}>
      <HeroDetalheSpotify
        tipo="faixa"
        rotulo="Música"
        titulo={musica.nomeFaixa}
        subtitulo={
          <>
            <Link asChild color="cirqueira.spotify.textoPrincipal" fontWeight="bold">
              <LinkRouter to={gerarRotaArtista(musica.artista)}>{musica.artista}</LinkRouter>
            </Link>
            {` · ${musica.album}`}
          </>
        }
        imagemUrl={imagemDe(musica)}
        urlSpotify={musica.urlSpotify}
        posicaoGeral={dados.posicaoGeral}
      />

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={{ base: 2, md: 3 }}>
        <CartaoMetricaSpotify
          icone={Repeat}
          rotulo="Streams"
          valor={formatarNumeroPtBr(musica.streams)}
          detalhe={`${formatarNumeroPtBr(dados.reproducoes)} reproduções contando as curtas`}
        />
        <CartaoMetricaSpotify
          icone={Headphones}
          cor="cirqueira.spotify.azul"
          rotulo="Tempo ouvido"
          valor={formatarMinutosParaHorasEMinutos(musica.minutos)}
          detalhe={`Em ${formatarNumeroPtBr(dados.diasOuvidos)} dias diferentes`}
        />
        <CartaoMetricaSpotify
          icone={CalendarPlus}
          cor="cirqueira.spotify.amarelo"
          rotulo="Primeira vez"
          valor={formatarDataExtensa(dados.primeiraVezEm)}
          detalhe={formatarTempoRelativo(dados.primeiraVezEm, agora)}
        />
        <CartaoMetricaSpotify
          icone={CalendarClock}
          rotulo="Última vez"
          valor={formatarDataExtensa(dados.ultimaVezEm)}
          detalhe={formatarTempoRelativo(dados.ultimaVezEm, agora)}
        />
        <CartaoMetricaSpotify
          icone={CalendarRange}
          cor="cirqueira.spotify.amarelo"
          rotulo="Recorde em um dia"
          valor={dados.recordeDiario ? `${dados.recordeDiario.vezes}x` : '—'}
          detalhe={dados.recordeDiario ? formatarDataExtensa(dados.recordeDiario.data) : undefined}
        />
        <CartaoMetricaSpotify
          icone={Clock3}
          cor="cirqueira.spotify.azul"
          rotulo="Duração"
          valor={dados.duracaoMs ? formatarDuracaoMs(dados.duracaoMs) : '—'}
          detalhe={
            mediaPorStream
              ? `Você ouve em média ${Math.min(100, Math.round(mediaPorStream * 100))}% dela`
              : undefined
          }
        />
        <CartaoMetricaSpotify
          icone={SkipForward}
          rotulo="Taxa de pulos"
          valor={formatarPercentualSimples(comportamento.taxaPulos)}
          detalhe={
            comportamento.comDadoPulo > 0
              ? `${comportamento.puladas} de ${comportamento.comDadoPulo} puladas`
              : 'Disponível com o histórico estendido'
          }
        />
        <CartaoMetricaSpotify
          icone={Shuffle}
          cor="cirqueira.spotify.azul"
          rotulo="No aleatório"
          valor={formatarPercentualSimples(comportamento.taxaAleatorio)}
          detalhe={
            comportamento.comDadoAleatorio > 0
              ? `${comportamento.aleatorias} vezes com aleatório ligado`
              : 'Disponível com o histórico estendido'
          }
        />
      </SimpleGrid>

      <PainelEvolucaoDetalhe
        evolucao={dados.evolucao}
        mesesNoTopo={dados.mesesNoTopo}
        descricaoTopo="de músicas do mês"
      />

      {dados.outrasDoArtista.length > 0 && (
        <VStack
          align="stretch"
          gap={2}
          p={{ base: 3, sm: 5 }}
          borderRadius="8px"
          bg="cirqueira.spotify.cartao"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
        >
          <Text
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wide"
            color="cirqueira.spotify.verde"
            mb={1}
          >
            Outras de {musica.artista} que você ouve
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
            {dados.outrasDoArtista.map((outra) => (
              <Link
                key={outra.nomeFaixa}
                asChild
                _hover={{ textDecoration: 'none' }}
                display="block"
              >
                <LinkRouter to={gerarRotaMusica(outra.nomeFaixa, outra.artista)}>
                  <HStack
                    gap={3}
                    p={2}
                    borderRadius="6px"
                    bg="cirqueira.spotify.cartaoElevado"
                    _hover={{ bg: 'cirqueira.spotify.fundo' }}
                  >
                    <CapaSpotify url={imagemDe(outra)} alt={outra.album} boxSize="40px" />
                    <VStack align="flex-start" gap={0} flex={1} minW={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="cirqueira.spotify.textoPrincipal"
                        truncate
                        maxW="full"
                      >
                        {outra.nomeFaixa}
                      </Text>
                      <Text
                        fontSize="2xs"
                        color="cirqueira.spotify.textoSecundario"
                        truncate
                        maxW="full"
                      >
                        {outra.album}
                      </Text>
                    </VStack>
                    <Text fontSize="xs" fontWeight="bold" color="cirqueira.spotify.verde">
                      {outra.streams}x
                    </Text>
                  </HStack>
                </LinkRouter>
              </Link>
            ))}
          </SimpleGrid>
        </VStack>
      )}
    </VStack>
  )
}

export const Component = DetalheMusicaSpotify

export default DetalheMusicaSpotify
