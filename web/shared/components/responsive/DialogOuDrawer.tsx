import { Dialog, Portal } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface DialogState {
  isOpen: boolean
  setOpen: (open: boolean) => void
  open?: () => void
  close?: () => void
  toggle?: () => void
}

export interface DialogOuDrawerProps {
  state: DialogState
  titulo: string
  descricao?: string
  children: ReactNode
  footer?: ReactNode
}

export function DialogOuDrawer({
  state,
  titulo,
  descricao,
  children,
  footer,
}: DialogOuDrawerProps) {
  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={state.isOpen} onOpenChange={(e) => state.setOpen(e.open)} placement="center">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.75)" />
        <Dialog.Positioner>
        <Dialog.Content
          bg="bg.panel"
          border="1px solid"
          borderColor="border.subtle"
          color="fg"
          p={4}
          borderRadius="xl"
        >
          <Dialog.Header>
            <Dialog.Title fontSize="lg" fontWeight="bold">
              {titulo}
            </Dialog.Title>
            {descricao && (
              <Dialog.Description textStyle="sm" color="fg.subtle" mt={1}>
                {descricao}
              </Dialog.Description>
            )}
          </Dialog.Header>
          <Dialog.Body py={4}>{children}</Dialog.Body>
          {footer && <Dialog.Footer>{footer}</Dialog.Footer>}
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
)
}
