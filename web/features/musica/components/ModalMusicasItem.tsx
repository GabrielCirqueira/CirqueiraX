import { Box, Button, Dialog, Portal, Skeleton, Text, VStack } from '@chakra-ui/react'
import { X } from 'lucide-react'
import { memo } from 'react'
import type { PeriodoMusicasItem } from '../api'
import { useMusicasItem } from '../hooks'
import { LinhaMusicaItemSpotify } from './ListaMusicasItem'

const LIMITE_COMPLETO = 500

export interface ModalMusicasItemProps {
  aberto: boolean
  onFechar: () => void
  artista: string
  album?: string | null
  periodo?: PeriodoMusicasItem | null
  rotuloPeriodo?: string
}

export const ModalMusicasItem = memo(function ModalMusicasItem({
  aberto,
  onFechar,
  artista,
  album,
  periodo,
  rotuloPeriodo,
}: ModalMusicasItemProps) {
  const { data: musicas, isLoading } = useMusicasItem(
    { artista, album, periodo, limite: LIMITE_COMPLETO },
    aberto
  )
  const total = musicas?.length ?? 0
  const detalhes = [
    album ? artista : null,
    rotuloPeriodo,
    isLoading ? null : `${total} ${total === 1 ? 'música' : 'músicas'}`,
  ].filter(Boolean)

  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(evento) => !evento.open && onFechar()}
      scrollBehavior="inside"
      placement="center"
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            data-theme="dark"
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            borderRadius="8px"
            color="cirqueira.musica.textoPrincipal"
            fontFamily="inter"
            w={{ base: 'calc(100% - 24px)', md: 'full' }}
            maxW="lg"
            h="auto"
            maxH={{ base: '85dvh', md: '75vh' }}
            my="auto"
          >
            <Dialog.Header
              px={{ base: 4, md: 6 }}
              pt={{ base: 4, md: 6 }}
              pb={3}
              display="flex"
              alignItems="flex-start"
              justifyContent="space-between"
              gap={3}
            >
              <VStack align="flex-start" gap={0.5} minW={0}>
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  color="cirqueira.musica.verde"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {album ? 'Músicas do álbum' : 'Músicas do artista'}
                </Text>
                <Dialog.Title fontSize="lg" fontWeight="bold" truncate maxW="full">
                  {album ?? artista}
                </Dialog.Title>
                <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
                  {detalhes.join(' • ')}
                </Text>
              </VStack>

              <Dialog.CloseTrigger asChild position="static">
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.musica.textoSecundario"
                  _hover={{
                    color: 'cirqueira.musica.textoPrincipal',
                    bg: 'cirqueira.musica.cartaoElevado',
                  }}
                  aria-label="Fechar"
                >
                  <X size={16} />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body
              px={{ base: 4, md: 6 }}
              pb={{ base: 4, md: 6 }}
              overflowY="auto"
              flex="1"
              minH={0}
            >
              {isLoading ? (
                <VStack gap={1.5} align="stretch">
                  <Skeleton h="44px" borderRadius="6px" />
                  <Skeleton h="44px" borderRadius="6px" />
                  <Skeleton h="44px" borderRadius="6px" />
                  <Skeleton h="44px" borderRadius="6px" />
                </VStack>
              ) : total === 0 ? (
                <Box py={6} textAlign="center">
                  <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                    Nenhuma música encontrada no período.
                  </Text>
                </Box>
              ) : (
                <VStack gap={1.5} align="stretch">
                  {musicas?.map((musica, indice) => (
                    <LinhaMusicaItemSpotify
                      key={`${musica.nomeFaixa}-${musica.codigoFaixa ?? indice}`}
                      musica={musica}
                      posicao={indice + 1}
                    />
                  ))}
                </VStack>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
