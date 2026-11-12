import { LinkMusica } from '@/features/musica/components/LinkMusica'
import { Button, HStack, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { ExternalLink, Info, Merge } from 'lucide-react'
import { memo } from 'react'
import type { DuplicataRevisao, MusicaDuplicata } from '../types'
import {
  capaMusicaDuplicata,
  descreverOuvidasDuplicata,
  nomesArtistasCatalogo,
  rotaDetalheMusica,
  urlSpotifyDuplicata,
  videoDaMusicaDuplicata,
} from '../utils'
import { AtalhosVideoRevisao } from './AtalhosVideoRevisao'
import { MiniaturaVideoRevisao } from './MiniaturaVideoRevisao'

export interface CartaoDuplicataRevisaoProps {
  duplicata: DuplicataRevisao
  ocupado: boolean
  onUnir: (origemUuid: string, destinoUuid: string) => void
}

const PROPS_ATALHO = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  px: 2.5,
  py: 1,
  borderRadius: 'full',
  fontSize: 'xs',
  fontWeight: 'semibold',
  bg: 'cirqueira.musica.fundo',
  color: 'cirqueira.musica.textoPrincipal',
  textDecoration: 'none',
  _hover: { color: 'cirqueira.musica.verde' },
} as const

interface LadoDuplicataProps {
  musica: MusicaDuplicata
  outra: MusicaDuplicata
  ocupado: boolean
  onUnir: (origemUuid: string, destinoUuid: string) => void
}

function LadoDuplicata({ musica, outra, ocupado, onUnir }: LadoDuplicataProps) {
  const videoId = videoDaMusicaDuplicata(musica)
  const video = musica.videoPrincipal
  const ouvidas = descreverOuvidasDuplicata(musica)

  return (
    <VStack align="stretch" gap={3} p={3} borderRadius="10px" bg="cirqueira.musica.cartaoElevado">
      <HStack gap={3} align="start" minW={0}>
        <MiniaturaVideoRevisao
          imagem={capaMusicaDuplicata(musica)}
          videoId={videoId}
          titulo={musica.titulo}
          largura={{ base: '72px', sm: '88px' }}
          quadrada
        />
        <VStack align="start" gap={0.5} minW={0} flex={1}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="cirqueira.musica.textoPrincipal"
            lineClamp={2}
            wordBreak="break-word"
          >
            {musica.titulo}
          </Text>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario" lineClamp={2}>
            {nomesArtistasCatalogo(musica) || 'Sem artista'}
            {musica.album ? ` · ${musica.album}` : ''}
          </Text>
          {ouvidas && (
            <Text fontSize="2xs" fontWeight="semibold" color="cirqueira.musica.verde">
              {ouvidas}
            </Text>
          )}
          {video && (
            <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado" lineClamp={2}>
              Vídeo mais ouvido: {video.titulo}
              {video.canal ? ` · ${video.canal}` : ''}
            </Text>
          )}
        </VStack>
      </HStack>

      <AtalhosVideoRevisao videoId={videoId}>
        <Link
          href={urlSpotifyDuplicata(musica)}
          target="_blank"
          rel="noopener noreferrer"
          {...PROPS_ATALHO}
        >
          <ExternalLink size={12} /> Abrir no Spotify
        </Link>
        <LinkMusica to={rotaDetalheMusica(musica.uuid)}>
          <HStack {...PROPS_ATALHO}>
            <Info size={12} />
            <Text>Detalhes</Text>
          </HStack>
        </LinkMusica>
      </AtalhosVideoRevisao>

      <Button
        size="sm"
        borderRadius="full"
        variant="outline"
        borderColor="cirqueira.musica.verde"
        color="cirqueira.musica.verde"
        _hover={{ bg: 'cirqueira.musica.fundo' }}
        disabled={ocupado}
        onClick={() => onUnir(outra.uuid, musica.uuid)}
      >
        <Merge size={14} /> Manter esta
      </Button>
    </VStack>
  )
}

export const CartaoDuplicataRevisao = memo(function CartaoDuplicataRevisao({
  duplicata,
  ocupado,
  onUnir,
}: CartaoDuplicataRevisaoProps) {
  const [primeira, segunda] = duplicata.musicas

  return (
    <VStack
      align="stretch"
      gap={3}
      p={{ base: 3, sm: 4 }}
      borderRadius="12px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      opacity={ocupado ? 0.6 : 1}
    >
      <Text fontSize="sm" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
        Estas duas são a mesma música?
      </Text>
      <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
        Use os atalhos (Spotify, YouTube) para ouvir cada uma. Se forem a mesma, toque em “Manter
        esta” na versão com o nome certo. Se forem diferentes, é só deixar como está.
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        <LadoDuplicata musica={primeira} outra={segunda} ocupado={ocupado} onUnir={onUnir} />
        <LadoDuplicata musica={segunda} outra={primeira} ocupado={ocupado} onUnir={onUnir} />
      </SimpleGrid>
      <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
        Unir não apaga nada: a outra música passa a contar para a escolhida e pode ser separada
        depois.
      </Text>
    </VStack>
  )
})
