import { Box, Button, Kbd, Text, VStack } from '@chakra-ui/react'
import { ImagePlus, ScanText } from 'lucide-react'
import { memo } from 'react'

export interface ZonaColarImagemTextoProps {
  onEscolherArquivo: () => void
}

export const ZonaColarImagemTexto = memo(function ZonaColarImagemTexto({
  onEscolherArquivo,
}: ZonaColarImagemTextoProps) {
  return (
    <VStack gap={5} maxW="sm" textAlign="center" px={4}>
      <Box
        p={4}
        borderRadius="8px"
        bg="cirqueira.brand.500/10"
        color="cirqueira.brand.500"
        display="inline-flex"
      >
        <ScanText size={34} strokeWidth={1.5} />
      </Box>

      <VStack gap={1.5}>
        <Text as="h2" fontSize="lg" fontWeight="semibold" color="fg">
          Cole uma imagem para ler o texto
        </Text>
        <Text fontSize="sm" color="fg.subtle">
          Copie um print ou uma imagem e aperte <Kbd size="sm">Ctrl</Kbd> + <Kbd size="sm">V</Kbd>{' '}
          em qualquer lugar da tela. Também dá para arrastar um arquivo até aqui.
        </Text>
      </VStack>

      <Button size="sm" variant="outline" borderRadius="full" onClick={onEscolherArquivo}>
        <ImagePlus size={15} />
        Escolher do computador
      </Button>

      <Text fontSize="xs" color="fg.subtle">
        Lido no próprio navegador, em português e inglês. Nada é enviado ao servidor.
      </Text>
    </VStack>
  )
})
