import { Badge, Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { Flag, Lightbulb, Snail, Volume2 } from 'lucide-react'
import { memo, useState } from 'react'
import type { FalaIngles } from '../hooks'
import type { AnalisePronuncia, ModoPronuncia, PalavraPronunciada } from '../types'
import { VELOCIDADE_LENTA, VELOCIDADE_NORMAL, palavrasDaSentenca } from '../utils'
import { SilabasDestacadas } from './SilabasDestacadas'

const COR_ORIGEM: Record<PalavraPronunciada['origem'], string> = {
  excecao: 'green',
  dicionario: 'gray',
  derivada: 'blue',
  aproximada: 'orange',
}

export interface PalavrasPronunciadasProps {
  analise: AnalisePronuncia
  fala: FalaIngles
  modo?: ModoPronuncia
  onReportarPalavra?: (palavra: string) => void
}

export const PalavrasPronunciadas = memo(function PalavrasPronunciadas({
  analise,
  fala,
  modo = 'clara',
  onReportarPalavra,
}: PalavrasPronunciadasProps) {
  const simples = modo === 'simples'
  const palavras = analise.sentencas.flatMap(palavrasDaSentenca)
  const [selecionada, setSelecionada] = useState<number | null>(null)
  const detalhe = selecionada === null ? null : (palavras[selecionada] ?? null)

  return (
    <VStack align="stretch" gap={3}>
      <HStack justify="space-between">
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="0.06em"
        >
          Palavra por palavra
        </Text>
        <Text fontSize="xs" color="fg.subtle">
          Toque numa palavra para ver dicas e ouvir
        </Text>
      </HStack>

      <Flex gap={2} wrap="wrap">
        {palavras.map((palavra, indice) => {
          const ativa = indice === selecionada
          return (
            <Box
              as="button"
              key={`${palavra.chave}-${indice}`}
              onClick={() => setSelecionada(ativa ? null : indice)}
              textAlign="left"
              px={2.5}
              py={1.5}
              borderRadius="10px"
              borderWidth="1px"
              borderColor={
                ativa
                  ? 'cirqueira.brand.400'
                  : palavra.aproximada
                    ? 'cirqueira.orange.400/50'
                    : 'border.subtle'
              }
              bg={ativa ? 'cirqueira.brand.500/10' : 'bg.subtle'}
              opacity={palavra.funcional && !ativa ? 0.75 : 1}
              transition="all 0.15s"
              _hover={{ borderColor: 'cirqueira.brand.400/70', transform: 'translateY(-1px)' }}
            >
              <Text fontSize="2xs" color="fg.subtle" lineHeight="1.2">
                {palavra.texto}
              </Text>
              {simples ? (
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  {palavra.simples || palavra.figurada}
                </Text>
              ) : (
                <SilabasDestacadas silabas={palavra.silabas} tonica={palavra.tonica} />
              )}
            </Box>
          )
        })}
      </Flex>

      {detalhe && (
        <Box
          borderWidth="1px"
          borderColor="cirqueira.brand.400/40"
          bg="cirqueira.brand.500/5"
          borderRadius="12px"
          p={4}
          animation="fade-in 0.2s ease-out"
        >
          <Flex justify="space-between" gap={3} wrap="wrap" align="flex-start">
            <VStack align="start" gap={1}>
              <HStack gap={2}>
                <Text fontSize="lg" fontWeight="bold" color="fg">
                  {detalhe.texto}
                </Text>
                <Badge
                  size="sm"
                  variant="subtle"
                  colorPalette={COR_ORIGEM[detalhe.origem]}
                  borderRadius="full"
                >
                  {detalhe.origemDescricao}
                </Badge>
              </HStack>
              {simples && (
                <Text fontSize="2xl" fontWeight="bold" color="cirqueira.brand.300">
                  {detalhe.simples || detalhe.figurada}
                </Text>
              )}
              <SilabasDestacadas
                silabas={detalhe.silabas}
                tonica={detalhe.tonica}
                tamanho={simples ? 'sm' : '2xl'}
              />
              {detalhe.tonica !== null && detalhe.silabas.length > 1 && (
                <Text fontSize="xs" color="fg.subtle">
                  Força na {detalhe.tonica + 1}ª sílaba: {detalhe.silabas[detalhe.tonica]}
                </Text>
              )}
            </VStack>
            <HStack gap={1.5}>
              <Button
                size="xs"
                variant="subtle"
                colorPalette="brand"
                borderRadius="full"
                disabled={!fala.suportado}
                onClick={() =>
                  fala.falar(detalhe.texto, {
                    id: `palavra-${detalhe.chave}`,
                    velocidade: VELOCIDADE_NORMAL,
                  })
                }
              >
                <Volume2 size={13} />
                Ouvir
              </Button>
              <Button
                size="xs"
                variant="outline"
                borderRadius="full"
                disabled={!fala.suportado}
                onClick={() =>
                  fala.falar(detalhe.texto, {
                    id: `palavra-lenta-${detalhe.chave}`,
                    velocidade: VELOCIDADE_LENTA,
                  })
                }
              >
                <Snail size={13} />
                Devagar
              </Button>
              {onReportarPalavra && (
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="fg.muted"
                  onClick={() => onReportarPalavra(detalhe.chave)}
                >
                  <Flag size={13} />
                  Está errada
                </Button>
              )}
            </HStack>
          </Flex>

          {detalhe.dicas.length > 0 && (
            <VStack align="stretch" gap={1.5} mt={3}>
              {detalhe.dicas.map((dica) => (
                <HStack key={dica} gap={2} align="flex-start" fontSize="sm" color="fg.muted">
                  <Box color="cirqueira.yellow.400" pt="2px" flexShrink={0}>
                    <Lightbulb size={14} />
                  </Box>
                  <Text>{dica}</Text>
                </HStack>
              ))}
            </VStack>
          )}
        </Box>
      )}
    </VStack>
  )
})
