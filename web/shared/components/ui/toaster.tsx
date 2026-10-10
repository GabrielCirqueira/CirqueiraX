import {
  Box,
  Toaster as ChakraToaster,
  IconButton,
  Portal,
  Spinner,
  Toast,
  VStack,
  createToaster,
} from '@chakra-ui/react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
})

export interface ToastOptions {
  title: string
  description?: string
  color?: 'success' | 'danger' | 'error' | 'warning' | 'info' | 'primary'
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading'
  duration?: number
}

export const addToast = (options: ToastOptions) => {
  const typeMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'loading'> = {
    success: 'success',
    danger: 'error',
    error: 'error',
    warning: 'warning',
    info: 'info',
    primary: 'info',
    loading: 'loading',
  }

  const toastType = options.type || typeMap[options.color || 'info'] || 'info'

  toaster.create({
    title: options.title,
    description: options.description,
    type: toastType,
    duration: options.duration ?? 4000,
  })
}

function renderizarIconeToast(type?: string) {
  switch (type) {
    case 'success':
      return (
        <Box as="span" color="cirqueira.green.500" display="inline-flex">
          <CheckCircle2 size={18} color="currentColor" />
        </Box>
      )
    case 'error':
      return (
        <Box as="span" color="cirqueira.red.500" display="inline-flex">
          <AlertCircle size={18} color="currentColor" />
        </Box>
      )
    case 'warning':
      return (
        <Box as="span" color="cirqueira.amber.500" display="inline-flex">
          <AlertTriangle size={18} color="currentColor" />
        </Box>
      )
    case 'loading':
      return <Spinner size="xs" color="cirqueira.blue.500" />
    default:
      return (
        <Box as="span" color="cirqueira.blue.500" display="inline-flex">
          <Info size={18} color="currentColor" />
        </Box>
      )
  }
}

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInlineEnd="16px" top="16px">
        {(toast) => (
          <Toast.Root
            key={toast.id}
            w={{ base: 'calc(100vw - 32px)', sm: '380px' }}
            minW="300px"
            maxW="420px"
            bg="bg.panel"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.subtle"
            shadow="2xl"
            p={3.5}
            display="flex"
            flexDirection="row"
            alignItems="flex-start"
            gap={3}
          >
            <Box flexShrink={0} pt={0.5}>
              {renderizarIconeToast(toast.type)}
            </Box>

            <VStack flex={1} gap={0.5} align="flex-start" minW={0}>
              {toast.title && (
                <Toast.Title fontSize="sm" fontWeight="semibold" color="fg" lineClamp={2}>
                  {toast.title}
                </Toast.Title>
              )}
              {toast.description && (
                <Toast.Description fontSize="xs" color="fg.subtle" lineClamp={3}>
                  {toast.description}
                </Toast.Description>
              )}
            </VStack>

            <Toast.CloseTrigger asChild>
              <IconButton
                size="2xs"
                variant="ghost"
                color="fg.subtle"
                _hover={{ color: 'fg', bg: 'bg.muted' }}
                aria-label="Fechar notificação"
                flexShrink={0}
              >
                <X size={14} />
              </IconButton>
            </Toast.CloseTrigger>
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
