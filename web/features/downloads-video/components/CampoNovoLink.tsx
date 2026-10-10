import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  Clipboard,
  Cloud,
  Download,
  Folder,
  Globe,
  Instagram,
  Link as LinkIcon,
  Loader2,
  Video,
  X,
  Youtube,
} from 'lucide-react'
import { type FormEvent, memo, useState } from 'react'
import { useCategorias, useCriarDownload } from '../hooks/useDownloadsVideo'

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
      colorPalette: 'blue',
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
  const [categoriaId, setCategoriaId] = useState('')
  const { data: categorias = [], isLoading: carregandoCategorias } = useCategorias()
  const { mutate: criarDownload, isPending } = useCriarDownload()

  const plataforma = identificarPlataforma(url)
  const IconePlataforma = plataforma?.icone || Globe
  const categoriaSelecionada = categorias.find((c) => c.uuid === categoriaId)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const urlFormatada = url.trim()
    if (!urlFormatada || isPending) {
      return
    }

    criarDownload(
      {
        url: urlFormatada,
        categoriaId: categoriaId.trim() ? categoriaId.trim() : null,
      },
      {
        onSuccess: () => {
          setUrl('')
          setCategoriaId('')
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
    <Card.Root
      w="full"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      shadow="sm"
    >
      <Card.Body p={{ base: 4, md: 5 }}>
        <Box as="form" onSubmit={handleSubmit}>
          <VStack gap={4} alignItems="stretch">
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              justify="space-between"
              align={{ base: 'flex-start', sm: 'center' }}
              gap={2}
            >
              <HStack gap={3}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="cirqueira.brand.500/10"
                  color="cirqueira.brand.500"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Download size={18} />
                </Box>
                <VStack align="start" gap={0}>
                  <Text as="h2" fontSize="sm" fontWeight="bold" color="fg">
                    Novo Download de Vídeo
                  </Text>
                  <Text fontSize="xs" color="fg.subtle">
                    Cole o link público de vídeos do YouTube, TikTok, Instagram ou X
                  </Text>
                </VStack>
              </HStack>

              {plataforma && (
                <Badge
                  variant="subtle"
                  colorPalette={plataforma.colorPalette}
                  fontSize="xs"
                  fontWeight="medium"
                  px={2.5}
                  py={1}
                  borderRadius="md"
                >
                  <HStack gap={1.5} alignItems="center">
                    <IconePlataforma size={13} />
                    <Text as="span">{plataforma.nome} detectado</Text>
                  </HStack>
                </Badge>
              )}
            </Flex>

            <Flex
              direction={{ base: 'column', lg: 'row' }}
              align={{ base: 'stretch', lg: 'center' }}
              gap={2.5}
            >
              <Box position="relative" flex={1} display="flex" alignItems="center">
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  zIndex={2}
                  color="fg.subtle"
                >
                  <LinkIcon size={15} />
                </Box>

                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Cole aqui o link do vídeo..."
                  disabled={isPending}
                  required
                  w="full"
                  h={10}
                  pl={9}
                  pr={20}
                  bg="bg.muted"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  fontSize="xs"
                />

                <HStack position="absolute" right={2} gap={1} zIndex={3}>
                  {url ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setUrl('')}
                      aria-label="Limpar link"
                      p={1}
                      borderRadius="lg"
                    >
                      <X size={15} />
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
                      <Clipboard size={13} style={{ marginRight: '4px' }} />
                      <Text as="span">Colar</Text>
                    </Button>
                  )}
                </HStack>
              </Box>

              <Box w={{ base: 'full', lg: '64' }}>
                <NativeSelect.Root size="sm" w="full" disabled={isPending || carregandoCategorias}>
                  <NativeSelect.Field
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    bg="bg.muted"
                    borderColor="border.subtle"
                    borderRadius="lg"
                    fontSize="xs"
                    h={10}
                  >
                    <option value="">Classificar depois (manual)</option>
                    {categorias.map((cat) => (
                      <option key={cat.uuid} value={cat.uuid}>
                        {cat.nome} {cat.googlePhotosAlbumId ? '☁️ (Google Fotos)' : '📁 (Local)'}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>

              <Button
                type="submit"
                colorPalette="brand"
                disabled={!url.trim() || isPending}
                h={10}
                px={5}
                fontWeight="semibold"
                fontSize="xs"
                flexShrink={0}
                borderRadius="lg"
              >
                {isPending ? (
                  <>
                    <Loader2
                      size={15}
                      style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                    />
                    <Text as="span">Iniciando...</Text>
                  </>
                ) : (
                  <>
                    <Download size={15} style={{ marginRight: '6px' }} />
                    <Text as="span">Baixar Vídeo</Text>
                  </>
                )}
              </Button>
            </Flex>

            {categoriaSelecionada && (
              <HStack gap={2} flexWrap="wrap">
                <Badge
                  variant="subtle"
                  colorPalette={categoriaSelecionada.googlePhotosAlbumId ? 'teal' : 'purple'}
                  fontSize="xs"
                  fontWeight="medium"
                  px={2.5}
                  py={1}
                  borderRadius="md"
                >
                  <HStack gap={1.5} alignItems="center">
                    {categoriaSelecionada.googlePhotosAlbumId ? (
                      <Cloud size={13} />
                    ) : (
                      <Folder size={13} />
                    )}
                    <Text as="span">
                      Destino: {categoriaSelecionada.nome}
                      {categoriaSelecionada.googlePhotosAlbumId
                        ? ' (Sincroniza no Google Fotos)'
                        : ' (Armazenamento local)'}
                    </Text>
                  </HStack>
                </Badge>
              </HStack>
            )}
          </VStack>
        </Box>
      </Card.Body>
    </Card.Root>
  )
})
