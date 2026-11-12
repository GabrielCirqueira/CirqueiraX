import { LinkMusica } from '@/features/musica/components/LinkMusica'
import { Button, HStack, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { ExternalLink, GitBranch, Info, Merge, Split } from 'lucide-react'
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
  onDescartar: (primeiraUuid: string, segundaUuid: string) => void
  onVersoesDeOutra: (duplicata: DuplicataRevisao) => void
}

const PROPS_BOTAO_RESPOSTA = {
  size: 'sm',
  borderRadius: 'full',
  variant: 'outline',
  borderColor: 'cirqueira.musica.textoDesabilitado',
  color: 'cirqueira.musica.textoPrincipal',
  _hover: { bg: 'cirqueira.musica.cartaoElevado' },
} as const

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
        <Merge size={14} /> Iguais: ficar com este nome
      </Button>
    </VStack>
  )
}

export const CartaoDuplicataRevisao = memo(function CartaoDuplicataRevisao({
  duplicata,
  ocupado,
  onUnir,
  onDescartar,
  onVersoesDeOutra,
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
        Elas têm o mesmo nome e artistas parecidos. Ouça pelos atalhos e escolha uma das respostas
        abaixo.
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        <LadoDuplicata musica={primeira} outra={segunda} ocupado={ocupado} onUnir={onUnir} />
        <LadoDuplicata musica={segunda} outra={primeira} ocupado={ocupado} onUnir={onUnir} />
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
        <Button
          {...PROPS_BOTAO_RESPOSTA}
          disabled={ocupado}
          onClick={() => onVersoesDeOutra(duplicata)}
        >
          <GitBranch size={14} /> São versões de outra música
        </Button>
        <Button
          {...PROPS_BOTAO_RESPOSTA}
          disabled={ocupado}
          onClick={() => onDescartar(primeira.uuid, segunda.uuid)}
        >
          <Split size={14} /> São músicas diferentes
        </Button>
      </SimpleGrid>
      <VStack align="stretch" gap={1} fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
        <Text>
          <Text as="strong" color="cirqueira.musica.textoSecundario">
            Iguais:{' '}
          </Text>
          as duas viram uma só, com o nome que você escolheu, e as reproduções somam. Dá para
          separar depois nos detalhes da música.
        </Text>
        <Text>
          <Text as="strong" color="cirqueira.musica.textoSecundario">
            Versões de outra música:{' '}
          </Text>
          você escolhe a música oficial (ex.: um slowed + reverb da original) e as duas viram
          versões dela.
        </Text>
        <Text>
          <Text as="strong" color="cirqueira.musica.textoSecundario">
            Diferentes:{' '}
          </Text>
          nada muda nas músicas; o par só sai da revisão e não volta mais.
        </Text>
      </VStack>
    </VStack>
  )
})
