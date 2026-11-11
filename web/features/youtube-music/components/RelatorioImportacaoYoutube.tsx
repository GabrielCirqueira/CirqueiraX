import { SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import type { ImportacaoYoutube } from '../types'
import { formatarDolares, formatarNumero, formatarPeriodoCoberto } from '../utils'

export interface RelatorioImportacaoYoutubeProps {
  importacao: ImportacaoYoutube
}

export const RelatorioImportacaoYoutube = memo(function RelatorioImportacaoYoutube({
  importacao,
}: RelatorioImportacaoYoutubeProps) {
  const relatorio = importacao.relatorio
  const itens = [
    {
      rotulo: 'Reproduções lidas',
      valor: formatarNumero(relatorio?.reproducoesLidas ?? importacao.leitura.totalLidos),
    },
    { rotulo: 'Músicas', valor: formatarNumero(relatorio?.musicas ?? 0) },
    { rotulo: 'Mashups', valor: formatarNumero(relatorio?.mashups ?? 0) },
    { rotulo: 'Compilações', valor: formatarNumero(relatorio?.compilacoes ?? 0) },
    { rotulo: 'Não é música', valor: formatarNumero(relatorio?.naoMusica ?? 0) },
    {
      rotulo: 'A revisar',
      valor: formatarNumero((relatorio?.revisar ?? 0) + (relatorio?.pendentes ?? 0)),
    },
    { rotulo: 'Indisponíveis', valor: formatarNumero(relatorio?.indisponiveis ?? 0) },
    { rotulo: 'Custo', valor: formatarDolares(importacao.classificacao.custoRealUsd) },
  ]

  return (
    <VStack align="stretch" gap={3}>
      <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
        Período coberto:{' '}
        {formatarPeriodoCoberto(
          importacao.leitura.primeiraReproducaoEm,
          importacao.leitura.ultimaReproducaoEm
        )}
      </Text>
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={2}>
        {itens.map((item) => (
          <VStack
            key={item.rotulo}
            align="start"
            gap={0}
            p={3}
            borderRadius="8px"
            bg="cirqueira.musica.cartaoElevado"
          >
            <Text fontSize="lg" fontWeight="black" color="cirqueira.musica.textoPrincipal">
              {item.valor}
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
              {item.rotulo}
            </Text>
          </VStack>
        ))}
      </SimpleGrid>
    </VStack>
  )
})
