import { Box, HStack, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Award, Calendar, Clock, Flame, Repeat, Sparkles, UserPlus } from 'lucide-react'
import { memo } from 'react'
import type { CuriosidadesMusica } from '../types'
import { formatarDataPtBr, formatarPercentualVariacao } from '../utils'
import { MinutosMusica } from './MinutosMusica'

export interface SecaoCuriosidadesProps {
  curiosidades?: CuriosidadesMusica
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
        color="cirqueira.musica.amarelo"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        Curiosidades e Padrões de Audição
      </Heading>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.musica.cartao"
          border="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(254, 228, 79, 0.15)"
              color="cirqueira.musica.amarelo"
            >
              <Clock size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
              >
                Horário de Pico
              </Text>
              <Text fontSize="md" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                {horarioPico ?? '—'}
              </Text>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                {minutosHorarioPico > 0 ? (
                  <MinutosMusica minutos={minutosHorarioPico} sufixo="ouvidos neste horário" />
                ) : (
                  'Sem dados suficientes'
                )}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.musica.cartao"
          border="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(83, 157, 245, 0.15)"
              color="cirqueira.musica.azul"
            >
              <Calendar size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
              >
                Dia Mais Frequente
              </Text>
              <Text fontSize="md" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                {diaSemanaMaisOuvido ?? '—'}
              </Text>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                {minutosDiaSemana > 0 ? (
                  <MinutosMusica minutos={minutosDiaSemana} sufixo="acumulados" />
                ) : (
                  'Sem dados suficientes'
                )}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.musica.cartao"
          border="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(30, 215, 96, 0.15)"
              color="cirqueira.musica.verde"
            >
              <Flame size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
              >
                Dia Mais Longo
              </Text>
              <Text fontSize="md" fontWeight="bold" color="cirqueira.musica.verde">
                {diaMaisLongoMinutos > 0 ? <MinutosMusica minutos={diaMaisLongoMinutos} /> : '—'}
              </Text>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                {diaMaisLongoData ? `Em ${formatarDataPtBr(diaMaisLongoData)}` : 'Sem registros'}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.musica.cartao"
          border="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(254, 228, 79, 0.15)"
              color="cirqueira.musica.amarelo"
            >
              <Repeat size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
              >
                Faixa Mais Repetida em 1 Dia
              </Text>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="cirqueira.musica.textoPrincipal"
                truncate
                maxW="full"
              >
                {faixaMaisRepetidaNome ?? '—'}
              </Text>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
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
          bg="cirqueira.musica.cartao"
          border="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(83, 157, 245, 0.15)"
              color="cirqueira.musica.azul"
            >
              <UserPlus size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
              >
                Novos Artistas no Mês
              </Text>
              <Text fontSize="md" fontWeight="bold" color="cirqueira.musica.azul">
                +{artistasDescobertosNoMes}
              </Text>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                Artistas que você ouviu pela primeira vez
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={4}
          borderRadius="8px"
          bg="cirqueira.musica.cartao"
          border="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          transition="all 0.15s ease"
        >
          <HStack gap={3} align="flex-start">
            <Box
              p={2}
              borderRadius="full"
              bg="rgba(30, 215, 96, 0.15)"
              color="cirqueira.musica.verde"
            >
              <Award size={18} />
            </Box>
            <VStack align="flex-start" gap={0.5} flex={1}>
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                textTransform="uppercase"
              >
                Média Diária no Mês
              </Text>
              <HStack gap={2}>
                <Text fontSize="md" fontWeight="bold" color="cirqueira.musica.verde">
                  <MinutosMusica minutos={mediaMinutosDiarios} />
                </Text>
                {variacaoMediaDiariaPercentual !== null && (
                  <Box
                    px={1.5}
                    py={0.5}
                    borderRadius="8px"
                    bg={
                      variacaoMediaDiariaPercentual >= 0
                        ? 'rgba(30, 215, 96, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)'
                    }
                    color={
                      variacaoMediaDiariaPercentual >= 0 ? 'cirqueira.musica.verde' : 'red.400'
                    }
                    fontSize="2xs"
                    fontWeight="bold"
                  >
                    {formatarPercentualVariacao(variacaoMediaDiariaPercentual)}
                  </Box>
                )}
              </HStack>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                Comparado ao ritmo do mês anterior
              </Text>
            </VStack>
          </HStack>
        </Box>
      </SimpleGrid>
    </VStack>
  )
})
