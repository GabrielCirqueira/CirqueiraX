import { Box, HStack, Text, VStack } from '@chakra-ui/react'
import { type ReactNode, memo } from 'react'
import { type TomMetrica, corTextoDoTom } from '../utils/metricasDashboard'

interface PainelDashboardProps {
  titulo?: string
  descricao?: string
  acao?: ReactNode
  semEspacamento?: boolean
  children: ReactNode
}

export const PainelDashboard = memo(function PainelDashboard({
  titulo,
  descricao,
  acao,
  semEspacamento = false,
  children,
}: PainelDashboardProps) {
  return (
    <Box
      w="full"
      minW={0}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      overflow="hidden"
    >
      {titulo && (
        <HStack
          justify="space-between"
          align="center"
          gap={3}
          px={5}
          pt={4}
          pb={semEspacamento ? 4 : 0}
        >
          <VStack align="flex-start" gap={0.5} minW={0}>
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              {titulo}
            </Text>
            {descricao && (
              <Text fontSize="xs" color="fg.subtle">
                {descricao}
              </Text>
            )}
          </VStack>
          {acao}
        </HStack>
      )}
      <Box p={semEspacamento ? 0 : 5}>{children}</Box>
    </Box>
  )
})

interface IndicadorMetricaProps {
  rotulo: string
  valor: ReactNode
  detalhe?: ReactNode
  tom?: TomMetrica
  onClick?: () => void
}

export const IndicadorMetrica = memo(function IndicadorMetrica({
  rotulo,
  valor,
  detalhe,
  tom = 'neutro',
  onClick,
}: IndicadorMetricaProps) {
  return (
    <VStack
      align="flex-start"
      gap={1}
      p={5}
      minW={0}
      bg="bg.panel"
      cursor={onClick ? 'pointer' : 'default'}
      transition="background 0.15s"
      _hover={onClick ? { bg: 'bg.muted' } : undefined}
      onClick={onClick}
    >
      <Text fontSize="xs" color="fg.subtle">
        {rotulo}
      </Text>
      <Text
        fontSize="2xl"
        fontWeight="semibold"
        letterSpacing="tight"
        lineHeight="1.2"
        color={corTextoDoTom(tom)}
      >
        {valor}
      </Text>
      {detalhe && (
        <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
          {detalhe}
        </Text>
      )}
    </VStack>
  )
})

interface BarraProporcaoProps {
  segmentos: { percentual: number; cor: string }[]
}

export const BarraProporcao = memo(function BarraProporcao({ segmentos }: BarraProporcaoProps) {
  return (
    <HStack w="full" h="4px" gap={0} borderRadius="full" bg="bg.muted" overflow="hidden">
      {segmentos.map((segmento) => (
        <Box
          key={segmento.cor}
          h="full"
          w={`${Math.min(segmento.percentual, 100)}%`}
          bg={segmento.cor}
          transition="width 0.4s ease"
        />
      ))}
    </HStack>
  )
})
