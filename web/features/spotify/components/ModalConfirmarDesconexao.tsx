import { Box, Button, Dialog, HStack, Heading, Portal, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { memo } from 'react'

export interface ModalConfirmarDesconexaoProps {
  aberto: boolean
  carregando: boolean
  onConfirmar: () => void
  onFechar: () => void
}

export const ModalConfirmarDesconexao = memo(function ModalConfirmarDesconexao({
  aberto,
  carregando,
  onConfirmar,
  onFechar,
}: ModalConfirmarDesconexaoProps) {
  return (
    <Dialog.Root open={aberto} onOpenChange={(detalhes) => !detalhes.open && onFechar()}>
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="cirqueira.spotify.cartao"
            border="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            borderRadius="8px"
            p={6}
            maxW="md"
            w="full"
            color="cirqueira.spotify.textoPrincipal"
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.6)"
          >
            <Dialog.Header
              p={0}
              mb={4}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <HStack gap={3}>
                <Box
                  p={2}
                  borderRadius="full"
                  bg="rgba(239, 68, 68, 0.15)"
                  color="red.400"
                  display="inline-flex"
                >
                  <AlertTriangle size={20} />
                </Box>
                <Dialog.Title fontSize="lg" fontWeight="bold">
                  Desconectar Spotify?
                </Dialog.Title>
              </HStack>

              <Dialog.CloseTrigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.spotify.textoSecundario"
                  _hover={{
                    color: 'cirqueira.spotify.textoPrincipal',
                    bg: 'cirqueira.spotify.cartaoElevado',
                  }}
                  onClick={onFechar}
                >
                  <X size={16} />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={0} mb={6}>
              <VStack align="flex-start" gap={3}>
                <Text fontSize="sm" color="cirqueira.spotify.textoSecundario" lineHeight="tall">
                  Ao desconectar sua conta, as reproduções sincronizadas automaticamente via API
                  serão excluídas.
                </Text>
                <Box
                  p={3}
                  borderRadius="8px"
                  bg="cirqueira.spotify.cartaoElevado"
                  borderLeft="3px solid"
                  borderColor="cirqueira.spotify.verde"
                  w="full"
                >
                  <Text fontSize="xs" color="cirqueira.spotify.textoPrincipal">
                    Os dados importados de arquivos de histórico não serão apagados e continuarão
                    preservados.
                  </Text>
                </Box>
                <Text fontSize="xs" color="cirqueira.spotify.textoDesabilitado" lineHeight="tall">
                  Lembre-se de que você também pode gerenciar ou revogar o acesso do aplicativo
                  diretamente na página de aplicativos da sua conta do Spotify.
                </Text>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer p={0} display="flex" justifyContent="flex-end" gap={3}>
              <Button
                variant="ghost"
                borderRadius="full"
                color="cirqueira.spotify.textoSecundario"
                _hover={{
                  bg: 'cirqueira.spotify.cartaoElevado',
                  color: 'cirqueira.spotify.textoPrincipal',
                }}
                onClick={onFechar}
                disabled={carregando}
                fontSize="sm"
              >
                Cancelar
              </Button>
              <Button
                bg="red.500"
                color="#FFFFFF"
                borderRadius="full"
                _hover={{ bg: 'red.600' }}
                fontSize="sm"
                fontWeight="bold"
                onClick={onConfirmar}
                loading={carregando}
              >
                <HStack gap={2}>
                  <Trash2 size={16} />
                  <Text as="span">Sim, desconectar</Text>
                </HStack>
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
