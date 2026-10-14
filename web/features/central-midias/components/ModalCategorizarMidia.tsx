import {
  Button,
  Dialog,
  HStack,
  NativeSelect,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FolderPlus } from 'lucide-react'
import { memo, useState } from 'react'
import type { CategoriaOpcao } from '../types'

export interface ModalCategorizarMidiaProps {
  aberto: boolean
  quantidade: number
  categorias: CategoriaOpcao[]
  onFechar: () => void
  onConfirmar: (categoriaId: string) => void
}

export const ModalCategorizarMidia = memo(function ModalCategorizarMidia({
  aberto,
  quantidade,
  categorias,
  onFechar,
  onConfirmar,
}: ModalCategorizarMidiaProps) {
  const [categoriaId, setCategoriaId] = useState('')

  const handleConfirmar = () => {
    if (!categoriaId) return
    onConfirmar(categoriaId)
    setCategoriaId('')
    onFechar()
  }

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={aberto} onOpenChange={(e) => !e.open && onFechar()} size="sm" placement="center">
      <Portal>
        <Dialog.Backdrop bg="cirqueira.grey.950/80" />
        <Dialog.Positioner>
        <Dialog.Content
          borderRadius="2xl"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <Dialog.Header pb={2}>
            <HStack gap={2} color="cirqueira.brand.400">
              <FolderPlus size={18} />
              <Dialog.Title fontSize="md" fontWeight="bold">
                Categorizar Mídia{quantidade > 1 ? 's' : ''}
              </Dialog.Title>
            </HStack>
          </Dialog.Header>

          <Dialog.Body py={3}>
            <VStack gap={3} align="stretch">
              <Text fontSize="xs" color="fg.subtle">
                {quantidade > 1
                  ? `Selecione a categoria para aplicar às ${quantidade} mídias selecionadas:`
                  : 'Selecione a nova categoria para esta mídia:'}
              </Text>

              <NativeSelect.Root size="sm" w="full">
                <NativeSelect.Field
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  bg="bg.muted"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  fontSize="xs"
                  h={9}
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

          <Dialog.Footer pt={2}>
            <Button size="sm" variant="ghost" onClick={onFechar} borderRadius="lg">
              Cancelar
            </Button>
            <Button
              size="sm"
              colorPalette="brand"
              disabled={!categoriaId}
              onClick={handleConfirmar}
              borderRadius="lg"
              fontWeight="bold"
            >
              Aplicar Categoria
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
  )
})
