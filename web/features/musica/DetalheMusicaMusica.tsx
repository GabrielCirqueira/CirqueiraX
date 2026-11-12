import {
  BotaoSepararVersao,
  BotaoUnirMusica,
} from '@/features/revisao-musica/components/AcoesCatalogo'
import { useRelogioSpotify } from '@/features/spotify/hooks/useTocandoAgoraSpotify'
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
import { BlocoDetalhe } from './components/BlocoDetalhe'
import { LinkMusica } from './components/LinkMusica'
import { ListaComponentesMashup, ListaVersoesMusica } from './components/ListaVersoesMusica'
import { ResumoPorFonteDetalhe } from './components/ResumoPorFonteDetalhe'
import { useDetalheMusica, useFonteMusica, useImagensItensMusica } from './hooks'
import type { DetalheMusica } from './types'
import {
  TEXTO_INDISPONIVEL_YOUTUBE,
  extrairMensagemErroApi,
  formatarDataExtensa,
  formatarDuracaoMs,
  formatarNumeroPtBr,
  formatarPercentualSimples,
  formatarTempoRelativo,
  gerarRotaArtista,
  gerarRotaMusica,
  isPuloIndisponivel,
  lerAlvoDetalhe,
} from './utils'

export function DetalheMusicaMusica() {
  const [parametros] = useSearchParams()
  const alvo = lerAlvoDetalhe(parametros)
  const { data, isLoading, error } = useDetalheMusica(alvo)
  const titulo = data?.musica.nomeFaixa ?? alvo.nome

  useSEO({
    title: titulo ? `${titulo} · Música` : 'Música',
    description: 'Seu histórico com esta música.',
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
                'Não encontramos essa música no seu histórico.'
              )}
            />
          ) : (
            <ConteudoMusica dados={data} />
          )}
        </Container>
      </AppContainer>
    </TemaMusica>
  )
}

function ConteudoMusica({ dados }: { dados: DetalheMusica }) {
  const agora = useRelogioSpotify()
  const imagemDe = useImagensItensMusica([dados.musica, dados.artista, ...dados.outrasDoArtista])
  const { comportamento, musica } = dados
  const { fonte } = useFonteMusica()
  const soYoutube = fonte === 'youtube_music'
  const mediaPorStream =
    musica.streams > 0 && dados.duracaoMs
      ? (musica.minutos * 60_000) / musica.streams / dados.duracaoMs
      : null

  return (
    <VStack align="stretch" gap={{ base: 5, md: 7 }}>
      <HeroDetalheMusica
        tipo="faixa"
        rotulo="Música"
        titulo={musica.nomeFaixa}
        subtitulo={
          <>
            <Link asChild color="cirqueira.musica.textoPrincipal" fontWeight="bold">
              <LinkMusica to={gerarRotaArtista(musica.artista, dados.artista.artistaUuid)}>
                {musica.artista}
              </LinkMusica>
            </Link>
            {` · ${musica.album}`}
          </>
        }
        imagemUrl={imagemDe(musica)}
        urlSpotify={musica.urlSpotify}
        urlYoutubeMusic={musica.urlYoutubeMusic}
        posicaoGeral={dados.posicaoGeral}
      />

      {musica.musicaUuid && (
        <HStack gap={2} wrap="wrap">
          <BotaoUnirMusica musicaUuid={musica.musicaUuid} titulo={musica.nomeFaixa} />
        </HStack>
      )}

      <ResumoPorFonteDetalhe porFonte={dados.porFonte} />

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={{ base: 2, md: 3 }}>
        <CartaoMetricaMusica
          icone={Repeat}
          rotulo="Streams"
          valor={formatarNumeroPtBr(musica.streams)}
          detalhe={`${formatarNumeroPtBr(dados.reproducoes)} reproduções contando as curtas`}
        />
        <CartaoMetricaMusica
          icone={Headphones}
          cor="cirqueira.musica.azul"
          rotulo="Tempo ouvido"
          valor={
            <MinutosMusica
              minutos={musica.minutos}
              porFonte={musica.porFonte}
              estimado={musica.estimado}
            />
          }
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
          icone={CalendarRange}
          cor="cirqueira.musica.amarelo"
          rotulo="Recorde em um dia"
          valor={dados.recordeDiario ? `${dados.recordeDiario.vezes}x` : '—'}
          detalhe={dados.recordeDiario ? formatarDataExtensa(dados.recordeDiario.data) : undefined}
        />
        <CartaoMetricaMusica
          icone={Clock3}
          cor="cirqueira.musica.azul"
          rotulo="Duração"
          valor={dados.duracaoMs ? formatarDuracaoMs(dados.duracaoMs) : '—'}
          detalhe={
            mediaPorStream
              ? `Você ouve em média ${Math.min(100, Math.round(mediaPorStream * 100))}% dela`
              : undefined
          }
        />
        <CartaoMetricaMusica
          icone={SkipForward}
          rotulo="Taxa de pulos"
          valor={
            isPuloIndisponivel(soYoutube, comportamento.comDadoPulo)
              ? '—'
              : formatarPercentualSimples(comportamento.taxaPulos)
          }
          detalhe={
            isPuloIndisponivel(soYoutube, comportamento.comDadoPulo)
              ? TEXTO_INDISPONIVEL_YOUTUBE
              : comportamento.comDadoPulo > 0
                ? `${comportamento.puladas} de ${comportamento.comDadoPulo} puladas`
                : 'Disponível com o histórico estendido'
          }
        />
        <CartaoMetricaMusica
          icone={Shuffle}
          cor="cirqueira.musica.azul"
          rotulo="No aleatório"
          valor={soYoutube ? '—' : formatarPercentualSimples(comportamento.taxaAleatorio)}
          detalhe={
            soYoutube
              ? TEXTO_INDISPONIVEL_YOUTUBE
              : comportamento.comDadoAleatorio > 0
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

      {dados.componentes.length > 0 && (
        <BlocoDetalhe titulo="Contém">
          <ListaComponentesMashup
            componentes={dados.componentes}
            artistas={musica.artistas ?? []}
          />
        </BlocoDetalhe>
      )}

      <BlocoDetalhe titulo="Versões que você ouviu">
        <ListaVersoesMusica
          variantes={dados.variantes}
          acaoVariante={(variante) =>
            variante.videoUuid && dados.variantes.length > 1 ? (
              <BotaoSepararVersao videoUuid={variante.videoUuid} />
            ) : null
          }
        />
      </BlocoDetalhe>

      {dados.outrasDoArtista.length > 0 && (
        <VStack
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
                <LinkMusica to={gerarRotaMusica(outra.nomeFaixa, outra.artista, outra.musicaUuid)}>
                  <HStack
                    gap={3}
                    p={2}
                    borderRadius="6px"
                    bg="cirqueira.musica.cartaoElevado"
                    _hover={{ bg: 'cirqueira.musica.fundo' }}
                  >
                    <CapaMusica url={imagemDe(outra)} alt={outra.album} boxSize="40px" />
                    <VStack align="flex-start" gap={0} flex={1} minW={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="cirqueira.musica.textoPrincipal"
                        truncate
                        maxW="full"
                      >
                        {outra.nomeFaixa}
                      </Text>
                      <Text
                        fontSize="2xs"
                        color="cirqueira.musica.textoSecundario"
                        truncate
                        maxW="full"
                      >
                        {outra.album}
                      </Text>
                    </VStack>
                    <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.verde">
                      {outra.streams}x
                    </Text>
                  </HStack>
                </LinkMusica>
              </Link>
            ))}
          </SimpleGrid>
        </VStack>
      )}
    </VStack>
  )
}

export const Component = DetalheMusicaMusica

export default DetalheMusicaMusica
