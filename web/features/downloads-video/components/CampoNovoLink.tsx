import { Badge, Box, Button, Card, Flex, HStack, Input, VStack } from '@chakra-ui/react'
import { Clipboard, Download, Globe, Instagram, Loader2, Video, X, Youtube } from 'lucide-react'
import { type FormEvent, memo, useState } from 'react'
import { useCriarDownload } from '../hooks/useDownloadsVideo'

export interface CampoNovoLinkProps {
  onDownloadIniciado?: () => void
}

function identificarPlataforma(url: string): {
  nome: string
  icone: typeof Youtube
  colorPalette: string
} | null {
  if (!url || !url.trim()) {
    return null
  }

  const urlLimpa = url.toLowerCase()

  if (urlLimpa.includes('youtube.com') || urlLimpa.includes('youtu.be')) {
    return { nome: 'YouTube', icone: Youtube, colorPalette: 'red' }
  }

  if (urlLimpa.includes('tiktok.com')) {
    return {
      nome: 'TikTok',
      icone: Video,
      colorPalette: 'cyan',
    }
  }

  if (urlLimpa.includes('twitter.com') || urlLimpa.includes('x.com')) {
    return {
      nome: 'X / Twitter',
      icone: Globe,
      colorPalette: 'sky',
    }
  }

  if (urlLimpa.includes('instagram.com')) {
    return {
      nome: 'Instagram',
      icone: Instagram,
      colorPalette: 'pink',
    }
  }

  return { nome: 'Vídeo Web', icone: Globe, colorPalette: 'gray' }
}

export const CampoNovoLink = memo(function CampoNovoLink({
  onDownloadIniciado,
}: CampoNovoLinkProps) {
  const [url, setUrl] = useState('')
  const { mutate: criarDownload, isPending } = useCriarDownload()

  const plataforma = identificarPlataforma(url)
  const IconePlataforma = plataforma?.icone || Globe

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const urlFormatada = url.trim()
    if (!urlFormatada || isPending) {
      return
    }

    criarDownload(
      { url: urlFormatada },
      {
        onSuccess: () => {
          setUrl('')
          onDownloadIniciado?.()
        },
      }
    )
  }

  const colarAreaTransferencia = async () => {
    try {
      const texto = await navigator.clipboard.readText()
      if (texto) {
        setUrl(texto.trim())
      }
    } catch {}
  }

  return (
    <Card.Root w="full" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" bg="bg.panel" shadow="sm">
      <Card.Body p={{ base: 4, sm: 5 }}>
        <form onSubmit={handleSubmit}>
          <VStack gap={3} alignItems="stretch">
            <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} gap={2.5}>
              <Box position="relative" flex={1} display="flex" alignItems="center">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Cole aqui o link do YouTube, TikTok, Twitter ou Instagram..."
                  disabled={isPending}
                  required
                  w="full"
                  h={12}
                  pr={24}
                  bg="bg.muted"
                  borderColor="border.subtle"
                  borderRadius="xl"
                />

                <HStack position="absolute" right={2.5} gap={1}>
                  {url ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setUrl('')}
                      aria-label="Limpar campo"
                      p={1}
                    >
                      <X size={16} />
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={colarAreaTransferencia}
                      fontSize="xs"
                      borderRadius="lg"
                      px={2}
                      py={1}
                    >
                      <Clipboard size={14} style={{ marginRight: '4px' }} />
                      <span>Colar</span>
                    </Button>
                  )}
                </HStack>
              </Box>

              <Button
                type="submit"
                colorPalette="brand"
                disabled={!url.trim() || isPending}
                h={12}
                px={6}
                fontWeight="semibold"
                fontSize="sm"
                flexShrink={0}
                borderRadius="xl"
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }} />
                    <span>Iniciando...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} style={{ marginRight: '6px' }} />
                    <span>Baixar Vídeo</span>
                  </>
                )}
              </Button>
            </Flex>

            {plataforma && (
              <HStack gap={2}>
                <Badge
                  variant="subtle"
                  colorPalette={plataforma.colorPalette}
                  fontSize="xs"
                  fontWeight="medium"
                  px={2.5}
                  py={1}
                  borderRadius="full"
                >
                  <HStack gap={1} alignItems="center">
                    <IconePlataforma size={14} />
                    <span>{plataforma.nome} detectado</span>
                  </HStack>
                </Badge>
              </HStack>
            )}
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
})

