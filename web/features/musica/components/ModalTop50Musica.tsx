import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Button, Dialog, HStack, Portal, Skeleton, Text, VStack } from '@chakra-ui/react'
import { Disc3, Music2, Users, X } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import type { FiltroIntervaloRankingParams } from '../api'
import { useImagensItensMusica, useImagensMusica, useRankingIntervaloMusica } from '../hooks'
import type { AlbumAnalise } from '../types'
import {
  gerarChaveArtista,
  gerarChaveFaixa,
  linhasRankingAlbuns,
  linhasRankingArtistas,
  linhasRankingMusicas,
} from '../utils'
import { TabelaRankingMusica } from './TabelaRankingMusica'

export type AbaTop50Musica = 'musicas' | 'artistas' | 'albuns'

const LIMITE_TOP = 50
const SEM_ALBUNS: AlbumAnalise[] = []

const ABAS: { chave: AbaTop50Musica; rotulo: string; cor: string; icone: typeof Music2 }[] = [
  { chave: 'musicas', rotulo: 'Músicas', cor: 'cirqueira.musica.amarelo', icone: Music2 },
  { chave: 'artistas', rotulo: 'Artistas', cor: 'cirqueira.musica.azul', icone: Users },
  { chave: 'albuns', rotulo: 'Álbuns', cor: 'cirqueira.musica.verde', icone: Disc3 },
]

export interface ModalTop50MusicaProps {
  periodo: Omit<FiltroIntervaloRankingParams, 'limite'>
  rotuloPeriodo: string
  abaInicial: AbaTop50Musica
  onFechar: () => void
}

export const ModalTop50Musica = memo(function ModalTop50Musica({
  periodo,
  rotuloPeriodo,
  abaInicial,
  onFechar,
}: ModalTop50MusicaProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [aba, setAba] = useState<AbaTop50Musica>(abaInicial)
  const { data, isLoading } = useRankingIntervaloMusica({ ...periodo, limite: LIMITE_TOP }, true)

  const chavesFaltantes = useMemo(() => {
    if (!data) return []
    return [
      ...data.topMusicas
        .filter((musica) => !musica.imagemUrl)
        .map((musica) =>
          gerarChaveFaixa(musica.codigoFaixa, musica.artistaPrincipal, musica.nomeFaixa)
        ),
      ...data.topArtistas
        .filter((artista) => !artista.imagemUrl)
        .map((artista) => gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)),
    ]
  }, [data])

  const { data: mapaImagens } = useImagensMusica(chavesFaltantes)
  const topAlbuns = data?.topAlbuns ?? SEM_ALBUNS
  const imagemAlbum = useImagensItensMusica(topAlbuns)

  const linhas = !data
    ? []
    : aba === 'musicas'
      ? linhasRankingMusicas(
          data.topMusicas,
          (musica) =>
            musica.imagemUrl ??
            mapaImagens?.[
              gerarChaveFaixa(musica.codigoFaixa, musica.artistaPrincipal, musica.nomeFaixa)
            ]?.imagemUrl ??
            null
        )
      : aba === 'artistas'
        ? linhasRankingArtistas(
            data.topArtistas,
            (artista) =>
              artista.imagemUrl ??
              mapaImagens?.[gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)]
                ?.imagemUrl ??
              null
          )
        : linhasRankingAlbuns(topAlbuns, imagemAlbum)

  return (
    <Dialog.Root
      open
      onOpenChange={(detalhes) => !detalhes.open && onFechar()}
      placement="center"
      scrollBehavior="inside"
      size={isDesktop ? 'xl' : 'full'}
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <Dialog.Positioner p={{ base: 0, md: 4 }}>
          <Dialog.Content
            data-theme="dark"
            bg="cirqueira.musica.cartao"
            color="cirqueira.musica.textoPrincipal"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            borderRadius={{ base: 0, md: '12px' }}
            maxW={{ base: 'full', md: '980px' }}
            maxH={{ base: '100dvh', md: '92vh' }}
            fontFamily="inter"
          >
            <Dialog.Header px={{ base: 4, md: 6 }} pt={{ base: 4, md: 5 }} pb={3}>
              <VStack align="stretch" gap={3} w="full">
                <HStack justify="space-between" w="full">
                  <VStack align="flex-start" gap={0} minW={0}>
                    <Dialog.Title fontSize="md" fontWeight="bold">
                      Top {LIMITE_TOP}
                    </Dialog.Title>
                    <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate>
                      {rotuloPeriodo}
                    </Text>
                  </VStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    borderRadius="full"
                    color="cirqueira.musica.textoSecundario"
                    aria-label="Fechar"
                    onClick={onFechar}
                  >
                    <X size={16} />
                  </Button>
                </HStack>
                <HStack
                  gap={1}
                  bg="cirqueira.musica.cartaoElevado"
                  p={0.5}
                  borderRadius="full"
                  w={{ base: 'full', sm: 'max-content' }}
                >
                  {ABAS.map(({ chave, rotulo, cor, icone: Icone }) => (
                    <Button
                      key={chave}
                      size="xs"
                      borderRadius="full"
                      px={3}
                      flex={{ base: 1, sm: 'initial' }}
                      fontSize="2xs"
                      fontWeight="semibold"
                      bg={aba === chave ? 'cirqueira.musica.cartao' : 'transparent'}
                      color={aba === chave ? cor : 'cirqueira.musica.textoSecundario'}
                      onClick={() => setAba(chave)}
                    >
                      <HStack gap={1.5} justify="center">
                        <Icone size={12} />
                        <Text as="span">{rotulo}</Text>
                      </HStack>
                    </Button>
                  ))}
                </HStack>
              </VStack>
            </Dialog.Header>
            <Dialog.Body px={{ base: 4, md: 6 }} pb={{ base: 4, md: 6 }} overflowY="auto">
              {isLoading && !data ? (
                <Skeleton h="320px" w="full" borderRadius="8px" />
              ) : (
                <TabelaRankingMusica linhas={linhas} />
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
