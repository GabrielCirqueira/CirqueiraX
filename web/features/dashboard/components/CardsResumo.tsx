import { Box, HStack, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, CheckCircle2, Clock3, HardDrive } from 'lucide-react'
import { memo } from 'react'
import type { ResumoDashboard } from '../types'
import { calcularResumoPipeline, pluralizar } from '../utils/metricasDashboard'

export interface CardsResumoProps {
  resumo?: ResumoDashboard
  carregando?: boolean
  onSelecionarAba?: (aba: string) => void
}

export const CardsResumo = memo(function CardsResumo({
  resumo,
  carregando = false,
  onSelecionarAba,
}: CardsResumoProps) {
  if (carregando) {
    return (
      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={3}>
        {[0, 1, 2, 3].map((indice) => (
          <Skeleton key={indice} h="96px" borderRadius="8px" />
        ))}
      </SimpleGrid>
    )
  }

  const pipeline = calcularResumoPipeline(resumo)
  const pendentes = pipeline.emProcessamento + pipeline.semCategoria

  const cartoes = [
    {
      rotulo: 'Total de mídias',
      valor: String(pipeline.total),
      detalhe: `${resumo?.tamanhoTotalFormatado ?? '0 B'} em disco`,
      icone: HardDrive,
      cor: 'cirqueira.brand.400',
      bgIcone: 'cirqueira.brand.500/12',
    },
    {
      rotulo: 'Concluídas',
      valor: String(pipeline.concluidos),
      detalhe: `${pipeline.taxaConclusao}% do acervo total`,
      icone: CheckCircle2,
      cor: 'cirqueira.green.400',
      bgIcone: 'cirqueira.green.500/12',
    },
    {
      rotulo: 'Em processamento',
      valor: String(pendentes),
      detalhe:
        pendentes === 0
          ? 'Fila vazia'
          : `${pipeline.emProcessamento} em execução · ${pipeline.semCategoria} sem cat.`,
      icone: Clock3,
      cor: pendentes > 0 ? 'cirqueira.amber.400' : 'fg.subtle',
      bgIcone: pendentes > 0 ? 'cirqueira.amber.500/12' : 'bg.muted',
      onClick: () => onSelecionarAba?.('categorias'),
    },
    {
      rotulo: 'Erros',
      valor: String(pipeline.erros),
      detalhe:
        pipeline.erros > 0
          ? `${pluralizar(pipeline.erros, 'falha', 'falhas')} para revisar`
          : 'Nenhuma falha',
      icone: AlertTriangle,
      cor: pipeline.erros > 0 ? 'cirqueira.red.400' : 'fg.subtle',
      bgIcone: pipeline.erros > 0 ? 'cirqueira.red.500/12' : 'bg.muted',
      onClick: () => onSelecionarAba?.('erros'),
    },
  ]

  return (
    <SimpleGrid columns={{ base: 2, lg: 4 }} gap={3}>
      {cartoes.map((cartao) => (
        <HStack
          key={cartao.rotulo}
          align="start"
          gap={3.5}
          p={{ base: 3.5, md: 4.5 }}
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="8px"
          cursor={cartao.onClick ? 'pointer' : 'default'}
          transition="all 0.2s ease"
          _hover={{
            bg: 'bg.muted',
            borderColor: 'border.emphasized',
            transform: 'translateY(-1px)',
            shadow: 'sm',
          }}
          onClick={cartao.onClick}
        >
          <Box
            p={2.5}
            borderRadius="8px"
            bg={cartao.bgIcone}
            color={cartao.cor}
            display={{ base: 'none', sm: 'inline-flex' }}
            flexShrink={0}
          >
            <cartao.icone size={20} strokeWidth={2.2} />
          </Box>
          <VStack align="start" gap={0.5} minW={0}>
            <Text
              fontSize="11px"
              fontWeight="semibold"
              color="fg.subtle"
              letterSpacing="wide"
              textTransform="uppercase"
            >
              {cartao.rotulo}
            </Text>
            <Text
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="black"
              color="fg"
              lineHeight="short"
              truncate
            >
              {cartao.valor}
            </Text>
            <Text fontSize="11px" color="fg.muted" lineClamp={1}>
              {cartao.detalhe}
            </Text>
          </VStack>
        </HStack>
      ))}
    </SimpleGrid>
  )
})
