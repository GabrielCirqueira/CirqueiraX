import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Box,
  Button,
  Dialog,
  Drawer,
  HStack,
  Heading,
  Portal,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ChevronRight, Music2, Users, X } from 'lucide-react'
import { memo, useState } from 'react'
import type {
  ItemRankingArtista,
  ItemRankingMusica,
  RespostaConsultaImagens,
  ResumoGeralSpotify,
} from '../types'
import {
  formatarMinutosParaHorasEMinutos,
  formatarPercentualVariacao,
  gerarChaveArtista,
  gerarChaveFaixa,
} from '../utils'
import { ItemRankingArtistaLinha, ItemRankingFaixa } from './ItensRankingSpotify'

export interface SecaoHojeSemanaProps {
  resumo?: ResumoGeralSpotify
  carregando?: boolean
  mapaImagens?: RespostaConsultaImagens
}

export const SecaoHojeSemana = memo(function SecaoHojeSemana({
  resumo,
  carregando = false,
  mapaImagens,
}: SecaoHojeSemanaProps) {
  const [periodo, setPeriodo] = useState<'hoje' | 'semana'>('hoje')
  const [aba, setAba] = useState<'musicas' | 'artistas'>('musicas')
  const [modalRankingAberto, setModalRankingAberto] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (carregando) {
    return (
      <VStack gap={4} align="stretch" w="full">
        <Skeleton h="40px" w="200px" borderRadius="full" />
        <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Skeleton h="240px" borderRadius="8px" />
          <Skeleton h="240px" borderRadius="8px" />
        </Box>
      </VStack>
    )
  }

  const dadosPeriodo = periodo === 'hoje' ? resumo?.hoje : resumo?.semana

  const totalMinutos = dadosPeriodo?.totalMinutos ?? 0
  const totalStreams = dadosPeriodo?.totalStreams ?? 0
  const variacao = dadosPeriodo?.variacaoMinutosPercentual ?? null

  const topMusicas = dadosPeriodo?.topMusicas ?? []
  const topArtistas = dadosPeriodo?.topArtistas ?? []

  const topMusicasExibidas = topMusicas.slice(0, 5)
  const topArtistasExibidos = topArtistas.slice(0, 5)

  return (
    <VStack gap={5} align="stretch" w="full">
      <HStack justify="space-between" align="center" wrap="wrap" gap={3}>
        <HStack
          gap={2}
          bg="cirqueira.spotify.cartao"
          p={1}
          borderRadius="full"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
        >
          <Button
            size="sm"
            borderRadius="full"
            px={4}
            h="32px"
            fontSize="xs"
            fontWeight="bold"
            bg={periodo === 'hoje' ? 'cirqueira.spotify.cartaoElevado' : 'transparent'}
            color={
              periodo === 'hoje'
                ? 'cirqueira.spotify.textoPrincipal'
                : 'cirqueira.spotify.textoSecundario'
            }
            _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}
            onClick={() => setPeriodo('hoje')}
          >
            Hoje
          </Button>
          <Button
            size="sm"
            borderRadius="full"
            px={4}
            h="32px"
            fontSize="xs"
            fontWeight="bold"
            bg={periodo === 'semana' ? 'cirqueira.spotify.cartaoElevado' : 'transparent'}
            color={
              periodo === 'semana'
                ? 'cirqueira.spotify.textoPrincipal'
                : 'cirqueira.spotify.textoSecundario'
            }
            _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}
            onClick={() => setPeriodo('semana')}
          >
            Últimos 7 dias
          </Button>
        </HStack>

        <HStack gap={4}>
          <HStack gap={1.5}>
            <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
              Tempo ouvido:
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.verde">
              {formatarMinutosParaHorasEMinutos(totalMinutos)}
            </Text>
            {variacao !== null && (
              <Box
                px={1.5}
                py={0.5}
                borderRadius="md"
                bg={variacao >= 0 ? 'rgba(30, 215, 96, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
                color={variacao >= 0 ? 'cirqueira.spotify.verde' : 'red.400'}
                fontSize="2xs"
                fontWeight="bold"
              >
                {formatarPercentualVariacao(variacao)}
              </Box>
            )}
          </HStack>
          <HStack gap={1.5}>
            <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
              Streams:
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
              {totalStreams}
            </Text>
          </HStack>
        </HStack>
      </HStack>

      <Box
        p={5}
        bg="cirqueira.spotify.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="cirqueira.spotify.cartaoElevado"
      >
        <VStack gap={4} align="stretch">
          <HStack
            justify="space-between"
            align="center"
            borderBottom="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            pb={3}
          >
            <Heading
              as="h3"
              fontSize="sm"
              fontWeight="bold"
              color="cirqueira.spotify.amarelo"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              {aba === 'musicas' ? 'Músicas Mais Ouvidas' : 'Artistas Mais Ouvidos'}
            </Heading>

            <HStack gap={1} bg="cirqueira.spotify.cartaoElevado" p={0.5} borderRadius="full">
              <Button
                size="xs"
                borderRadius="full"
                px={3}
                fontSize="2xs"
                fontWeight="semibold"
                bg={aba === 'musicas' ? 'cirqueira.spotify.cartao' : 'transparent'}
                color={
                  aba === 'musicas'
                    ? 'cirqueira.spotify.amarelo'
                    : 'cirqueira.spotify.textoSecundario'
                }
                onClick={() => setAba('musicas')}
              >
                <HStack gap={1.5}>
                  <Music2 size={12} />
                  <Text as="span">Músicas</Text>
                </HStack>
              </Button>
              <Button
                size="xs"
                borderRadius="full"
                px={3}
                fontSize="2xs"
                fontWeight="semibold"
                bg={aba === 'artistas' ? 'cirqueira.spotify.cartao' : 'transparent'}
                color={
                  aba === 'artistas'
                    ? 'cirqueira.spotify.azul'
                    : 'cirqueira.spotify.textoSecundario'
                }
                onClick={() => setAba('artistas')}
              >
                <HStack gap={1.5}>
                  <Users size={12} />
                  <Text as="span">Artistas</Text>
                </HStack>
              </Button>
            </HStack>
          </HStack>

          {aba === 'musicas' ? (
            topMusicas.length === 0 ? (
              <Box
                py={8}
                textAlign="center"
                color="cirqueira.spotify.textoSecundario"
                fontSize="xs"
              >
                Nenhuma reprodução registrada para o período selecionado.
              </Box>
            ) : (
              <VStack gap={2} align="stretch">
                {topMusicasExibidas.map((musica) => {
                  const chave = gerarChaveFaixa(
                    musica.codigoFaixa,
                    musica.artistaPrincipal,
                    musica.nomeFaixa
                  )
                  return (
                    <ItemRankingFaixa
                      key={`${musica.nomeFaixa}-${musica.artistaPrincipal}`}
                      item={musica}
                      imagemUrlResolvida={mapaImagens?.[chave]?.imagemUrl}
                    />
                  )
                })}
              </VStack>
            )
          ) : topArtistas.length === 0 ? (
            <Box py={8} textAlign="center" color="cirqueira.spotify.textoSecundario" fontSize="xs">
              Nenhum artista registrado para o período selecionado.
            </Box>
          ) : (
            <VStack gap={2} align="stretch">
              {topArtistasExibidos.map((artista) => {
                const chave = gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)
                return (
                  <ItemRankingArtistaLinha
                    key={artista.nomeArtista}
                    item={artista}
                    imagemUrlResolvida={mapaImagens?.[chave]?.imagemUrl}
                  />
                )
              })}
            </VStack>
          )}

          {((aba === 'musicas' && topMusicas.length > 0) ||
            (aba === 'artistas' && topArtistas.length > 0)) && (
            <Button
              variant="ghost"
              size="sm"
              w="full"
              mt={1}
              py={2.5}
              h="auto"
              borderRadius="6px"
              justifyContent="space-between"
              color="cirqueira.spotify.textoSecundario"
              _hover={{
                color: 'cirqueira.spotify.textoPrincipal',
                bg: 'cirqueira.spotify.cartaoElevado',
              }}
              onClick={() => setModalRankingAberto(true)}
            >
              <Text as="span" fontSize="xs" fontWeight="semibold">
                {aba === 'musicas'
                  ? `Ver ranking completo (Top ${Math.min(topMusicas.length, 50)} músicas)`
                  : `Ver ranking completo (Top ${Math.min(topArtistas.length, 50)} artistas)`}
              </Text>
              <ChevronRight size={16} />
            </Button>
          )}
        </VStack>
      </Box>

      {modalRankingAberto && (
        <ModalRankingHojeSemana
          aberto={modalRankingAberto}
          onFechar={() => setModalRankingAberto(false)}
          tipo={aba}
          periodo={periodo}
          topMusicas={topMusicas}
          topArtistas={topArtistas}
          mapaImagens={mapaImagens}
          isDesktop={isDesktop}
        />
      )}
    </VStack>
  )
})

interface ModalRankingHojeSemanaProps {
  aberto: boolean
  onFechar: () => void
  tipo: 'musicas' | 'artistas'
  periodo: 'hoje' | 'semana'
  topMusicas: ItemRankingMusica[]
  topArtistas: ItemRankingArtista[]
  mapaImagens?: RespostaConsultaImagens
  isDesktop: boolean
}

function ModalRankingHojeSemana({
  aberto,
  onFechar,
  tipo,
  periodo,
  topMusicas,
  topArtistas,
  mapaImagens,
  isDesktop,
}: ModalRankingHojeSemanaProps) {
  const titulo = tipo === 'musicas' ? 'Top 50 Músicas Mais Ouvidas' : 'Top 50 Artistas Mais Ouvidos'

  const total = tipo === 'musicas' ? topMusicas.length : topArtistas.length
  const rotuloPeriodo = periodo === 'hoje' ? 'Hoje' : 'Últimos 7 dias'
  const subtitulo = `${rotuloPeriodo} • Mostrando ${Math.min(total, 50)} no ranking`

  const renderConteudo = () => (
    <VStack gap={2} align="stretch" w="full" maxH="70vh" overflowY="auto" pr={1}>
      {tipo === 'musicas'
        ? topMusicas.slice(0, 50).map((musica) => {
            const chave = gerarChaveFaixa(
              musica.codigoFaixa,
              musica.artistaPrincipal,
              musica.nomeFaixa
            )
            return (
              <ItemRankingFaixa
                key={`${musica.posicao}-${musica.nomeFaixa}-${musica.artistaPrincipal}`}
                item={musica}
                imagemUrlResolvida={mapaImagens?.[chave]?.imagemUrl}
              />
            )
          })
        : topArtistas.slice(0, 50).map((artista) => {
            const chave = gerarChaveArtista(artista.codigoArtista, artista.nomeArtista)
            return (
              <ItemRankingArtistaLinha
                key={`${artista.posicao}-${artista.nomeArtista}`}
                item={artista}
                imagemUrlResolvida={mapaImagens?.[chave]?.imagemUrl}
              />
            )
          })}
    </VStack>
  )

  if (!isDesktop) {
    return (
      <Drawer.Root
        open={aberto}
        onOpenChange={(detalhes) => !detalhes.open && onFechar()}
        placement="bottom"
      >
        <Portal>
          <Drawer.Backdrop bg="rgba(0, 0, 0, 0.85)" backdropFilter="blur(4px)" />
          <Drawer.Positioner>
            <Drawer.Content
              bg="cirqueira.spotify.cartao"
              borderTop="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
              borderTopRadius="16px"
              p={5}
              maxH="85vh"
              overflowY="auto"
              color="cirqueira.spotify.textoPrincipal"
            >
              <Drawer.Header
                p={0}
                mb={4}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <VStack align="flex-start" gap={0.5}>
                  <Drawer.Title fontSize="md" fontWeight="bold">
                    {titulo}
                  </Drawer.Title>
                  <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                    {subtitulo}
                  </Text>
                </VStack>

                <Drawer.CloseTrigger asChild>
                  <Button
                    size="xs"
                    variant="ghost"
                    borderRadius="full"
                    color="cirqueira.spotify.textoSecundario"
                    _hover={{
                      color: 'cirqueira.spotify.textoPrincipal',
                      bg: 'cirqueira.spotify.cartaoElevado',
                    }}
                    onClick={onFechar}
                  >
                    <X size={16} />
                  </Button>
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body p={0}>{renderConteudo()}</Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(detalhes) => !detalhes.open && onFechar()}>
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.85)" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="cirqueira.spotify.cartao"
            border="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            borderRadius="8px"
            p={6}
            maxW="2xl"
            w="full"
            color="cirqueira.spotify.textoPrincipal"
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.7)"
          >
            <Dialog.Header
              p={0}
              mb={4}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <VStack align="flex-start" gap={0.5}>
                <Dialog.Title fontSize="lg" fontWeight="bold">
                  {titulo}
                </Dialog.Title>
                <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                  {subtitulo}
                </Text>
              </VStack>

              <Dialog.CloseTrigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.spotify.textoSecundario"
                  _hover={{
                    color: 'cirqueira.spotify.textoPrincipal',
                    bg: 'cirqueira.spotify.cartaoElevado',
                  }}
                  onClick={onFechar}
                >
                  <X size={16} />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={0}>{renderConteudo()}</Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
