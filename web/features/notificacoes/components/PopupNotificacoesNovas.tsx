import { Button, CloseButton, Dialog, HStack, Portal, Text, VStack } from '@chakra-ui/react'
import { BellRing } from 'lucide-react'
import { useMarcarNotificacoesLidas, useNotificacoesNaoLidas } from '../hooks'
import { uuidsDasNotificacoes } from '../utils'
import { ItemNotificacao } from './ItemNotificacao'

export function PopupNotificacoesNovas() {
  const { data } = useNotificacoesNaoLidas()
  const marcarLidas = useMarcarNotificacoesLidas()
  const novas = data?.itens ?? []
  const aberto = novas.length > 0

  const marcarExibidas = () => marcarLidas.mutate(uuidsDasNotificacoes(novas))

  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(e) => !e.open && marcarExibidas()}
      size="md"
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.canvas"
            borderRadius="12px"
            mx={4}
            maxH="min(80vh, 640px)"
            h="auto"
          >
            <Dialog.Header borderBottomWidth="1px" borderColor="border.subtle">
              <HStack gap={2}>
                <BellRing size={18} />
                <Dialog.Title fontSize="md" color="fg">
                  {novas.length === 1 ? 'Nova atualização' : `${novas.length} novas atualizações`}
                </Dialog.Title>
              </HStack>
            </Dialog.Header>
            <Dialog.Body py={4}>
              <VStack align="stretch" gap={3}>
                <Text fontSize="sm" color="fg.muted">
                  O CirqueiraX foi atualizado. Veja o que mudou:
                </Text>
                {novas.map((notificacao) => (
                  <ItemNotificacao key={notificacao.uuid} notificacao={notificacao} />
                ))}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer borderTopWidth="1px" borderColor="border.subtle">
              <Button
                size="sm"
                colorPalette="brand"
                onClick={marcarExibidas}
                loading={marcarLidas.isPending}
              >
                Ler tudo
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
