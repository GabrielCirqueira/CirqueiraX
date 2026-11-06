import { Box, Flex, HStack, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { memo, useState } from 'react'
import { useEvolucaoMensalSpotify } from '../hooks'
import {
  type OpcaoPeriodoAnalise,
  formatarMinutosParaHorasEMinutos,
  formatarNomeMes,
} from '../utils'
import { CabecalhoSecaoSpotify } from './CabecalhoSecaoSpotify'
import { GraficoMensalSpotify } from './GraficoMensalSpotify'
import { SeletorPeriodoAnalise } from './SeletorPeriodoAnalise'

const OPCOES_JANELA: OpcaoPeriodoAnalise[] = [
  { chave: '12', rotulo: '12 meses', filtro: { periodo: 'todos' } },
  { chave: '24', rotulo: '24 meses', filtro: { periodo: 'todos' } },
  { chave: '60', rotulo: '5 anos', filtro: { periodo: 'todos' } },
]

export interface SecaoEvolucaoMensalProps {
  habilitado: boolean
}

export const SecaoEvolucaoMensal = memo(function SecaoEvolucaoMensal({
  habilitado,
}: SecaoEvolucaoMensalProps) {
  const [janela, setJanela] = useState('12')
  const { data, isLoading } = useEvolucaoMensalSpotify(Number(janela), habilitado)
  const pontosVisiveis = (() => {
    const meses = data?.meses ?? []
    const primeiroComDados = meses.findIndex((ponto) => ponto.minutos > 0)
    return primeiroComDados <= 0 ? meses : meses.slice(primeiroComDados)
  })()

  return (
    <VStack align="stretch" gap={4} w="full">
      <CabecalhoSecaoSpotify
        titulo="Evolução por Mês"
        descricao="Minutos ouvidos mês a mês, com o mês atual em verde"
        acoes={
          <SeletorPeriodoAnalise
            opcoes={OPCOES_JANELA}
            selecionada={janela}
            onSelecionar={setJanela}
          />
        }
      />

      <Box
        p={{ base: 3, sm: 5 }}
        bg="cirqueira.spotify.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="cirqueira.spotify.cartaoElevado"
      >
        {isLoading || !data ? (
          <Skeleton h="240px" borderRadius="8px" />
        ) : (
          <VStack align="stretch" gap={5}>
            <GraficoMensalSpotify pontos={pontosVisiveis} mostrarMedia />
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
              <BlocoComparacao
                rotulo={`${formatarNomeMes(data.comparacao.mes)} até dia ${data.comparacao.diaAtual}`}
                valor={data.comparacao.minutosMesAtual}
                destaque
              />
              <BlocoComparacao
                rotulo={`Mês passado até dia ${data.comparacao.diaAtual}`}
                valor={data.comparacao.minutosMesAnteriorAteMesmoDia}
                variacao={data.comparacao.variacaoMesAnterior}
              />
              <BlocoComparacao
                rotulo={`${formatarNomeMes(data.comparacao.mes)} de ${data.comparacao.ano - 1} até dia ${data.comparacao.diaAtual}`}
                valor={data.comparacao.minutosMesmoMesAnoAnteriorAteMesmoDia}
                variacao={data.comparacao.variacaoAnoAnterior}
                rodape={
                  data.comparacao.minutosMesmoMesAnoAnterior > 0
                    ? `No mês inteiro: ${formatarMinutosParaHorasEMinutos(data.comparacao.minutosMesmoMesAnoAnterior)}`
                    : undefined
                }
              />
            </SimpleGrid>
          </VStack>
        )}
      </Box>
    </VStack>
  )
})

interface BlocoComparacaoProps {
  rotulo: string
  valor: number
  variacao?: number | null
  destaque?: boolean
  rodape?: string
}

function BlocoComparacao({ rotulo, valor, variacao, destaque, rodape }: BlocoComparacaoProps) {
  const subiu = (variacao ?? 0) >= 0
  return (
    <VStack
      align="flex-start"
      gap={1}
      p={3}
      borderRadius="8px"
      bg="cirqueira.spotify.cartaoElevado"
      border="1px solid"
      borderColor={destaque ? 'cirqueira.spotify.verde' : 'transparent'}
    >
      <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario" textTransform="uppercase">
        {rotulo}
      </Text>
      <Flex align="center" gap={2} wrap="wrap">
        <Text
          fontSize="lg"
          fontWeight="bold"
          color={destaque ? 'cirqueira.spotify.verde' : 'cirqueira.spotify.textoPrincipal'}
        >
          {formatarMinutosParaHorasEMinutos(valor)}
        </Text>
        {variacao !== undefined && variacao !== null && (
          <HStack
            gap={1}
            px={1.5}
            py={0.5}
            borderRadius="md"
            fontSize="2xs"
            fontWeight="bold"
            color={subiu ? 'cirqueira.spotify.verde' : 'red.400'}
            bg="cirqueira.spotify.fundo"
          >
            {subiu ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <Text as="span">
              {subiu ? '+' : '−'}
              {Math.abs(variacao)}% agora
            </Text>
          </HStack>
        )}
      </Flex>
      {rodape && (
        <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
          {rodape}
        </Text>
      )}
    </VStack>
  )
}
