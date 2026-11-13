import { CartaoTocandoAgora } from '@/features/spotify/components/CartaoTocandoAgora'
import { useStatusSpotify } from '@/features/spotify/hooks/useStatusSpotify'
import { UltimaDetectadaYoutubeMusic } from '@/features/youtube-music/components/UltimaDetectadaYoutubeMusic'
import { AppContainer } from '@/layouts'
import { useSEO } from '@/shared/hooks'
import { Container, Flex, HStack, Heading, Text, VStack } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BotaoGerenciarMusica,
  EsqueletoPaginaMusica,
  EstadoVazioMusica,
  RodapeMusica,
  SecaoCapsulaSonora,
  SecaoCuriosidades,
  SecaoDescobertas,
  SecaoEvolucaoMensal,
  SecaoHabitos,
  SecaoHojeSemana,
  SecaoLinhaDoTempo,
  SecaoRecordes,
  SecaoRetrospectiva,
  SeletorFonteMusica,
  TemaMusica,
} from './components'
import { useFonteMusica, useImagensMusica, useResumoMusica } from './hooks'
import {
  ROTA_GERENCIAR_MUSICA,
  deveMostrarEstadoVazioMusica,
  listarChavesImagensResumo,
  resumoTemDados,
} from './utils'

export function Musica() {
  useSEO({
    title: 'Música & Cápsula Sonora',
    description:
      'Acompanhe o que você ouve no Spotify e no YouTube Music, estatísticas diárias e sua Cápsula Sonora mensal.',
  })

  const navigate = useNavigate()
  const { fonte } = useFonteMusica()

  const { data: status, isLoading: carregandoStatus } = useStatusSpotify()
  const conectada = Boolean(status?.conectada && status.status === 'conectada')

  const { data: resumo, isLoading: carregandoResumo } = useResumoMusica()

  const chavesFaltantesResumo = useMemo(() => listarChavesImagensResumo(resumo), [resumo])
  const { data: mapaImagensResumo } = useImagensMusica(chavesFaltantesResumo)

  const temDados = resumoTemDados(resumo)
  const habilitado = conectada || temDados
  const mostrarEstadoVazio =
    !carregandoResumo && deveMostrarEstadoVazioMusica(conectada, temDados, fonte)

  return (
    <TemaMusica>
      <AppContainer>
        <Container maxW="6xl" py={{ base: 4, md: 8 }} px={{ base: 3, md: 6 }}>
          <VStack gap={{ base: 6, md: 10 }} align="stretch" w="full">
            <Flex
              justify="space-between"
              align={{ base: 'start', md: 'center' }}
              direction={{ base: 'column', md: 'row' }}
              gap={3}
            >
              <VStack align="start" gap={0}>
                <Heading
                  as="h1"
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="black"
                  color="cirqueira.musica.textoPrincipal"
                >
                  Música
                </Heading>
                <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                  Spotify e YouTube Music no mesmo lugar.
                </Text>
              </VStack>
              <HStack gap={3} wrap="wrap">
                <SeletorFonteMusica />
                <BotaoGerenciarMusica />
              </HStack>
            </Flex>

            {carregandoStatus ? (
              <EsqueletoPaginaMusica />
            ) : mostrarEstadoVazio ? (
              <EstadoVazioMusica
                conectada={conectada}
                fonte={fonte}
                onAbrirModalImportacao={() => navigate(ROTA_GERENCIAR_MUSICA)}
                onConectarYoutubeMusic={() => navigate(ROTA_GERENCIAR_MUSICA)}
              />
            ) : (
              <>
                {fonte !== 'youtube_music' && <CartaoTocandoAgora conectada={conectada} />}
                {fonte !== 'spotify' && <UltimaDetectadaYoutubeMusic />}

                <SecaoHojeSemana
                  resumo={resumo}
                  mapaImagens={mapaImagensResumo}
                  carregando={carregandoResumo}
                />

                <SecaoRecordes habilitado={habilitado} />

                <SecaoEvolucaoMensal habilitado={habilitado} />

                <SecaoHabitos habilitado={habilitado} />

                <SecaoDescobertas habilitado={habilitado} />

                <SecaoCuriosidades curiosidades={resumo?.curiosidades} />

                <SecaoCapsulaSonora conectada={habilitado} />

                <SecaoLinhaDoTempo habilitado={habilitado} />

                <SecaoRetrospectiva habilitado={habilitado} />
              </>
            )}

            <RodapeMusica />
          </VStack>
        </Container>
      </AppContainer>
    </TemaMusica>
  )
}

export const Component = Musica

export default Musica
