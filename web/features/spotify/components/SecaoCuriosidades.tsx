import { Box, HStack, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Award, Calendar, Clock, Flame, Repeat, Sparkles, UserPlus } from 'lucide-react'
import { memo } from 'react'
import type { CuriosidadesSpotify } from '../types'
import {
  formatarDataPtBr,
  formatarMinutosParaHorasEMinutos,
  formatarPercentualVariacao,
} from '../utils'

export interface SecaoCuriosidadesProps {
  curiosidades?: CuriosidadesSpotify
}

export const SecaoCuriosidades = memo(function SecaoCuriosidades({
  curiosidades,
}: SecaoCuriosidadesProps) {
  if (!curiosidades) return null

  const {
    horarioPico,
    minutosHorarioPico,
    diaSemanaMaisOuvido,
    minutosDiaSemana,
    diaMaisLongoData,
    diaMaisLongoMinutos,
    faixaMaisRepetidaNome,
    faixaMaisRepetidaArtista,
    faixaMaisRepetidaVezes,
    artistasDescobertosNoMes,
    mediaMinutosDiarios,
    variacaoMediaDiariaPercentual,
  } = curiosidades

  return (
    <VStack gap={4} align="stretch" w="full">
      <Heading
        as="h2"
        fontSize="sm"
        fontWeight="bold"
        color="cirqueira.spotify.amarelo"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        Curiosidades e Padrões de Audição
      </Heading>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.spotify.cartao"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
          _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(254, 228, 79, 0.15)"
              color="cirqueira.spotify.amarelo"
            >
              <Clock size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Horário de Pico
              </Text>
              <Text fontSize="md" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                {horarioPico ?? '—'}
              </Text>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                {minutosHorarioPico > 0
                  ? `${formatarMinutosParaHorasEMinutos(minutosHorarioPico)} ouvidos neste horário`
                  : 'Sem dados suficientes'}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.spotify.cartao"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
          _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(83, 157, 245, 0.15)"
              color="cirqueira.spotify.azul"
            >
              <Calendar size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Dia Mais Frequente
              </Text>
              <Text fontSize="md" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                {diaSemanaMaisOuvido ?? '—'}
              </Text>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                {minutosDiaSemana > 0
                  ? `${formatarMinutosParaHorasEMinutos(minutosDiaSemana)} acumulados`
                  : 'Sem dados suficientes'}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.spotify.cartao"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
          _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(30, 215, 96, 0.15)"
              color="cirqueira.spotify.verde"
            >
              <Flame size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Dia Mais Longo
              </Text>
              <Text fontSize="md" fontWeight="bold" color="cirqueira.spotify.verde">
                {diaMaisLongoMinutos > 0
                  ? formatarMinutosParaHorasEMinutos(diaMaisLongoMinutos)
                  : '—'}
              </Text>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                {diaMaisLongoData ? `Em ${formatarDataPtBr(diaMaisLongoData)}` : 'Sem registros'}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.spotify.cartao"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
          _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(254, 228, 79, 0.15)"
              color="cirqueira.spotify.amarelo"
            >
              <Repeat size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Faixa Mais Repetida em 1 Dia
              </Text>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="cirqueira.spotify.textoPrincipal"
                truncate
                maxW="full"
              >
                {faixaMaisRepetidaNome ?? '—'}
              </Text>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario" truncate maxW="full">
                {faixaMaisRepetidaArtista ? `${faixaMaisRepetidaArtista} • ` : ''}
                {faixaMaisRepetidaVezes > 0
                  ? `${faixaMaisRepetidaVezes} vezes em um único dia`
                  : 'Sem dados'}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.spotify.cartao"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
          _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(83, 157, 245, 0.15)"
              color="cirqueira.spotify.azul"
            >
              <UserPlus size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Novos Artistas no Mês
              </Text>
              <Text fontSize="md" fontWeight="bold" color="cirqueira.spotify.azul">
                +{artistasDescobertosNoMes}
              </Text>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                Artistas que você ouviu pela primeira vez
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.spotify.cartao"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
          _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(30, 215, 96, 0.15)"
              color="cirqueira.spotify.verde"
            >
              <Award size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Média Diária no Mês
              </Text>
              <HStack gap={2}>
                <Text fontSize="md" fontWeight="bold" color="cirqueira.spotify.verde">
                  {formatarMinutosParaHorasEMinutos(mediaMinutosDiarios)}
                </Text>
                {variacaoMediaDiariaPercentual !== null && (
                  <Box
                    px={1.5}
                    py={0.5}
                    borderRadius="md"
                    bg={
                      variacaoMediaDiariaPercentual >= 0
                        ? 'rgba(30, 215, 96, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)'
                    }
                    color={
                      variacaoMediaDiariaPercentual >= 0 ? 'cirqueira.spotify.verde' : 'red.400'
                    }
                    fontSize="2xs"
                    fontWeight="bold"
                  >
                    {formatarPercentualVariacao(variacaoMediaDiariaPercentual)}
                  </Box>
                )}
              </HStack>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                Comparado ao ritmo do mês anterior
              </Text>
            </VStack>
          </HStack>
        </Box>
      </SimpleGrid>
    </VStack>
  )
})
