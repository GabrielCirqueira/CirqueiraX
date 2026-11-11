import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { CloseButton, Dialog, Drawer, Portal } from '@chakra-ui/react'
import { type ReactNode, memo } from 'react'

export interface JanelaRevisaoMusicaProps {
  aberto: boolean
  titulo: string
  onFechar: () => void
  children: ReactNode
  rodape?: ReactNode
}

export const JanelaRevisaoMusica = memo(function JanelaRevisaoMusica({
  aberto,
  titulo,
  onFechar,
  children,
  rodape,
}: JanelaRevisaoMusicaProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (!isDesktop) {
    return (
      <Drawer.Root open={aberto} onOpenChange={(d) => !d.open && onFechar()} placement="bottom">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content
              bg="cirqueira.musica.cartao"
              color="cirqueira.musica.textoPrincipal"
              borderTopRadius="16px"
              maxH="90vh"
            >
              <Drawer.Header>
                <Drawer.Title>{titulo}</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body pb={4} overflowY="auto">
                {children}
              </Drawer.Body>
              {rodape && <Drawer.Footer pb={6}>{rodape}</Drawer.Footer>}
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" color="cirqueira.musica.textoSecundario" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(d) => !d.open && onFechar()} size="lg">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.8)" />
        <Dialog.Positioner px={4}>
          <Dialog.Content
            bg="cirqueira.musica.cartao"
            color="cirqueira.musica.textoPrincipal"
            borderRadius="8px"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
          >
            <Dialog.Header>
              <Dialog.Title>{titulo}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body maxH="65vh" overflowY="auto">
              {children}
            </Dialog.Body>
            {rodape && <Dialog.Footer>{rodape}</Dialog.Footer>}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" color="cirqueira.musica.textoSecundario" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
