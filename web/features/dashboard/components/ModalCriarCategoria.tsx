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
import { FolderPlus, Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useCriarCategoria } from '../hooks/useDashboard'

export interface ModalCriarCategoriaProps {
  aberto: boolean
  onFechar: () => void
  onSucesso?: () => void
}

function FormularioCriarCategoria({
  onFechar,
  onSucesso,
}: {
  onFechar: () => void
  onSucesso?: () => void
}) {
  const { mutate: salvarCategoria, isPending } = useCriarCategoria()
  const [nome, setNome] = useState('')
  const [pastaLocal, setPastaLocal] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  function handleNomeChange(valor: string) {
    setNome(valor)
    if (!pastaLocal || pastaLocal === slugify(nome)) {
      setPastaLocal(slugify(valor))
    }
  }

  function slugify(texto: string): string {
    return texto
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!nome.trim()) {
      setErro('O nome da categoria é obrigatório.')
      return
    }

    if (!pastaLocal.trim()) {
      setErro('A pasta local deve ser especificada.')
      return
    }

    salvarCategoria(
      {
        nome: nome.trim(),
        pastaLocal: pastaLocal.trim(),
      },
      {
        onSuccess: () => {
          onSucesso?.()
          onFechar()
        },
        onError: (err: unknown) => {
          const mensagem =
            err instanceof Error ? err.message : 'Falha ao cadastrar a nova categoria.'
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
              borderRadius="xl"
              bg="red.500/10"
              borderWidth="1px"
              borderColor="red.500/20"
              color="red.500"
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
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Ex: Viagens, Aniversários, Memes..."
              mt={1}
              bg="bg.muted"
              borderColor="border.subtle"
              borderRadius="xl"
              autoFocus
            />
          </Field.Root>

          <Field.Root invalid={Boolean(erro && !pastaLocal.trim())} w="full">
            <Field.Label fontSize="xs" fontWeight="medium" color="fg.subtle">
              Pasta Local de Destino (storage)
            </Field.Label>
            <Input
              value={pastaLocal}
              onChange={(e) => setPastaLocal(e.target.value)}
              placeholder="Ex: viagens, eventos/aniversarios..."
              mt={1}
              bg="bg.muted"
              borderColor="border.subtle"
              fontFamily="mono"
              fontSize="xs"
              borderRadius="xl"
            />
            <Text fontSize="11px" color="fg.subtle" mt={1}>
              Subdiretório dentro da pasta organizada onde as mídias desta categoria serão salvas.
            </Text>
          </Field.Root>

          <Box
            p={3}
            borderRadius="xl"
            bg="brand.500/5"
            borderWidth="1px"
            borderColor="brand.500/20"
          >
            <Text fontSize="11px" color="brand.400">
              💡 Um álbum com o mesmo nome no Google Fotos será automaticamente criado ou poderá ser
              vinculado manualmente na aba Google Fotos.
            </Text>
          </Box>
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
          borderRadius="xl"
        >
          {isPending ? (
            <HStack gap={2}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <Text as="span">Cadastrando...</Text>
            </HStack>
          ) : (
            <HStack gap={2}>
              <Plus size={16} />
              <Text as="span">Criar Categoria</Text>
            </HStack>
          )}
        </Button>
      </Dialog.Footer>
    </Box>
  )
}

export function ModalCriarCategoria({ aberto, onFechar, onSucesso }: ModalCriarCategoriaProps) {
  return (
    <Dialog.Root open={aberto} onOpenChange={(e) => !e.open && onFechar()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          color="fg"
          borderRadius="2xl"
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
              <Box p={2} borderRadius="xl" bg="brand.500/10" color="brand.500">
                <FolderPlus size={20} />
              </Box>
              <VStack gap={0.5} alignItems="flex-start">
                <Dialog.Title fontSize="base" fontWeight="semibold" color="fg">
                  Nova Categoria
                </Dialog.Title>
                <Text fontSize="xs" color="fg.subtle">
                  Defina o nome e a pasta local de destino
                </Text>
              </VStack>
            </HStack>
            <IconButton size="sm" variant="ghost" onClick={onFechar} aria-label="Fechar modal">
              <X size={16} />
            </IconButton>
          </Dialog.Header>

          <FormularioCriarCategoria
            key={aberto ? 'aberto' : 'fechado'}
            onFechar={onFechar}
            onSucesso={onSucesso}
          />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
