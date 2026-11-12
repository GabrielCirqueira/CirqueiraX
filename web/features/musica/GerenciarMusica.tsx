import { ModalUploadHistoricoSpotify } from '@/features/spotify/components/ModalUploadHistoricoSpotify'
import { PainelConexaoSpotify } from '@/features/spotify/components/PainelConexaoSpotify'
import { ListaImportacoesYoutube } from '@/features/youtube-music/components/ListaImportacoesYoutube'
import { ModalImportarTakeoutYoutube } from '@/features/youtube-music/components/ModalImportarTakeoutYoutube'
import { PainelConexaoYoutubeMusic } from '@/features/youtube-music/components/PainelConexaoYoutubeMusic'
import { AppContainer } from '@/layouts'
import { useSEO } from '@/shared/hooks'
import { Container, Heading, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { CabecalhoSecaoMusica, CartaoRevisaoGerenciar, LinkMusica, TemaMusica } from './components'
import { ROTA_MUSICA } from './utils'

export function GerenciarMusica() {
  useSEO({
    title: 'Gerenciar · Música',
    description: 'Contas, extensão, importações e correções da página Música.',
  })

  const [modalSpotifyAberto, setModalSpotifyAberto] = useState(false)
  const [modalTakeoutAberto, setModalTakeoutAberto] = useState(false)

  return (
    <TemaMusica>
      <AppContainer>
        <Container maxW="6xl" py={{ base: 4, md: 8 }} px={{ base: 3, md: 6 }}>
          <VStack align="stretch" gap={{ base: 6, md: 8 }}>
            <VStack align="start" gap={2}>
              <Link
                asChild
                fontSize="xs"
                color="cirqueira.musica.textoSecundario"
                _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
              >
                <LinkMusica to={ROTA_MUSICA}>
                  <ArrowLeft size={12} /> Voltar para Música
                </LinkMusica>
              </Link>
              <Heading
                as="h1"
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="black"
                color="cirqueira.musica.textoPrincipal"
              >
                Gerenciar
              </Heading>
              <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                Contas, extensão do navegador, importação do histórico e correções.
              </Text>
            </VStack>

            <VStack align="stretch" gap={4}>
              <CabecalhoSecaoMusica
                titulo="Contas e importações"
                descricao="Vincule o Spotify e o YouTube Music e traga o histórico antigo de cada um."
              />
              <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} alignItems="stretch">
                <PainelConexaoSpotify
                  compacto
                  onAbrirModalImportacao={() => setModalSpotifyAberto(true)}
                />
                <PainelConexaoYoutubeMusic
                  onAbrirModalImportacao={() => setModalTakeoutAberto(true)}
                />
              </SimpleGrid>
              <ListaImportacoesYoutube />
            </VStack>

            <VStack align="stretch" gap={4}>
              <CabecalhoSecaoMusica
                titulo="Revisão e correções"
                descricao="O que veio do YouTube Music e precisa de confirmação."
              />
              <CartaoRevisaoGerenciar />
            </VStack>
          </VStack>
        </Container>
      </AppContainer>

      <ModalUploadHistoricoSpotify
        aberto={modalSpotifyAberto}
        onFechar={() => setModalSpotifyAberto(false)}
      />

      <ModalImportarTakeoutYoutube
        aberto={modalTakeoutAberto}
        onFechar={() => setModalTakeoutAberto(false)}
      />
    </TemaMusica>
  )
}

export const Component = GerenciarMusica

export default GerenciarMusica
