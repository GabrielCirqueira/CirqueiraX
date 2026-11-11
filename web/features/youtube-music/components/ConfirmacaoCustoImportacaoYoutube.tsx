import { Button, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import { useCancelarClassificacaoYoutube, useConfirmarImportacaoYoutube } from '../hooks'
import type { ImportacaoYoutube } from '../types'
import { formatarDolares, formatarNumero } from '../utils'

export interface ConfirmacaoCustoImportacaoYoutubeProps {
  importacao: ImportacaoYoutube
}

export const ConfirmacaoCustoImportacaoYoutube = memo(function ConfirmacaoCustoImportacaoYoutube({
  importacao,
}: ConfirmacaoCustoImportacaoYoutubeProps) {
  const confirmar = useConfirmarImportacaoYoutube()
  const cancelar = useCancelarClassificacaoYoutube()
  const ocupado = confirmar.isPending || cancelar.isPending
  const numeros = [
    { rotulo: 'Reproduções lidas', valor: formatarNumero(importacao.leitura.totalLidos) },
    { rotulo: 'Vídeos novos', valor: formatarNumero(importacao.leitura.totalVideosNovos) },
    { rotulo: 'Resolvidos sem IA', valor: formatarNumero(importacao.previa.semIa) },
    { rotulo: 'Para a IA', valor: formatarNumero(importacao.previa.paraIa) },
  ]

  return (
    <VStack align="stretch" gap={4}>
      <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
        O custo estimado passou do limite automático. Nada é enviado à IA sem a sua confirmação.
      </Text>
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={2}>
        {numeros.map((item) => (
          <VStack
            key={item.rotulo}
            align="start"
            gap={0}
            p={3}
            borderRadius="8px"
            bg="cirqueira.musica.cartaoElevado"
          >
            <Text fontSize="lg" fontWeight="black">
              {item.valor}
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
              {item.rotulo}
            </Text>
          </VStack>
        ))}
      </SimpleGrid>
      <Text fontSize="md" fontWeight="bold" color="cirqueira.musica.amarelo">
        Custo estimado: {formatarDolares(importacao.previa.custoEstimadoUsd)}
      </Text>
      <Text fontSize="xs" color="cirqueira.musica.textoDesabilitado">
        Se cancelar, as reproduções continuam guardadas e os vídeos sem identificação vão para a
        fila de revisão.
      </Text>
      <HStack gap={3} justify="flex-end" wrap="wrap">
        <Button
          variant="ghost"
          borderRadius="full"
          color="cirqueira.musica.textoSecundario"
          onClick={() => cancelar.mutate(importacao.uuid)}
          loading={cancelar.isPending}
          disabled={ocupado}
        >
          Cancelar
        </Button>
        <Button
          borderRadius="full"
          fontWeight="bold"
          bg="cirqueira.musica.verde"
          color="cirqueira.grey.950"
          _hover={{ bg: 'cirqueira.musica.verdeHover' }}
          onClick={() => confirmar.mutate(importacao.uuid)}
          loading={confirmar.isPending}
          disabled={ocupado}
        >
          Confirmar
        </Button>
      </HStack>
    </VStack>
  )
})
