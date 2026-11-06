import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { Crown } from 'lucide-react'
import { memo, useState } from 'react'
import type { MesNoTopo, PontoMensal } from '../types'
import { formatarRotuloMesCurto, preencherMesesEntre } from '../utils'
import { GraficoMensalSpotify } from './GraficoMensalSpotify'

export interface PainelEvolucaoDetalheProps {
  evolucao: PontoMensal[]
  mesesNoTopo: MesNoTopo[]
  descricaoTopo: string
}

export const PainelEvolucaoDetalhe = memo(function PainelEvolucaoDetalhe({
  evolucao,
  mesesNoTopo,
  descricaoTopo,
}: PainelEvolucaoDetalheProps) {
  const [metrica, setMetrica] = useState<'minutos' | 'streams'>('streams')
  const pontos = preencherMesesEntre(evolucao)

  return (
    <VStack
      align="stretch"
      gap={4}
      p={{ base: 3, sm: 5 }}
      borderRadius="8px"
      bg="cirqueira.spotify.cartao"
      border="1px solid"
      borderColor="cirqueira.spotify.cartaoElevado"
    >
      <Flex justify="space-between" align="center" gap={3} wrap="wrap">
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wide"
          color="cirqueira.spotify.amarelo"
        >
          Evolução mês a mês
        </Text>
        <HStack gap={1} p={0.5} borderRadius="full" bg="cirqueira.spotify.cartaoElevado">
          {(['streams', 'minutos'] as const).map((opcao) => (
            <Button
              key={opcao}
              size="2xs"
              px={3}
              borderRadius="full"
              bg={metrica === opcao ? 'cirqueira.spotify.cartao' : 'transparent'}
              color={
                metrica === opcao
                  ? 'cirqueira.spotify.textoPrincipal'
                  : 'cirqueira.spotify.textoSecundario'
              }
              onClick={() => setMetrica(opcao)}
            >
              {opcao === 'streams' ? 'Streams' : 'Minutos'}
            </Button>
          ))}
        </HStack>
      </Flex>

      <GraficoMensalSpotify
        pontos={pontos}
        metrica={metrica}
        destacarUltimo={false}
        altura="220px"
      />

      <VStack align="stretch" gap={2}>
        <HStack gap={1.5} color="cirqueira.spotify.amarelo">
          <Crown size={13} />
          <Text fontSize="xs" fontWeight="bold">
            {mesesNoTopo.length > 0
              ? `${mesesNoTopo.length} ${mesesNoTopo.length === 1 ? 'mês' : 'meses'} no seu top 5`
              : `Ainda não entrou no seu top 5 ${descricaoTopo}`}
          </Text>
        </HStack>
        {mesesNoTopo.length > 0 && (
          <Flex gap={1.5} wrap="wrap">
            {mesesNoTopo.map((mes) => (
              <Box
                key={`${mes.ano}-${mes.mes}`}
                px={2}
                py={1}
                borderRadius="md"
                fontSize="2xs"
                fontWeight="bold"
                bg={
                  mes.posicao === 1
                    ? 'cirqueira.spotify.amarelo'
                    : 'cirqueira.spotify.cartaoElevado'
                }
                color={
                  mes.posicao === 1
                    ? 'cirqueira.spotify.fundo'
                    : 'cirqueira.spotify.textoSecundario'
                }
              >
                {formatarRotuloMesCurto(mes)} · #{mes.posicao}
              </Box>
            ))}
          </Flex>
        )}
      </VStack>
    </VStack>
  )
})
