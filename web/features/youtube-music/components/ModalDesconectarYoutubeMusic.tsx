import { Box, Button, Dialog, HStack, Portal, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle } from 'lucide-react'
import { memo } from 'react'

export interface ModalDesconectarYoutubeMusicProps {
  aberto: boolean
  carregando: boolean
  onConfirmar: () => void
  onFechar: () => void
}

export const ModalDesconectarYoutubeMusic = memo(function ModalDesconectarYoutubeMusic({
  aberto,
  carregando,
  onConfirmar,
  onFechar,
}: ModalDesconectarYoutubeMusicProps) {
  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(detalhes) => !detalhes.open && onFechar()}
      role="alertdialog"
    >
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(4px)" />
        <Dialog.Positioner px={4}>
          <Dialog.Content
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            borderRadius="8px"
            p={6}
            maxW="md"
            w="full"
            color="cirqueira.musica.textoPrincipal"
          >
            <Dialog.Header p={0} mb={4}>
              <HStack gap={3}>
                <Box p={2} borderRadius="full" bg="cirqueira.red.950" color="cirqueira.red.400">
                  <AlertTriangle size={20} />
                </Box>
                <Dialog.Title fontSize="lg" fontWeight="bold">
                  Desconectar o YouTube Music?
                </Dialog.Title>
              </HStack>
            </Dialog.Header>
            <Dialog.Body p={0}>
              <VStack align="stretch" gap={3} fontSize="sm">
                <Text color="cirqueira.musica.textoSecundario">
                  <Text as="span" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                    É apagado:
                  </Text>{' '}
                  a credencial da sua conta Google guardada no servidor. A coleta para.
                </Text>
                <Text color="cirqueira.musica.textoSecundario">
                  <Text as="span" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                    Fica:
                  </Text>{' '}
                  todas as reproduções já coletadas ou importadas, que continuam nos relatórios.
                </Text>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer p={0} mt={6} gap={3}>
              <Button
                variant="ghost"
                borderRadius="full"
                color="cirqueira.musica.textoSecundario"
                onClick={onFechar}
                disabled={carregando}
              >
                Cancelar
              </Button>
              <Button
                borderRadius="full"
                colorPalette="red"
                onClick={onConfirmar}
                loading={carregando}
              >
                Desconectar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
