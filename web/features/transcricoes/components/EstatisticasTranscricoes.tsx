import { Box, HStack, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { CheckCircle2, Clock3, FileText, Hourglass, type LucideIcon } from 'lucide-react'
import { memo } from 'react'
import type { ResumoTranscricoes } from '../types'
import {
  formatarDuracaoExtensa,
  formatarNumero,
  formatarTempoLeitura,
  formatarTempoRestante,
} from '../utils'

interface CartaoEstatistica {
  rotulo: string
  valor: string
  detalhe: string
  icone: LucideIcon
  paleta: string
}

function montarCartoes(resumo: ResumoTranscricoes): CartaoEstatistica[] {
  const emAndamento = resumo.naFila + resumo.transcrevendo
  return [
    {
      rotulo: 'Transcrições',
      valor: formatarNumero(resumo.total),
      detalhe: `${resumo.concluidas} prontas${resumo.comErro > 0 ? ` · ${resumo.comErro} com erro` : ''}`,
      icone: CheckCircle2,
      paleta: 'green',
    },
    {
      rotulo: 'Áudio transcrito',
      valor: formatarDuracaoExtensa(resumo.segundosTranscritos),
      detalhe: `${resumo.favoritas} ${resumo.favoritas === 1 ? 'favorita' : 'favoritas'}`,
      icone: Clock3,
      paleta: 'brand',
    },
    {
      rotulo: 'Palavras',
      valor: formatarNumero(resumo.totalPalavras),
      detalhe:
        resumo.totalPalavras > 0
          ? formatarTempoLeitura(resumo.totalPalavras)
          : 'Nada transcrito ainda',
      icone: FileText,
      paleta: 'purple',
    },
    {
      rotulo: 'Fila',
      valor: emAndamento > 0 ? `${emAndamento} ${emAndamento === 1 ? 'áudio' : 'áudios'}` : 'Livre',
      detalhe:
        emAndamento > 0
          ? `Termina em ${formatarTempoRestante(resumo.segundosRestantesEstimados) ?? 'instantes'}`
          : 'Pronta para novos áudios',
      icone: Hourglass,
      paleta: 'amber',
    },
  ]
}

export interface EstatisticasTranscricoesProps {
  resumo: ResumoTranscricoes | undefined
}

export const EstatisticasTranscricoes = memo(function EstatisticasTranscricoes({
  resumo,
}: EstatisticasTranscricoesProps) {
  if (!resumo) {
    return (
      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={3}>
        {[0, 1, 2, 3].map((indice) => (
          <Skeleton key={indice} h="88px" borderRadius="xl" />
        ))}
      </SimpleGrid>
    )
  }

  return (
    <SimpleGrid columns={{ base: 2, lg: 4 }} gap={3}>
      {montarCartoes(resumo).map((cartao) => (
        <HStack
          key={cartao.rotulo}
          align="start"
          gap={3}
          p={{ base: 3, md: 4 }}
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="xl"
          transition="all 0.2s ease"
          _hover={{ borderColor: 'border.emphasized', transform: 'translateY(-1px)', shadow: 'sm' }}
        >
          <Box
            p={2}
            borderRadius="lg"
            bg={`cirqueira.${cartao.paleta}.500/12`}
            color={`cirqueira.${cartao.paleta}.500`}
            display={{ base: 'none', sm: 'inline-flex' }}
          >
            <cartao.icone size={18} />
          </Box>
          <VStack align="start" gap={0} minW={0}>
            <Text
              fontSize="11px"
              fontWeight="semibold"
              color="fg.subtle"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              {cartao.rotulo}
            </Text>
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
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
