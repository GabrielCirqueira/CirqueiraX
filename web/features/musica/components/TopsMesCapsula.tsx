import { HStack, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Disc3, Mic2, Music2 } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import { useImagensItensMusica } from '../hooks/useImagensItensMusica'
import type { CapsulaMensal, PorFonte, RespostaConsultaImagens } from '../types'
import {
  formatarNumeroPtBr,
  gerarChaveArtista,
  gerarChaveFaixa,
  gerarRotaArtista,
  gerarRotaMusica,
} from '../utils'
import { CapaMusica } from './CapaMusica'
import { DivisaoFontesMusica } from './DivisaoFontesMusica'
import { LinkMusica } from './LinkMusica'
import { MinutosMusica } from './MinutosMusica'

const LIMITE_ITENS_TOPO = 5

export interface TopsMesCapsulaProps {
  capsula: CapsulaMensal
  mapaImagens?: RespostaConsultaImagens
}

export const TopsMesCapsula = memo(function TopsMesCapsula({
  capsula,
  mapaImagens,
}: TopsMesCapsulaProps) {
  const imagemAlbum = useImagensItensMusica(capsula.topAlbuns)

  return (
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap={4}>
      <ListaTopoCapsula
        titulo="Top artistas do mês"
        icone={<Mic2 size={14} />}
        cor="cirqueira.musica.azul"
      >
        {capsula.topArtistas.slice(0, LIMITE_ITENS_TOPO).map((artista) => (
          <ItemTopoCapsula
            key={artista.nomeArtista}
            posicao={artista.posicao}
            rota={gerarRotaArtista(artista.nomeArtista)}
            capa={
              <CapaMusica
                url={
                  artista.imagemUrl ||
                  mapaImagens?.[gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)]
                    ?.imagemUrl
                }
                alt={artista.nomeArtista}
                tipo="artista"
                boxSize="44px"
              />
            }
            titulo={artista.nomeArtista}
            streams={artista.totalStreams}
            minutos={artista.totalMinutos}
            porFonte={artista.porFonte}
          />
        ))}
      </ListaTopoCapsula>

      <ListaTopoCapsula
        titulo="Top músicas do mês"
        icone={<Music2 size={14} />}
        cor="cirqueira.musica.verde"
      >
        {capsula.topMusicas.slice(0, LIMITE_ITENS_TOPO).map((musica) => (
          <ItemTopoCapsula
            key={`${musica.nomeFaixa}-${musica.artistaPrincipal}`}
            posicao={musica.posicao}
            rota={gerarRotaMusica(musica.nomeFaixa, musica.artistaPrincipal)}
            capa={
              <CapaMusica
                url={
                  musica.imagemUrl ||
                  mapaImagens?.[
                    gerarChaveFaixa(musica.codigoFaixa, musica.artistaPrincipal, musica.nomeFaixa)
                  ]?.imagemUrl
                }
                alt={musica.album}
                boxSize="44px"
              />
            }
            titulo={musica.nomeFaixa}
            detalhe={musica.artistaPrincipal}
            streams={musica.totalStreams}
            minutos={musica.totalMinutos}
            porFonte={musica.porFonte}
          />
        ))}
      </ListaTopoCapsula>

      <ListaTopoCapsula
        titulo="Top álbuns do mês"
        icone={<Disc3 size={14} />}
        cor="cirqueira.musica.amarelo"
      >
        {capsula.topAlbuns.slice(0, LIMITE_ITENS_TOPO).map((album, indice) => (
          <ItemTopoCapsula
            key={`${album.album}-${album.artista}`}
            posicao={indice + 1}
            rota={gerarRotaArtista(album.artista)}
            capa={
              <CapaMusica url={imagemAlbum(album)} alt={album.album} tipo="album" boxSize="44px" />
            }
            titulo={album.album}
            detalhe={album.artista}
            streams={album.streams}
            minutos={album.minutos}
          />
        ))}
      </ListaTopoCapsula>
    </SimpleGrid>
  )
})

interface ListaTopoCapsulaProps {
  titulo: string
  icone: ReactNode
  cor: string
  children: ReactNode
}

function ListaTopoCapsula({ titulo, icone, cor, children }: ListaTopoCapsulaProps) {
  return (
    <VStack
      align="stretch"
      gap={2}
      p={4}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="border.subtle"
    >
      <HStack gap={2} color={cor} mb={1}>
        {icone}
        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
          {titulo}
        </Text>
        <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado" ml="auto">
          por streams
        </Text>
      </HStack>
      {children}
    </VStack>
  )
}

interface ItemTopoCapsulaProps {
  posicao: number
  rota: string
  capa: ReactNode
  titulo: string
  detalhe?: string
  streams: number
  minutos: number
  porFonte?: PorFonte
}

function ItemTopoCapsula({
  posicao,
  rota,
  capa,
  titulo,
  detalhe,
  streams,
  minutos,
  porFonte,
}: ItemTopoCapsulaProps) {
  return (
    <Link asChild _hover={{ textDecoration: 'none' }} display="block">
      <LinkMusica to={rota}>
        <HStack
          gap={3}
          p={1.5}
          borderRadius="6px"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
        >
          <Text
            w="16px"
            fontSize="sm"
            fontWeight="black"
            color={posicao === 1 ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoDesabilitado'}
          >
            {posicao}
          </Text>
          {capa}
          <VStack align="flex-start" gap={0} minW={0} flex={1}>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="cirqueira.musica.textoPrincipal"
              truncate
              maxW="full"
            >
              {titulo}
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
              {detalhe ? `${detalhe} · ` : ''}
              {formatarNumeroPtBr(streams)} streams ·{' '}
              <MinutosMusica minutos={minutos} porFonte={porFonte} />
            </Text>
            <DivisaoFontesMusica porFonte={porFonte} />
          </VStack>
        </HStack>
      </LinkMusica>
    </Link>
  )
}
