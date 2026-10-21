import { Button, Dialog, HStack, Portal, Text, VStack } from '@chakra-ui/react'
import { Loader2 } from 'lucide-react'
import { memo } from 'react'

export interface ModalRemoverCategoriaLoteProps {
  aberto: boolean
  totalSelecionados: number
  processando: boolean
  onFechar: () => void
  onConfirmar: () => void
}

const PASSOS = [
  'Os vídeos voltam para "Sem categoria" e o arquivo continua no lugar.',
  'O vínculo com o Google Fotos é desfeito. Apague lá as cópias com a data errada, porque o Google não deixa o sistema apagar.',
  'Ajuste a data e o horário (individual ou em "Distribuir horários").',
  'Categorize de novo para reenviar ao Google Fotos com a data certa.',
]

export const ModalRemoverCategoriaLote = memo(function ModalRemoverCategoriaLote({
  aberto,
  totalSelecionados,
  processando,
  onFechar,
  onConfirmar,
}: ModalRemoverCategoriaLoteProps) {
  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={aberto}
      onOpenChange={(e) => !e.open && onFechar()}
      placement="center"
      size="md"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p={4}>
          <Dialog.Content
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="xl"
            p={5}
            maxW="md"
          >
            <Dialog.Header p={0} mb={3}>
              <Dialog.Title fontSize="md" fontWeight="semibold">
                Remover categoria de{' '}
                {totalSelecionados === 1 ? '1 vídeo' : `${totalSelecionados} vídeos`}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body p={0}>
              <VStack gap={4} align="stretch">
                <VStack as="ol" gap={2} align="stretch" ps={4} listStyleType="decimal">
                  {PASSOS.map((passo) => (
                    <Text as="li" key={passo} fontSize="sm" color="fg.muted">
                      {passo}
                    </Text>
                  ))}
                </VStack>

                <HStack
                  justify="flex-end"
                  gap={2}
                  pt={3}
                  borderTopWidth="1px"
                  borderColor="border.subtle"
                >
                  <Button size="sm" variant="ghost" borderRadius="lg" onClick={onFechar}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="amber"
                    borderRadius="lg"
                    disabled={processando}
                    onClick={onConfirmar}
                  >
                    {processando && (
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                    Remover categoria
                  </Button>
                </HStack>
              </VStack>
            </Dialog.Body>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
