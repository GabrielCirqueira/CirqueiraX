import { Button, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { Ban, Music } from 'lucide-react'
import { memo } from 'react'
import type { CanalRevisao, ClassificacaoCanal } from '../types'

export interface CartaoCanalRevisaoProps {
  canal: CanalRevisao
  ocupado: boolean
  onClassificar: (canal: string, classificacao: ClassificacaoCanal) => void
}

export const CartaoCanalRevisao = memo(function CartaoCanalRevisao({
  canal,
  ocupado,
  onClassificar,
}: CartaoCanalRevisaoProps) {
  return (
    <Flex
      gap={3}
      p={{ base: 3, sm: 4 }}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      direction={{ base: 'column', sm: 'row' }}
      align={{ base: 'stretch', sm: 'center' }}
      justify="space-between"
      opacity={ocupado ? 0.6 : 1}
    >
      <VStack align="start" gap={0.5} minW={0}>
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color="cirqueira.musica.textoPrincipal"
          truncate
          maxW="full"
        >
          {canal.canal}
        </Text>
        <Text fontSize="xs" color="cirqueira.musica.verde" fontWeight="bold">
          {canal.total} {canal.total === 1 ? 'vídeo em aberto' : 'vídeos em aberto'} neste canal
        </Text>
        <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
          Ex.: {canal.exemplo}
        </Text>
      </VStack>
      <HStack gap={2} flexShrink={0}>
        <Button
          size="xs"
          borderRadius="full"
          bg="cirqueira.musica.verde"
          color="cirqueira.musica.fundo"
          _hover={{ bg: 'cirqueira.musica.verdeHover' }}
          disabled={ocupado}
          onClick={() => onClassificar(canal.canal, 'musica')}
        >
          <Music size={12} /> Sempre música
        </Button>
        <Button
          size="xs"
          variant="outline"
          borderRadius="full"
          borderColor="cirqueira.musica.cartaoElevado"
          color="cirqueira.musica.textoPrincipal"
          disabled={ocupado}
          onClick={() => onClassificar(canal.canal, 'nao_musica')}
        >
          <Ban size={12} /> Nunca música
        </Button>
      </HStack>
    </Flex>
  )
})
