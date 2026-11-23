import { useStatusSpotify } from '@/features/spotify/hooks/useStatusSpotify'
import { AppContainer } from '@/layouts'
import { useSEO } from '@/shared/hooks'
import { Container, Flex, HStack, Heading, Text, VStack } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AbasConteudoMusica,
  AbasMusica,
  BotaoGerenciarMusica,
  EsqueletoPaginaMusica,
  EstadoVazioMusica,
  PainelTocandoAgoraMusica,
  RodapeMusica,
  SeletorFonteMusica,
  TemaMusica,
} from './components'
import { useAbaMusica, useFonteMusica, useImagensMusica, useResumoMusica } from './hooks'
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
  const { aba } = useAbaMusica()

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
        <Container maxW="6xl" py={{ base: 4, md: 8 }} px={{ base: 3, md: 6 }} overflowX="clip">
          <VStack gap={{ base: 5, md: 8 }} align="stretch" w="full">
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
                <AbasMusica />

                <PainelTocandoAgoraMusica conectada={conectada} fonte={fonte} />

                <AbasConteudoMusica
                  aba={aba}
                  habilitado={habilitado}
                  resumo={resumo}
                  mapaImagensResumo={mapaImagensResumo}
                  carregandoResumo={carregandoResumo}
                />
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
