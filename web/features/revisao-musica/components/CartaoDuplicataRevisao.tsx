import { Button, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Merge } from 'lucide-react'
import { memo } from 'react'
import type { DuplicataRevisao } from '../types'
import { nomesArtistasCatalogo } from '../utils'

export interface CartaoDuplicataRevisaoProps {
  duplicata: DuplicataRevisao
  ocupado: boolean
  onUnir: (origemUuid: string, destinoUuid: string) => void
}

export const CartaoDuplicataRevisao = memo(function CartaoDuplicataRevisao({
  duplicata,
  ocupado,
  onUnir,
}: CartaoDuplicataRevisaoProps) {
  const [primeira, segunda] = duplicata.musicas

  return (
    <VStack
      align="stretch"
      gap={3}
      p={{ base: 3, sm: 4 }}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      opacity={ocupado ? 0.6 : 1}
    >
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
        {[
          { musica: primeira, outra: segunda },
          { musica: segunda, outra: primeira },
        ].map(({ musica, outra }) => (
          <VStack
            key={musica.uuid}
            align="stretch"
            gap={2}
            p={3}
            borderRadius="6px"
            bg="cirqueira.musica.cartaoElevado"
          >
            <VStack align="start" gap={0} minW={0}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="cirqueira.musica.textoPrincipal"
                truncate
                maxW="full"
              >
                {musica.titulo}
              </Text>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
                {nomesArtistasCatalogo(musica) || 'Sem artista'}
                {musica.album ? ` · ${musica.album}` : ''}
              </Text>
            </VStack>
            <Button
              size="xs"
              borderRadius="full"
              variant="outline"
              borderColor="cirqueira.musica.verde"
              color="cirqueira.musica.verde"
              disabled={ocupado}
              onClick={() => onUnir(outra.uuid, musica.uuid)}
            >
              <Merge size={12} /> Manter esta e unir
            </Button>
          </VStack>
        ))}
      </SimpleGrid>
      <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
        Unir não apaga nada: a outra música passa a contar para a escolhida e pode ser separada
        depois.
      </Text>
    </VStack>
  )
})
