import { Button, HStack, Text } from '@chakra-ui/react'
import { ListChecks, X } from 'lucide-react'
import { memo } from 'react'

export interface BarraLoteRevisaoProps {
  quantidade: number
  onDefinirMusica: () => void
  onLimpar: () => void
}

export const BarraLoteRevisao = memo(function BarraLoteRevisao({
  quantidade,
  onDefinirMusica,
  onLimpar,
}: BarraLoteRevisaoProps) {
  return (
    <HStack
      position="sticky"
      top={2}
      zIndex={2}
      justify="space-between"
      gap={3}
      px={4}
      py={2.5}
      borderRadius="8px"
      bg="cirqueira.musica.cartaoElevado"
      border="1px solid"
      borderColor="cirqueira.musica.verde"
      role="region"
      aria-label="Ações em lote"
    >
      <Text fontSize="sm" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
        {quantidade} {quantidade === 1 ? 'selecionado' : 'selecionados'}
      </Text>
      <HStack gap={2}>
        <Button
          size="xs"
          borderRadius="full"
          bg="cirqueira.musica.verde"
          color="cirqueira.musica.fundo"
          _hover={{ bg: 'cirqueira.musica.verdeHover' }}
          disabled={quantidade === 0}
          onClick={onDefinirMusica}
        >
          <ListChecks size={12} /> Definir a mesma música
        </Button>
        <Button
          size="xs"
          variant="ghost"
          color="cirqueira.musica.textoSecundario"
          onClick={onLimpar}
        >
          <X size={12} /> Limpar
        </Button>
      </HStack>
    </HStack>
  )
})
