import { AppContainer } from '@/layouts'
import { useSEO } from '@/shared/hooks'
import { Box, Container, HStack, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import {
  CalendarClock,
  CalendarPlus,
  CalendarRange,
  Disc3,
  Headphones,
  ListMusic,
  Repeat,
  SkipForward,
} from 'lucide-react'
import { Link as LinkRouter, useSearchParams } from 'react-router-dom'
import {
  CapaSpotify,
  CarregandoDetalheSpotify,
  CartaoMetricaSpotify,
  HeroDetalheSpotify,
  MinutosSpotify,
  NaoEncontradoDetalheSpotify,
  PainelEvolucaoDetalhe,
  TemaSpotify,
} from './components'
import { useDetalheArtistaSpotify, useImagensItensSpotify, useRelogioSpotify } from './hooks'
import type { DetalheArtista } from './types'
import {
  extrairMensagemErroApi,
  formatarDataExtensa,
  formatarNumeroPtBr,
  formatarPercentualSimples,
  formatarTempoRelativo,
  gerarRotaMusica,
} from './utils'

export function DetalheArtistaSpotify() {
  const [parametros] = useSearchParams()
  const nome = parametros.get('nome') ?? ''
  const { data, isLoading, error } = useDetalheArtistaSpotify(nome)

  useSEO({
    title: nome ? `${nome} · Spotify` : 'Artista · Spotify',
    description: 'Seu histórico com este artista.',
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
                'Não encontramos esse artista no seu histórico.'
              )}
            />
          ) : (
            <ConteudoArtista dados={data} />
          )}
        </Container>
      </AppContainer>
    </TemaSpotify>
  )
}

function ConteudoArtista({ dados }: { dados: DetalheArtista }) {
  const agora = useRelogioSpotify()
  const imagemDe = useImagensItensSpotify([dados.artista, ...dados.topMusicas, ...dados.topAlbuns])
  const { comportamento } = dados

  return (
    <VStack align="stretch" gap={{ base: 5, md: 7 }}>
      <HeroDetalheSpotify
        tipo="artista"
        rotulo="Artista"
        titulo={dados.artista.nome}
        subtitulo={
          <>
            {formatarNumeroPtBr(dados.artista.streams)} streams ·{' '}
            <MinutosSpotify minutos={dados.artista.minutos} /> ·{' '}
            {formatarPercentualSimples(dados.percentualDoTempoTotal)} de todo o seu tempo no Spotify
          </>
        }
        imagemUrl={imagemDe(dados.artista)}
        urlSpotify={dados.artista.urlSpotify}
        posicaoGeral={dados.posicaoGeral}
      />

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={{ base: 2, md: 3 }}>
        <CartaoMetricaSpotify
          icone={Repeat}
          rotulo="Streams"
          valor={formatarNumeroPtBr(dados.artista.streams)}
          detalhe={`${formatarNumeroPtBr(dados.reproducoes)} reproduções contando as curtas`}
        />
        <CartaoMetricaSpotify
          icone={Headphones}
          cor="cirqueira.spotify.azul"
          rotulo="Tempo ouvido"
          valor={<MinutosSpotify minutos={dados.artista.minutos} />}
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
          icone={ListMusic}
          cor="cirqueira.spotify.azul"
          rotulo="Músicas diferentes"
          valor={formatarNumeroPtBr(dados.faixasDistintas)}
          detalhe={`Em ${formatarNumeroPtBr(dados.albunsDistintos)} álbuns`}
        />
        <CartaoMetricaSpotify
          icone={CalendarRange}
          cor="cirqueira.spotify.amarelo"
          rotulo="Repetição recorde"
          valor={dados.maiorRepeticaoDiaria ? `${dados.maiorRepeticaoDiaria.vezes}x num dia` : '—'}
          detalhe={
            dados.maiorRepeticaoDiaria
              ? `${dados.maiorRepeticaoDiaria.musica.nomeFaixa} · ${formatarDataExtensa(dados.maiorRepeticaoDiaria.data)}`
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
          icone={Disc3}
          cor="cirqueira.spotify.azul"
          rotulo="Álbum favorito"
          valor={dados.topAlbuns[0]?.album ?? '—'}
          detalhe={dados.topAlbuns[0] ? `${dados.topAlbuns[0].streams} streams` : undefined}
        />
      </SimpleGrid>

      <PainelEvolucaoDetalhe
        evolucao={dados.evolucao}
        mesesNoTopo={dados.mesesNoTopo}
        descricaoTopo="de artistas do mês"
      />

      <SimpleGrid columns={{ base: 1, lg: 5 }} gap={4}>
        <VStack
          gridColumn={{ lg: 'span 3' }}
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
            Músicas que você mais ouviu
          </Text>
          {dados.topMusicas.map((musica, indice) => {
            const maximo = dados.topMusicas[0]?.streams ?? 1
            return (
              <Link
                key={musica.nomeFaixa}
                asChild
                _hover={{ textDecoration: 'none' }}
                display="block"
              >
                <LinkRouter to={gerarRotaMusica(musica.nomeFaixa, musica.artista)}>
                  <HStack
                    gap={3}
                    p={1.5}
                    borderRadius="6px"
                    _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
                  >
                    <Text
                      w="20px"
                      fontSize="xs"
                      fontWeight="bold"
                      color="cirqueira.spotify.textoDesabilitado"
                      textAlign="right"
                    >
                      {indice + 1}
                    </Text>
                    <CapaSpotify url={imagemDe(musica)} alt={musica.album} boxSize="40px" />
                    <VStack align="stretch" gap={1} flex={1} minW={0}>
                      <HStack justify="space-between" gap={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="cirqueira.spotify.textoPrincipal"
                          truncate
                        >
                          {musica.nomeFaixa}
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          color="cirqueira.spotify.verde"
                          flexShrink={0}
                        >
                          {musica.streams}x
                        </Text>
                      </HStack>
                      <Box h="3px" borderRadius="full" bg="cirqueira.spotify.cartaoElevado">
                        <Box
                          h="full"
                          w={`${(musica.streams / maximo) * 100}%`}
                          borderRadius="full"
                          bg="cirqueira.spotify.verde"
                          opacity={0.7}
                        />
                      </Box>
                    </VStack>
                  </HStack>
                </LinkRouter>
              </Link>
            )
          })}
        </VStack>

        <VStack
          gridColumn={{ lg: 'span 2' }}
          align="stretch"
          gap={3}
          p={{ base: 3, sm: 5 }}
          borderRadius="8px"
          bg="cirqueira.spotify.cartao"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
          alignSelf="start"
        >
          <Text
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wide"
            color="cirqueira.spotify.amarelo"
          >
            Álbuns mais ouvidos
          </Text>
          <SimpleGrid columns={2} gap={3}>
            {dados.topAlbuns.map((album) => (
              <VStack key={album.album} align="stretch" gap={1.5}>
                <CapaSpotify
                  url={imagemDe(album)}
                  alt={album.album}
                  tipo="album"
                  w="full"
                  aspectRatio="1"
                  tamanhoIcone={28}
                />
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="cirqueira.spotify.textoPrincipal"
                  lineClamp={1}
                >
                  {album.album}
                </Text>
                <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
                  {album.streams} streams · {album.faixasDistintas}{' '}
                  {album.faixasDistintas === 1 ? 'faixa' : 'faixas'}
                </Text>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>
      </SimpleGrid>
    </VStack>
  )
}

export const Component = DetalheArtistaSpotify

export default DetalheArtistaSpotify
