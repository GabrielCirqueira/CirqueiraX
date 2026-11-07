import { Box, HStack, Text, VStack } from '@chakra-ui/react'
import type { LucideIcon } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import { type TomMetrica, corTextoDoTom } from '../utils/metricasDashboard'

interface PainelDashboardProps {
  titulo?: string
  descricao?: string
  acao?: ReactNode
  icone?: LucideIcon
  semEspacamento?: boolean
  children: ReactNode
}

export const PainelDashboard = memo(function PainelDashboard({
  titulo,
  descricao,
  acao,
  icone: Icone,
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
      borderRadius="8px"
      shadow="sm"
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
          <HStack gap={3} align="center" minW={0}>
            {Icone && (
              <Box
                p={2}
                borderRadius="8px"
                bg="cirqueira.brand.500/12"
                color="cirqueira.brand.400"
                display="inline-flex"
                flexShrink={0}
              >
                <Icone size={18} strokeWidth={2.2} />
              </Box>
            )}
            <VStack align="flex-start" gap={0.5} minW={0}>
              <Text fontSize="sm" fontWeight="bold" color="fg" letterSpacing="tight">
                {titulo}
              </Text>
              {descricao && (
                <Text fontSize="xs" color="fg.subtle">
                  {descricao}
                </Text>
              )}
            </VStack>
          </HStack>
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
  icone?: LucideIcon
  onClick?: () => void
}

export const IndicadorMetrica = memo(function IndicadorMetrica({
  rotulo,
  valor,
  detalhe,
  tom = 'neutro',
  icone: Icone,
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
      transition="background 0.15s ease"
      _hover={onClick ? { bg: 'bg.muted' } : undefined}
      onClick={onClick}
    >
      <HStack gap={2} align="center">
        {Icone && (
          <Box color="fg.subtle">
            <Icone size={13} strokeWidth={2.2} />
          </Box>
        )}
        <Text
          fontSize="11px"
          fontWeight="semibold"
          color="fg.subtle"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {rotulo}
        </Text>
      </HStack>
      <Text
        fontSize={{ base: 'xl', md: '2xl' }}
        fontWeight="black"
        letterSpacing="tight"
        lineHeight="1.2"
        color={corTextoDoTom(tom)}
      >
        {valor}
      </Text>
      {detalhe && (
        <Text fontSize="11px" color="fg.muted" lineClamp={1}>
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
    <HStack w="full" h="6px" gap={0} borderRadius="full" bg="bg.muted" overflow="hidden">
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
