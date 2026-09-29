import {
  createToaster,
  Toaster as ChakraToaster,
  Portal,
  Toast,
} from '@chakra-ui/react'

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
})

export interface ToastOptions {
  title: string
  description?: string
  color?: 'success' | 'danger' | 'error' | 'warning' | 'info' | 'primary'
  type?: 'success' | 'error' | 'warning' | 'info'
}

export const addToast = (options: ToastOptions) => {
  const typeMap: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
    success: 'success',
    danger: 'error',
    error: 'error',
    warning: 'warning',
    info: 'info',
    primary: 'info',
  }

  const toastType = options.type || typeMap[options.color || 'info'] || 'info'

  toaster.create({
    title: options.title,
    description: options.description,
    type: toastType,
  })
}

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster}>
        {(toast) => (
          <Toast.Root key={toast.id}>
            {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
            {toast.description && (
              <Toast.Description>{toast.description}</Toast.Description>
            )}
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
