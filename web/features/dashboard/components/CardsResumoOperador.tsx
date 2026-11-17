import { Box, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, CheckCircle2, Clock3, HardDrive } from 'lucide-react'
import { memo } from 'react'
import type { ResumoDashboard } from '../types'
import { calcularResumoPipeline } from '../utils/metricasDashboard'

export interface CardsResumoOperadorProps {
  resumo?: ResumoDashboard
  carregando?: boolean
}

export const CardsResumoOperador = memo(function CardsResumoOperador({
  resumo,
  carregando = false,
}: CardsResumoOperadorProps) {
  if (carregando) {
    return (
      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={3}>
        {[0, 1, 2, 3].map((indice) => (
          <Skeleton key={indice} h="96px" borderRadius="xl" />
        ))}
      </SimpleGrid>
    )
  }

  const pipeline = calcularResumoPipeline(resumo)
  const pendentes = pipeline.emProcessamento + pipeline.semCategoria

  const cartoes = [
    {
      rotulo: 'Suas mídias',
      valor: String(pipeline.total),
      detalhe: resumo?.tamanhoTotalFormatado ?? '0 B',
      icone: HardDrive,
      cor: 'cirqueira.brand.400',
    },
    {
      rotulo: 'Concluídas',
      valor: String(pipeline.concluidos),
      detalhe: `${pipeline.taxaConclusao}% do total`,
      icone: CheckCircle2,
      cor: 'cirqueira.green.400',
    },
    {
      rotulo: 'Em andamento',
      valor: String(pendentes),
      detalhe: pendentes === 0 ? 'Nada na fila' : 'Aguardando processamento',
      icone: Clock3,
      cor: pendentes > 0 ? 'cirqueira.amber.400' : 'fg.subtle',
    },
    {
      rotulo: 'Com erro',
      valor: String(resumo?.totalErros ?? 0),
      detalhe: (resumo?.totalErros ?? 0) === 0 ? 'Tudo certo' : 'Precisa de atenção',
      icone: AlertTriangle,
      cor: (resumo?.totalErros ?? 0) > 0 ? 'cirqueira.red.400' : 'fg.subtle',
    },
  ]

  return (
    <SimpleGrid columns={{ base: 2, lg: 4 }} gap={3}>
      {cartoes.map((cartao) => {
        const Icone = cartao.icone
        return (
          <Box
            key={cartao.rotulo}
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
          >
            <VStack align="start" gap={3}>
              <Box color={cartao.cor} display="inline-flex">
                <Icone size={18} />
              </Box>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                  {cartao.rotulo}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="fg" letterSpacing="tight">
                  {cartao.valor}
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  {cartao.detalhe}
                </Text>
              </VStack>
            </VStack>
          </Box>
        )
      })}
    </SimpleGrid>
  )
})
