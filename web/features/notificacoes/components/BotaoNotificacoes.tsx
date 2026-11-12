import {
  Box,
  Button,
  Center,
  CloseButton,
  Dialog,
  IconButton,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import {
  useHistoricoNotificacoes,
  useMarcarNotificacoesLidas,
  useNotificacoesNaoLidas,
} from '../hooks'
import { rotuloContagem } from '../utils'
import { ItemNotificacao } from './ItemNotificacao'

export function BotaoNotificacoes() {
  const [aberto, setAberto] = useState(false)
  const { data: naoLidas } = useNotificacoesNaoLidas()
  const historico = useHistoricoNotificacoes(aberto)
  const marcarLidas = useMarcarNotificacoesLidas()
  const totalNaoLidas = naoLidas?.naoLidas ?? 0
  const itens = historico.data?.itens ?? []

  return (
    <>
      <Box position="relative">
        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="full"
          aria-label="Notificações"
          color="fg.muted"
          _hover={{ color: 'fg', bg: 'bg.muted' }}
          onClick={() => setAberto(true)}
        >
          <Bell size={16} />
        </IconButton>
        {totalNaoLidas > 0 && (
          <Center
            position="absolute"
            top="-2px"
            right="-2px"
            minW={4}
            h={4}
            px={1}
            borderRadius="full"
            bg="brand.solid"
            color="brand.contrast"
            fontSize="9px"
            fontWeight="bold"
            pointerEvents="none"
          >
            {rotuloContagem(totalNaoLidas)}
          </Center>
        )}
      </Box>

      <Dialog.Root
        open={aberto}
        onOpenChange={(e) => setAberto(e.open)}
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
                <Dialog.Title fontSize="md" color="fg">
                  Notificações
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body py={4}>
                {historico.isLoading && (
                  <Center py={8}>
                    <Spinner size="sm" />
                  </Center>
                )}
                {!historico.isLoading && itens.length === 0 && (
                  <Text fontSize="sm" color="fg.muted" textAlign="center" py={8}>
                    Nenhuma notificação ainda.
                  </Text>
                )}
                <VStack align="stretch" gap={3}>
                  {itens.map((notificacao) => (
                    <ItemNotificacao
                      key={notificacao.uuid}
                      notificacao={notificacao}
                      destacarNaoLida
                    />
                  ))}
                </VStack>
              </Dialog.Body>
              {totalNaoLidas > 0 && (
                <Dialog.Footer borderTopWidth="1px" borderColor="border.subtle">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => marcarLidas.mutate([])}
                    loading={marcarLidas.isPending}
                  >
                    Marcar todas como lidas
                  </Button>
                </Dialog.Footer>
              )}
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
