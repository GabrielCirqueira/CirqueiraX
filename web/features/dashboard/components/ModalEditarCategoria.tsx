import {
  Box,
  Button,
  Dialog,
  Field,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FolderCheck, Loader2, Save, X } from 'lucide-react'
import { useState } from 'react'
import { useAtualizarMapeamentoCategoria } from '../hooks/useDashboard'
import type { CategoriaMetrica } from '../types'

export interface ModalEditarCategoriaProps {
  categoria: CategoriaMetrica | null
  aberto: boolean
  onFechar: () => void
  onSucesso?: () => void
}

function FormularioEditarCategoria({
  categoria,
  onFechar,
  onSucesso,
}: {
  categoria: CategoriaMetrica
  onFechar: () => void
  onSucesso?: () => void
}) {
  const { mutate: atualizarCategoria, isPending } = useAtualizarMapeamentoCategoria()
  const [nome, setNome] = useState(categoria.nome ?? '')
  const [pastaLocal, setPastaLocal] = useState(categoria.pastaLocal ?? '')
  const [erro, setErro] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!nome.trim()) {
      setErro('O nome da categoria não pode estar em branco.')
      return
    }

    if (!pastaLocal.trim()) {
      setErro('A pasta local deve ser especificada.')
      return
    }

    atualizarCategoria(
      {
        uuid: categoria.uuid,
        dados: {
          nome: nome.trim(),
          pastaLocal: pastaLocal.trim(),
        },
      },
      {
        onSuccess: () => {
          onSucesso?.()
          onFechar()
        },
        onError: (err: unknown) => {
          const mensagem =
            err instanceof Error ? err.message : 'Falha ao atualizar o mapeamento da categoria.'
          setErro(mensagem)
        },
      }
    )
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Dialog.Body p={4}>
        <VStack gap={4} alignItems="stretch">
          {erro && (
            <Box
              p={3}
              borderRadius="lg"
              bg="cirqueira.red.500/10"
              borderWidth="1px"
              borderColor="cirqueira.red.500/20"
              color="cirqueira.red.500"
              fontSize="xs"
            >
              {erro}
            </Box>
          )}

          <Field.Root invalid={Boolean(erro && !nome.trim())} w="full">
            <Field.Label fontSize="xs" fontWeight="medium" color="fg.subtle">
              Nome da Categoria
            </Field.Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vídeos Curtos, Memes..."
              mt={1}
              bg="bg.muted"
              borderColor="border.subtle"
              borderRadius="lg"
            />
          </Field.Root>

          <Field.Root invalid={Boolean(erro && !pastaLocal.trim())} w="full">
            <Field.Label fontSize="xs" fontWeight="medium" color="fg.subtle">
              Pasta Local (subdiretório no storage)
            </Field.Label>
            <Input
              value={pastaLocal}
              onChange={(e) => setPastaLocal(e.target.value)}
              placeholder="Ex: videos, prints/empresa..."
              mt={1}
              bg="bg.muted"
              borderColor="border.subtle"
              fontFamily="mono"
              fontSize="xs"
              borderRadius="lg"
            />
            <Text fontSize="11px" color="fg.subtle" mt={1}>
              Os arquivos associados a esta categoria serão movidos para esta pasta.
            </Text>
          </Field.Root>

          {categoria.googlePhotosAlbumId && (
            <VStack
              p={3}
              borderRadius="lg"
              bg="bg.muted"
              borderWidth="1px"
              borderColor="border.subtle"
              gap={1}
              alignItems="flex-start"
            >
              <Text fontSize="xs" fontWeight="semibold" color="fg">
                Integração Google Fotos
              </Text>
              <Text fontSize="11px" color="fg.subtle" fontFamily="mono" wordBreak="break-all">
                ID do Álbum: {categoria.googlePhotosAlbumId}
              </Text>
            </VStack>
          )}
        </VStack>
      </Dialog.Body>

      <Dialog.Footer
        display="flex"
        justifyContent="flex-end"
        gap={2}
        p={4}
        borderTopWidth="1px"
        borderColor="border.subtle"
      >
        <Button type="button" variant="ghost" onClick={onFechar}>
          Cancelar
        </Button>
        <Button
          type="submit"
          colorPalette="brand"
          disabled={isPending}
          fontWeight="medium"
          borderRadius="lg"
        >
          {isPending ? (
            <HStack gap={2}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <Text as="span">Salvando...</Text>
            </HStack>
          ) : (
            <HStack gap={2}>
              <Save size={16} />
              <Text as="span">Salvar Mapeamento</Text>
            </HStack>
          )}
        </Button>
      </Dialog.Footer>
    </Box>
  )
}

export function ModalEditarCategoria({
  categoria,
  aberto,
  onFechar,
  onSucesso,
}: ModalEditarCategoriaProps) {
  if (!categoria) return null

  return (
    <Dialog.Root open={aberto} onOpenChange={(e) => !e.open && onFechar()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          color="fg"
          borderRadius="xl"
          p={0}
          maxW="md"
          w="full"
        >
          <Dialog.Header
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            p={4}
            borderBottomWidth="1px"
            borderColor="border.subtle"
          >
            <HStack gap={2.5}>
              <Box
                p={2}
                borderRadius="lg"
                bg="cirqueira.purple.500/10"
                color="cirqueira.purple.500"
              >
                <FolderCheck size={20} />
              </Box>
              <VStack gap={0.5} alignItems="flex-start">
                <Dialog.Title fontSize="base" fontWeight="semibold" color="fg">
                  Editar Categoria
                </Dialog.Title>
                <Text fontSize="xs" color="fg.subtle">
                  Ajuste o nome e a pasta local de destino
                </Text>
              </VStack>
            </HStack>
            <IconButton size="sm" variant="ghost" onClick={onFechar} aria-label="Fechar modal">
              <X size={16} />
            </IconButton>
          </Dialog.Header>

          <FormularioEditarCategoria
            key={categoria.uuid}
            categoria={categoria}
            onFechar={onFechar}
            onSucesso={onSucesso}
          />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
