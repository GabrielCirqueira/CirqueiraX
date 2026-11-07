import { Button, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import { Copy, ImagePlus } from 'lucide-react'
import { memo } from 'react'

export interface CabecalhoExtracaoProps {
  temTexto: boolean
  onAbrirArquivo: () => void
  onCopiar: () => void
}

export const CabecalhoExtracao = memo(function CabecalhoExtracao({
  temTexto,
  onAbrirArquivo,
  onCopiar,
}: CabecalhoExtracaoProps) {
  return (
    <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={4}>
      <VStack gap={1} alignItems="flex-start" minW={0}>
        <Text as="h1" fontSize="2xl" fontWeight="semibold" color="fg" letterSpacing="tight">
          Extrair texto
        </Text>
        <Text fontSize="sm" color="fg.subtle">
          Cole uma imagem e o texto dela já vai para a área de transferência.
        </Text>
      </VStack>

      <HStack gap={2}>
        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="full"
          color="fg.muted"
          aria-label="Abrir imagem"
          title="Abrir imagem do computador"
          onClick={onAbrirArquivo}
        >
          <ImagePlus size={16} />
        </IconButton>
        <Button
          size="sm"
          colorPalette="brand"
          borderRadius="full"
          disabled={!temTexto}
          onClick={onCopiar}
          title="Copiar o texto extraído"
        >
          <Copy size={15} />
          Copiar texto
        </Button>
      </HStack>
    </HStack>
  )
})
