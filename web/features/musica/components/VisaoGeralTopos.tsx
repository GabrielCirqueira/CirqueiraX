import { Box, Flex, Grid, HStack, Text, VStack } from '@chakra-ui/react'
import { Crown, Disc3, Mic2, Music2 } from 'lucide-react'
import { memo } from 'react'
import { useImagensItensMusica } from '../hooks'
import type { AlbumAnalise, ArtistaAnalise, MusicaAnalise } from '../types'
import type { VisaoGeralMusica } from '../typesBlocos'
import { formatarNumeroPtBr, gerarRotaArtista, gerarRotaMusica } from '../utils'
import { CapaMusica } from './CapaMusica'
import { DivisaoFontesMusica } from './DivisaoFontesMusica'
import { LinkMusica } from './LinkMusica'
import { MinutosMusica } from './MinutosMusica'
import { AtalhoAbaMusica, CartaoBlocoMusica, VazioBlocoMusica } from './PecasBlocoMusica'

const ORDEM_PODIO = [1, 0, 2]
const ALTURA_PODIO = ['92px', '64px', '48px']
const TAMANHO_FOTO_PODIO = [
  { base: '84px', md: '112px' },
  { base: '68px', md: '88px' },
  { base: '68px', md: '88px' },
]

export const VisaoGeralTopos = memo(function VisaoGeralTopos({
  dados,
}: {
  dados: VisaoGeralMusica
}) {
  const imagemDe = useImagensItensMusica([
    ...dados.topMusicas,
    ...dados.topArtistas,
    ...dados.topAlbuns,
  ])
  const musicaDoPeriodo = dados.topMusicas[0]
  const albumDoPeriodo = dados.topAlbuns[0]

  return (
    <VStack align="stretch" gap={4}>
      <Grid
        templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 1.2fr) minmax(0, 1fr)' }}
        gap={4}
      >
        <CartaoBlocoMusica
          titulo="Pódio de artistas"
          descricao="Os 3 artistas que você mais ouviu no período selecionado, ordenados por streams."
          icone={<Mic2 size={14} />}
          cor="cirqueira.musica.azul"
          acao={<AtalhoAbaMusica aba="rankings" rotulo="Ranking" />}
        >
          <PodioArtistas artistas={dados.topArtistas.slice(0, 3)} imagemDe={imagemDe} />
        </CartaoBlocoMusica>
        <CartaoBlocoMusica
          titulo="Música do período"
          descricao="A faixa com mais reproduções no período. É o topo do seu ranking de músicas."
          icone={<Crown size={14} />}
        >
          {musicaDoPeriodo ? (
            <DestaqueMusica musica={musicaDoPeriodo} imagemUrl={imagemDe(musicaDoPeriodo)} />
          ) : (
            <VazioBlocoMusica texto="Nada tocado neste período." />
          )}
        </CartaoBlocoMusica>
      </Grid>

      <Grid
        templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' }}
        gap={4}
      >
        <CartaoBlocoMusica
          titulo="Mais tocadas"
          descricao="Carrossel com as músicas mais ouvidas no período, com capa, streams e minutos."
          icone={<Music2 size={14} />}
          cor="cirqueira.musica.verde"
          acao={<AtalhoAbaMusica aba="rankings" rotulo="Top 50" />}
        >
          <CarrosselMusicas musicas={dados.topMusicas} imagemDe={imagemDe} />
        </CartaoBlocoMusica>
        <CartaoBlocoMusica
          titulo="Álbum do período"
          descricao="O álbum cujas faixas somaram mais escuta no período selecionado."
          icone={<Disc3 size={14} />}
        >
          {albumDoPeriodo ? (
            <DestaqueAlbum album={albumDoPeriodo} imagemUrl={imagemDe(albumDoPeriodo)} />
          ) : (
            <VazioBlocoMusica texto="Nenhum álbum neste período." />
          )}
        </CartaoBlocoMusica>
      </Grid>
    </VStack>
  )
})

function PodioArtistas({
  artistas,
  imagemDe,
}: {
  artistas: ArtistaAnalise[]
  imagemDe: (item: ArtistaAnalise) => string | null
}) {
  if (artistas.length === 0) return <VazioBlocoMusica texto="Nenhum artista neste período." />

  return (
    <Flex justify="center" align="flex-end" gap={{ base: 2, md: 4 }}>
      {ORDEM_PODIO.map((indice) => {
        const artista = artistas[indice]
        if (!artista) return null
        return (
          <VStack key={artista.nome} gap={2} flex={1} maxW="160px" minW={0}>
            <LinkMusica to={gerarRotaArtista(artista.nome, artista.artistaUuid)}>
              <CapaMusica
                url={imagemDe(artista)}
                alt={artista.nome}
                tipo="artista"
                boxSize={TAMANHO_FOTO_PODIO[indice]}
                boxShadow="0 12px 30px rgba(0, 0, 0, 0.45)"
                tamanhoIcone={32}
              />
            </LinkMusica>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="cirqueira.musica.textoPrincipal"
              textAlign="center"
              lineClamp={1}
            >
              {artista.nome}
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" textAlign="center">
              {formatarNumeroPtBr(artista.streams)} streams
            </Text>
            <Flex
              w="full"
              h={ALTURA_PODIO[indice]}
              bg={indice === 0 ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
              color={indice === 0 ? 'cirqueira.musica.fundo' : 'cirqueira.musica.textoSecundario'}
              borderTopRadius="8px"
              align="center"
              justify="center"
              fontSize="xl"
              fontWeight="black"
            >
              {indice + 1}
            </Flex>
          </VStack>
        )
      })}
    </Flex>
  )
}

function DestaqueMusica({
  musica,
  imagemUrl,
}: { musica: MusicaAnalise; imagemUrl: string | null }) {
  return (
    <Flex
      gap={4}
      align={{ base: 'flex-start', sm: 'center' }}
      direction={{ base: 'column', sm: 'row' }}
    >
      <LinkMusica to={gerarRotaMusica(musica.nomeFaixa, musica.artista, musica.musicaUuid)}>
        <CapaMusica
          url={imagemUrl}
          alt={musica.nomeFaixa}
          boxSize={{ base: '140px', md: '168px' }}
          borderRadius="10px"
          boxShadow="0 16px 40px rgba(0, 0, 0, 0.5)"
          tamanhoIcone={40}
        />
      </LinkMusica>
      <VStack align="flex-start" gap={1} minW={0}>
        <Text
          fontSize="xl"
          fontWeight="black"
          color="cirqueira.musica.textoPrincipal"
          lineClamp={2}
        >
          {musica.nomeFaixa}
        </Text>
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario" lineClamp={1}>
          {musica.artista}
        </Text>
        <Text
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="black"
          color="cirqueira.musica.verde"
          lineHeight="1.1"
          pt={2}
        >
          {formatarNumeroPtBr(musica.streams)}
        </Text>
        <Text
          fontSize="2xs"
          fontWeight="bold"
          textTransform="uppercase"
          color="cirqueira.musica.textoSecundario"
        >
          streams · <MinutosMusica minutos={musica.minutos} porFonte={musica.porFonte} />
        </Text>
        <DivisaoFontesMusica porFonte={musica.porFonte} />
      </VStack>
    </Flex>
  )
}

function CarrosselMusicas({
  musicas,
  imagemDe,
}: {
  musicas: MusicaAnalise[]
  imagemDe: (item: MusicaAnalise) => string | null
}) {
  if (musicas.length === 0) return <VazioBlocoMusica texto="Nada tocado neste período." />

  return (
    <HStack
      gap={3}
      overflowX="auto"
      pb={2}
      align="flex-start"
      css={{ scrollSnapType: 'x mandatory' }}
    >
      {musicas.map((musica, indice) => (
        <Box
          key={musica.musicaUuid ?? musica.nomeFaixa}
          w="132px"
          flexShrink={0}
          css={{ scrollSnapAlign: 'start' }}
        >
          <LinkMusica to={gerarRotaMusica(musica.nomeFaixa, musica.artista, musica.musicaUuid)}>
            <Box position="relative">
              <CapaMusica
                url={imagemDe(musica)}
                alt={musica.nomeFaixa}
                boxSize="132px"
                borderRadius="8px"
                tamanhoIcone={32}
              />
              <Flex
                position="absolute"
                top={1.5}
                left={1.5}
                boxSize="24px"
                borderRadius="full"
                bg="cirqueira.musica.fundo"
                color="cirqueira.musica.verde"
                align="center"
                justify="center"
                fontSize="xs"
                fontWeight="black"
              >
                {indice + 1}
              </Flex>
            </Box>
          </LinkMusica>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="cirqueira.musica.textoPrincipal"
            mt={2}
            lineClamp={1}
          >
            {musica.nomeFaixa}
          </Text>
          <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
            {musica.artista} · {formatarNumeroPtBr(musica.streams)}
          </Text>
        </Box>
      ))}
    </HStack>
  )
}

function DestaqueAlbum({ album, imagemUrl }: { album: AlbumAnalise; imagemUrl: string | null }) {
  return (
    <VStack align="stretch" gap={3}>
      <CapaMusica
        url={imagemUrl}
        alt={album.album}
        tipo="album"
        w="full"
        aspectRatio={1}
        maxW="220px"
        mx="auto"
        borderRadius="10px"
        boxShadow="0 16px 40px rgba(0, 0, 0, 0.5)"
        tamanhoIcone={40}
      />
      <VStack gap={0} align="center">
        <Text
          fontSize="md"
          fontWeight="black"
          color="cirqueira.musica.textoPrincipal"
          textAlign="center"
          lineClamp={1}
        >
          {album.album}
        </Text>
        <Text
          fontSize="xs"
          color="cirqueira.musica.textoSecundario"
          textAlign="center"
          lineClamp={1}
        >
          {album.artista} · {album.faixasDistintas} faixas · {formatarNumeroPtBr(album.streams)}{' '}
          streams
        </Text>
      </VStack>
    </VStack>
  )
}
