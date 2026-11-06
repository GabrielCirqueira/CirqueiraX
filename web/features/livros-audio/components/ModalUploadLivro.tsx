import {
  Box,
  Button,
  Center,
  Dialog,
  Field,
  HStack,
  Input,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FileUp, UploadCloud, X } from 'lucide-react'
import { type ChangeEvent, type DragEvent, type FormEvent, memo, useRef, useState } from 'react'
import { useUploadLivroAudio } from '../hooks/useLivrosAudio'

interface ModalUploadLivroProps {
  aberto: boolean
  onFechar: () => void
}

export const ModalUploadLivro = memo(function ModalUploadLivro({
  aberto,
  onFechar,
}: ModalUploadLivroProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [titulo, setTitulo] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement | null>(null)

  const uploadMutation = useUploadLivroAudio()

  function limparFormulario() {
    setArquivo(null)
    setTitulo('')
    setArrastando(false)
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = ''
    }
  }

  function handleFechar() {
    limparFormulario()
    onFechar()
  }

  function selecionarArquivo(file: File | undefined | null) {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return
    }
    setArquivo(file)
    if (!titulo.trim()) {
      const nomeSemExtensao = file.name.replace(/\.pdf$/i, '')
      setTitulo(nomeSemExtensao)
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    selecionarArquivo(e.target.files?.[0])
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastando(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastando(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastando(false)
    selecionarArquivo(e.dataTransfer.files?.[0])
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!arquivo) return

    uploadMutation.mutate(
      { arquivo, titulo: titulo.trim() || undefined },
      {
        onSuccess: () => {
          handleFechar()
        },
      }
    )
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(details) => !details.open && handleFechar()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(6px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="cirqueira.grey.950"
            border="1px solid"
            borderColor="cirqueira.grey.800"
            color="cirqueira.grey.0"
            borderRadius="8px"
            p={0}
            maxW="lg"
            w="full"
          >
            <Dialog.Header
              p={6}
              borderBottom="1px solid"
              borderColor="cirqueira.grey.900"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <HStack gap={3}>
                <Center
                  boxSize={10}
                  borderRadius="8px"
                  bg="cirqueira.brand.500/20"
                  color="cirqueira.brand.400"
                >
                  <FileUp size={20} />
                </Center>
                <VStack alignItems="flex-start" gap={0.5}>
                  <Dialog.Title fontSize="md" fontWeight="bold">
                    Adicionar Livro em PDF
                  </Dialog.Title>
                  <Text fontSize="xs" color="cirqueira.grey.500">
                    Envie um arquivo PDF de até 500 MB para sua biblioteca
                  </Text>
                </VStack>
              </HStack>

              <Dialog.CloseTrigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.grey.400"
                  _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
                  onClick={handleFechar}
                >
                  <X size={16} />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={6}>
              <form
                onSubmit={handleSubmit}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <Box
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => inputArquivoRef.current?.click()}
                  cursor="pointer"
                  p={6}
                  border="2px dashed"
                  borderColor={arrastando ? 'cirqueira.brand.400' : 'cirqueira.grey.800'}
                  bg={arrastando ? 'cirqueira.brand.500/10' : 'cirqueira.grey.900/30'}
                  borderRadius="8px"
                  textAlign="center"
                  transition="all 0.2s ease"
                  _hover={{
                    borderColor: 'cirqueira.brand.500/50',
                    bg: 'cirqueira.grey.900/50',
                  }}
                >
                  <input
                    ref={inputArquivoRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  <VStack gap={2}>
                    <Center
                      boxSize={12}
                      borderRadius="full"
                      bg="cirqueira.grey.900"
                      color={arquivo ? 'cirqueira.brand.400' : 'cirqueira.grey.400'}
                    >
                      <UploadCloud size={24} />
                    </Center>

                    {arquivo ? (
                      <VStack gap={0.5}>
                        <Text fontSize="sm" fontWeight="bold" color="cirqueira.grey.0">
                          {arquivo.name}
                        </Text>
                        <Text fontSize="xs" color="cirqueira.grey.500">
                          {(arquivo.size / (1024 * 1024)).toFixed(2)} MB • Clique para trocar
                        </Text>
                      </VStack>
                    ) : (
                      <VStack gap={0.5}>
                        <Text fontSize="sm" fontWeight="medium" color="cirqueira.grey.200">
                          Arraste seu arquivo PDF aqui ou{' '}
                          <Text as="span" color="cirqueira.brand.400" fontWeight="bold">
                            procure
                          </Text>
                        </Text>
                        <Text fontSize="xs" color="cirqueira.grey.500">
                          Documento PDF de até 500 MB
                        </Text>
                      </VStack>
                    )}
                  </VStack>
                </Box>

                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="semibold" color="cirqueira.grey.200">
                    Título do Livro (opcional)
                  </Field.Label>
                  <Input
                    placeholder="Ex: Dom Casmurro, Clean Code..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    w="full"
                    borderRadius="8px"
                    bg="cirqueira.grey.900/40"
                    borderColor="cirqueira.grey.800"
                    color="cirqueira.grey.0"
                    _placeholder={{ color: 'cirqueira.grey.500' }}
                    h={10}
                  />
                </Field.Root>

                <HStack justify="flex-end" gap={3} pt={2}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    borderRadius="full"
                    color="cirqueira.grey.400"
                    _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
                    onClick={handleFechar}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    borderRadius="full"
                    bg="cirqueira.brand.500"
                    _hover={{ bg: 'cirqueira.brand.600' }}
                    color="cirqueira.grey.0"
                    disabled={!arquivo || uploadMutation.isPending}
                    px={5}
                  >
                    {uploadMutation.isPending ? (
                      <HStack gap={2}>
                        <Spinner size="xs" color="currentColor" />
                        <Text as="span">Enviando PDF...</Text>
                      </HStack>
                    ) : (
                      'Enviar Livro'
                    )}
                  </Button>
                </HStack>
              </form>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
