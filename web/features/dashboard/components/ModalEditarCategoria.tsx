import { Box, Flex, HStack, Text, VStack } from '@/shared/ui/layout'
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  TextField,
  useMediaQuery,
} from '@heroui/react'
import { FolderCheck, Loader2, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAtualizarMapeamentoCategoria } from '../hooks/useDashboard'
import type { CategoriaMetrica } from '../types'

export interface ModalEditarCategoriaProps {
  categoria: CategoriaMetrica | null
  aberto: boolean
  onFechar: () => void
  onSucesso?: () => void
}

export function ModalEditarCategoria({
  categoria,
  aberto,
  onFechar,
  onSucesso,
}: ModalEditarCategoriaProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { mutate: atualizarCategoria, isPending } = useAtualizarMapeamentoCategoria()

  const [nome, setNome] = useState('')
  const [pastaLocal, setPastaLocal] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (categoria) {
      setNome(categoria.nome ?? '')
      setPastaLocal(categoria.pastaLocal ?? '')
      setErro(null)
    }
  }, [categoria])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoria) return

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

  if (!categoria) return null

  return (
    <Modal isOpen={aberto} onOpenChange={(open) => !open && onFechar()}>
      <ModalBackdrop isDismissable>
        <ModalContainer
          placement={isMobile ? 'bottom' : 'center'}
          className={isMobile ? 'rounded-b-none rounded-t-2xl m-0 max-w-full' : ''}
        >
          <ModalDialog className="border border-white/10 bg-zinc-950/90 backdrop-blur-2xl text-white shadow-2xl max-w-md w-full">
            <ModalHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
              <HStack className="gap-2.5">
                <Box className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FolderCheck className="w-5 h-5" />
                </Box>
                <VStack className="gap-0.5">
                  <ModalHeading className="text-base font-semibold text-white">
                    Editar Categoria
                  </ModalHeading>
                  <Text className="text-xs text-white/50">
                    Ajuste o nome e a pasta local de destino
                  </Text>
                </VStack>
              </HStack>
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                onPress={onFechar}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </ModalHeader>

            <form onSubmit={handleSubmit}>
              <ModalBody className="py-4 gap-4">
                {erro && (
                  <Box className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {erro}
                  </Box>
                )}

                <TextField isRequired className="w-full">
                  <Label className="text-xs font-medium text-white/80">Nome da Categoria</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Vídeos Curtos, Memes..."
                    className="mt-1 bg-white/5 border-white/10 text-white focus:border-purple-500"
                  />
                  <FieldError className="text-xs text-rose-400 mt-1" />
                </TextField>

                <TextField isRequired className="w-full">
                  <Label className="text-xs font-medium text-white/80">
                    Pasta Local (subdiretório no storage)
                  </Label>
                  <Input
                    value={pastaLocal}
                    onChange={(e) => setPastaLocal(e.target.value)}
                    placeholder="Ex: videos, prints/empresa..."
                    className="mt-1 bg-white/5 border-white/10 text-white focus:border-purple-500 font-mono text-xs"
                  />
                  <Text className="text-[11px] text-white/40 mt-1">
                    Os arquivos associados a esta categoria serão movidos para esta pasta.
                  </Text>
                </TextField>

                {categoria.googlePhotosAlbumId && (
                  <VStack className="p-3 rounded-xl bg-white/5 border border-white/10 gap-1">
                    <Text className="text-xs font-semibold text-white/70">
                      Integração Google Fotos
                    </Text>
                    <Text className="text-[11px] text-white/40 font-mono break-all">
                      ID do Álbum: {categoria.googlePhotosAlbumId}
                    </Text>
                  </VStack>
                )}
              </ModalBody>

              <ModalFooter className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  onPress={onFechar}
                  className="bg-white/5 text-white/70 hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isDisabled={isPending}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-medium"
                >
                  {isPending ? (
                    <HStack className="gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </HStack>
                  ) : (
                    <HStack className="gap-2">
                      <Save className="w-4 h-4" />
                      <span>Salvar Mapeamento</span>
                    </HStack>
                  )}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  )
}
