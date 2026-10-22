import { Box, Button, HStack, Kbd, Spinner, Text, VStack } from '@chakra-ui/react'
import { ClipboardPaste, ImagePlus } from 'lucide-react'
import { memo } from 'react'

export interface ZonaColarImagemProps {
  carregando: boolean
  onEscolherArquivo: () => void
}

export const ZonaColarImagem = memo(function ZonaColarImagem({
  carregando,
  onEscolherArquivo,
}: ZonaColarImagemProps) {
  if (carregando) {
    return (
      <VStack gap={3} color="fg.subtle">
        <Spinner size="lg" color="cirqueira.brand.500" />
        <Text fontSize="sm">Abrindo imagem...</Text>
      </VStack>
    )
  }

  return (
    <VStack gap={5} maxW="sm" textAlign="center" px={4}>
      <Box
        p={4}
        borderRadius="xl"
        bg="cirqueira.brand.500/10"
        color="cirqueira.brand.500"
        display="inline-flex"
      >
        <ClipboardPaste size={34} strokeWidth={1.5} />
      </Box>

      <VStack gap={1.5}>
        <Text as="h2" fontSize="lg" fontWeight="semibold" color="fg">
          Cole uma imagem para começar
        </Text>
        <Text fontSize="sm" color="fg.subtle">
          Tire um print e aperte <Kbd size="sm">Ctrl</Kbd> + <Kbd size="sm">V</Kbd> em qualquer
          lugar da tela. Também dá para arrastar um arquivo até aqui.
        </Text>
      </VStack>

      <Button size="sm" variant="outline" borderRadius="lg" onClick={onEscolherArquivo}>
        <ImagePlus size={15} />
        Escolher do computador
      </Button>

      <HStack gap={4} fontSize="xs" color="fg.subtle" flexWrap="wrap" justify="center">
        <Text as="span">Setas, formas e texto</Text>
        <Text as="span">Marcadores numerados</Text>
        <Text as="span">Pixelar dados sensíveis</Text>
      </HStack>
    </VStack>
  )
})
