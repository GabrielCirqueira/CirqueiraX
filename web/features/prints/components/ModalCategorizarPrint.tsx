import {
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  NativeSelect,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FolderPlus, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { CategoriaOpcao } from '../types'

export interface ModalCategorizarPrintProps {
  aberto: boolean
  onFechar: () => void
  onConfirmar: (categoriaId: string) => void
  categorias: CategoriaOpcao[]
  carregando?: boolean
  qtdSelecionados?: number
}

export const ModalCategorizarPrint = memo(function ModalCategorizarPrint({
  aberto,
  onFechar,
  onConfirmar,
  categorias,
  carregando = false,
  qtdSelecionados = 1,
}: ModalCategorizarPrintProps) {
  const [categoriaId, setCategoriaId] = useState('')

  const handleSalvar = () => {
    if (categoriaId) {
      onConfirmar(categoriaId)
      onFechar()
    }
  }

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={aberto} onOpenChange={(e) => !e.open && onFechar()} size="md" placement="center">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.75)" />
        <Dialog.Positioner>
        <Dialog.Content
          borderRadius="xl"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          shadow="2xl"
          overflow="hidden"
        >
          <Flex
            align="center"
            justify="space-between"
            p={4}
            borderBottomWidth="1px"
            borderColor="border.subtle"
          >
            <HStack gap={2.5}>
              <Box
                p={2}
                borderRadius="lg"
                bg="cirqueira.brand.500/10"
                color="cirqueira.brand.400"
                display="inline-flex"
              >
                <FolderPlus size={18} />
              </Box>
              <Dialog.Title fontSize="md" fontWeight="bold" color="fg">
                Categorizar {qtdSelecionados > 1 ? `${qtdSelecionados} Prints` : 'Print'}
              </Dialog.Title>
            </HStack>

            <IconButton
              size="sm"
              variant="ghost"
              onClick={onFechar}
              aria-label="Fechar"
              borderRadius="lg"
            >
              <X size={18} />
            </IconButton>
          </Flex>

          <Dialog.Body p={5}>
            <VStack gap={4} align="stretch">
              <Text fontSize="xs" color="fg.subtle">
                Selecione a categoria de destino para organizar seus prints:
              </Text>

              <NativeSelect.Root size="md" w="full">
                <NativeSelect.Field
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  placeholder="Selecione uma categoria..."
                  borderRadius="lg"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categorias.map((cat) => (
                    <option key={cat.uuid} value={cat.uuid}>
                      {cat.nome}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer p={4} borderTopWidth="1px" borderColor="border.subtle">
            <HStack gap={2} justify="flex-end">
              <Button size="sm" variant="ghost" onClick={onFechar} borderRadius="lg">
                Cancelar
              </Button>
              <Button
                size="sm"
                colorPalette="brand"
                onClick={handleSalvar}
                disabled={!categoriaId || carregando}
                borderRadius="lg"
              >
                Salvar Categoria
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
  )
})
