import { addToast } from '@/shared/components/ui/toaster'
import {
  Box,
  Button,
  Center,
  Dialog,
  HStack,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { Download, ImageIcon, Share2, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { CapsulaMensal } from '../types'
import { type ImagensCapsula, baixarImagem, compartilharImagem, gerarImagemCapsula } from '../utils'

export interface BotaoImagemCapsulaProps {
  capsula: CapsulaMensal | undefined
  imagens: ImagensCapsula
}

export const BotaoImagemCapsula = memo(function BotaoImagemCapsula({
  capsula,
  imagens,
}: BotaoImagemCapsulaProps) {
  const [previa, setPrevia] = useState<{ url: string; blob: Blob } | null>(null)
  const nomeArquivo = capsula
    ? `capsula-sonora-${capsula.ano}-${String(capsula.mes).padStart(2, '0')}.png`
    : 'capsula-sonora.png'

  const gerar = useMutation({
    mutationFn: async () => {
      if (!capsula) throw new Error('Cápsula indisponível')
      return gerarImagemCapsula(capsula, imagens)
    },
    onSuccess: (blob) => setPrevia({ url: URL.createObjectURL(blob), blob }),
    onError: () => addToast({ type: 'error', title: 'Não foi possível gerar a imagem.' }),
  })

  const compartilhar = useMutation({
    mutationFn: async () => (previa ? compartilharImagem(previa.blob, nomeArquivo) : false),
    onSuccess: (compartilhou) => {
      if (!compartilhou && previa) baixarImagem(previa.url, nomeArquivo)
    },
  })

  function fechar() {
    if (previa) URL.revokeObjectURL(previa.url)
    setPrevia(null)
  }

  return (
    <>
      <Button
        size="sm"
        h="36px"
        px={3}
        borderRadius="full"
        bg="cirqueira.spotify.verde"
        color="cirqueira.spotify.fundo"
        _hover={{ opacity: 0.9 }}
        onClick={() => gerar.mutate()}
        loading={gerar.isPending}
        disabled={!capsula}
      >
        <ImageIcon size={14} />
        <Text as="span" fontSize="xs" fontWeight="bold">
          Gerar imagem
        </Text>
      </Button>

      <Dialog.Root
        open={Boolean(previa)}
        onOpenChange={(detalhes) => !detalhes.open && fechar()}
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
          <Dialog.Positioner p={4}>
            <Dialog.Content
              bg="cirqueira.spotify.cartao"
              color="cirqueira.spotify.textoPrincipal"
              border="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
              borderRadius="12px"
              maxW="420px"
              w="full"
              p={4}
            >
              <HStack justify="space-between" mb={3}>
                <Dialog.Title fontSize="md" fontWeight="bold">
                  Sua Cápsula em imagem
                </Dialog.Title>
                <Dialog.CloseTrigger asChild position="static">
                  <Button size="xs" variant="ghost" color="cirqueira.spotify.textoSecundario">
                    <X size={16} />
                  </Button>
                </Dialog.CloseTrigger>
              </HStack>
              <VStack gap={3} align="stretch">
                {previa ? (
                  <Box
                    as="img"
                    src={previa.url}
                    alt="Prévia da Cápsula Sonora"
                    w="full"
                    borderRadius="8px"
                    maxH="60vh"
                    objectFit="contain"
                  />
                ) : (
                  <Center h="300px">
                    <Spinner color="cirqueira.spotify.verde" />
                  </Center>
                )}
                <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
                  As capas aparecem inteiras e a imagem leva a atribuição ao Spotify, como pedem as
                  regras da marca.
                </Text>
                <HStack gap={2}>
                  <Button
                    flex={1}
                    size="sm"
                    borderRadius="full"
                    variant="outline"
                    borderColor="cirqueira.spotify.cartaoElevado"
                    color="cirqueira.spotify.textoPrincipal"
                    onClick={() => previa && baixarImagem(previa.url, nomeArquivo)}
                  >
                    <Download size={14} /> Baixar PNG
                  </Button>
                  <Button
                    flex={1}
                    size="sm"
                    borderRadius="full"
                    bg="cirqueira.spotify.verde"
                    color="cirqueira.spotify.fundo"
                    onClick={() => compartilhar.mutate()}
                    loading={compartilhar.isPending}
                  >
                    <Share2 size={14} /> Compartilhar
                  </Button>
                </HStack>
              </VStack>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
})
