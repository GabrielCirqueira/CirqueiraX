import { Box, Button, HStack, Heading, Skeleton, Tabs, Text, VStack } from '@chakra-ui/react'
import { Calendar, Disc3, Music2, TrendingUp, Users } from 'lucide-react'
import { memo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ResumoGeralSpotify } from '../types'
import { formatarMinutosParaHorasEMinutos, formatarPercentualVariacao } from '../utils'
import { ItemRankingArtistaLinha, ItemRankingFaixa } from './ItensRankingSpotify'

export interface SecaoHojeSemanaProps {
  resumo?: ResumoGeralSpotify
  carregando?: boolean
}

export const SecaoHojeSemana = memo(function SecaoHojeSemana({
  resumo,
  carregando = false,
}: SecaoHojeSemanaProps) {
  const [periodo, setPeriodo] = useState<'hoje' | 'semana'>('hoje')
  const [aba, setAba] = useState<'musicas' | 'artistas'>('musicas')

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
                {topMusicas.map((musica) => (
                  <ItemRankingFaixa
                    key={`${musica.nomeFaixa}-${musica.artistaPrincipal}`}
                    item={musica}
                  />
                ))}
              </VStack>
            )
          ) : topArtistas.length === 0 ? (
            <Box py={8} textAlign="center" color="cirqueira.spotify.textoSecundario" fontSize="xs">
              Nenhum artista registrado para o período selecionado.
            </Box>
          ) : (
            <VStack gap={2} align="stretch">
              {topArtistas.map((artista) => (
                <ItemRankingArtistaLinha key={artista.nomeArtista} item={artista} />
              ))}
            </VStack>
          )}
        </VStack>
      </Box>
    </VStack>
  )
})
