import { useRelogioSpotify } from '@/features/spotify/hooks/useTocandoAgoraSpotify'
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
import { useSearchParams } from 'react-router-dom'
import {
  CapaMusica,
  CarregandoDetalheMusica,
  CartaoMetricaMusica,
  HeroDetalheMusica,
  MinutosMusica,
  NaoEncontradoDetalheMusica,
  PainelEvolucaoDetalhe,
  TemaMusica,
} from './components'
import { LinkMusica } from './components/LinkMusica'
import { useDetalheArtistaMusica, useImagensItensMusica } from './hooks'
import type { DetalheArtista } from './types'
import {
  extrairMensagemErroApi,
  formatarDataExtensa,
  formatarNumeroPtBr,
  formatarPercentualSimples,
  formatarTempoRelativo,
  gerarRotaMusica,
} from './utils'

export function DetalheArtistaMusica() {
  const [parametros] = useSearchParams()
  const nome = parametros.get('nome') ?? ''
  const { data, isLoading, error } = useDetalheArtistaMusica(nome)

  useSEO({
    title: nome ? `${nome} · Música` : 'Artista · Música',
    description: 'Seu histórico com este artista.',
  })

  return (
    <TemaMusica>
      <AppContainer>
        <Container maxW="6xl" py={{ base: 4, md: 8 }} px={{ base: 3, md: 6 }}>
          {isLoading ? (
            <CarregandoDetalheMusica />
          ) : !data ? (
            <NaoEncontradoDetalheMusica
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
    </TemaMusica>
  )
}

function ConteudoArtista({ dados }: { dados: DetalheArtista }) {
  const agora = useRelogioSpotify()
  const imagemDe = useImagensItensMusica([dados.artista, ...dados.topMusicas, ...dados.topAlbuns])
  const { comportamento } = dados

  return (
    <VStack align="stretch" gap={{ base: 5, md: 7 }}>
      <HeroDetalheMusica
        tipo="artista"
        rotulo="Artista"
        titulo={dados.artista.nome}
        subtitulo={
          <>
            {formatarNumeroPtBr(dados.artista.streams)} streams ·{' '}
            <MinutosMusica minutos={dados.artista.minutos} /> ·{' '}
            {formatarPercentualSimples(dados.percentualDoTempoTotal)} de todo o seu tempo ouvindo
            música
          </>
        }
        imagemUrl={imagemDe(dados.artista)}
        urlSpotify={dados.artista.urlSpotify}
        posicaoGeral={dados.posicaoGeral}
      />

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={{ base: 2, md: 3 }}>
        <CartaoMetricaMusica
          icone={Repeat}
          rotulo="Streams"
          valor={formatarNumeroPtBr(dados.artista.streams)}
          detalhe={`${formatarNumeroPtBr(dados.reproducoes)} reproduções contando as curtas`}
        />
        <CartaoMetricaMusica
          icone={Headphones}
          cor="cirqueira.musica.azul"
          rotulo="Tempo ouvido"
          valor={<MinutosMusica minutos={dados.artista.minutos} />}
          detalhe={`Em ${formatarNumeroPtBr(dados.diasOuvidos)} dias diferentes`}
        />
        <CartaoMetricaMusica
          icone={CalendarPlus}
          cor="cirqueira.musica.amarelo"
          rotulo="Primeira vez"
          valor={formatarDataExtensa(dados.primeiraVezEm)}
          detalhe={formatarTempoRelativo(dados.primeiraVezEm, agora)}
        />
        <CartaoMetricaMusica
          icone={CalendarClock}
          rotulo="Última vez"
          valor={formatarDataExtensa(dados.ultimaVezEm)}
          detalhe={formatarTempoRelativo(dados.ultimaVezEm, agora)}
        />
        <CartaoMetricaMusica
          icone={ListMusic}
          cor="cirqueira.musica.azul"
          rotulo="Músicas diferentes"
          valor={formatarNumeroPtBr(dados.faixasDistintas)}
          detalhe={`Em ${formatarNumeroPtBr(dados.albunsDistintos)} álbuns`}
        />
        <CartaoMetricaMusica
          icone={CalendarRange}
          cor="cirqueira.musica.amarelo"
          rotulo="Repetição recorde"
          valor={dados.maiorRepeticaoDiaria ? `${dados.maiorRepeticaoDiaria.vezes}x num dia` : '—'}
          detalhe={
            dados.maiorRepeticaoDiaria
              ? `${dados.maiorRepeticaoDiaria.musica.nomeFaixa} · ${formatarDataExtensa(dados.maiorRepeticaoDiaria.data)}`
              : undefined
          }
        />
        <CartaoMetricaMusica
          icone={SkipForward}
          rotulo="Taxa de pulos"
          valor={formatarPercentualSimples(comportamento.taxaPulos)}
          detalhe={
            comportamento.comDadoPulo > 0
              ? `${comportamento.puladas} de ${comportamento.comDadoPulo} puladas`
              : 'Disponível com o histórico estendido'
          }
        />
        <CartaoMetricaMusica
          icone={Disc3}
          cor="cirqueira.musica.azul"
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
          bg="cirqueira.musica.cartao"
          border="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
        >
          <Text
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wide"
            color="cirqueira.musica.verde"
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
                <LinkMusica to={gerarRotaMusica(musica.nomeFaixa, musica.artista)}>
                  <HStack
                    gap={3}
                    p={1.5}
                    borderRadius="6px"
                    _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
                  >
                    <Text
                      w="20px"
                      fontSize="xs"
                      fontWeight="bold"
                      color="cirqueira.musica.textoDesabilitado"
                      textAlign="right"
                    >
                      {indice + 1}
                    </Text>
                    <CapaMusica url={imagemDe(musica)} alt={musica.album} boxSize="40px" />
                    <VStack align="stretch" gap={1} flex={1} minW={0}>
                      <HStack justify="space-between" gap={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="cirqueira.musica.textoPrincipal"
                          truncate
                        >
                          {musica.nomeFaixa}
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          color="cirqueira.musica.verde"
                          flexShrink={0}
                        >
                          {musica.streams}x
                        </Text>
                      </HStack>
                      <Box h="3px" borderRadius="full" bg="cirqueira.musica.cartaoElevado">
                        <Box
                          h="full"
                          w={`${(musica.streams / maximo) * 100}%`}
                          borderRadius="full"
                          bg="cirqueira.musica.verde"
                          opacity={0.7}
                        />
                      </Box>
                    </VStack>
                  </HStack>
                </LinkMusica>
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
          bg="cirqueira.musica.cartao"
          border="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          alignSelf="start"
        >
          <Text
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wide"
            color="cirqueira.musica.amarelo"
          >
            Álbuns mais ouvidos
          </Text>
          <SimpleGrid columns={2} gap={3}>
            {dados.topAlbuns.map((album) => (
              <VStack key={album.album} align="stretch" gap={1.5}>
                <CapaMusica
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
                  color="cirqueira.musica.textoPrincipal"
                  lineClamp={1}
                >
                  {album.album}
                </Text>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
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

export const Component = DetalheArtistaMusica

export default DetalheArtistaMusica
