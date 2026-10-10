import {
  Badge,
  Box,
  Button,
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
  Loader2,
  Sparkles,
  Video,
  X,
  Youtube,
} from 'lucide-react'
import { type FormEvent, memo, useEffect, useRef, useState } from 'react'
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
  const [emFoco, setEmFoco] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: categorias = [], isLoading: carregandoCategorias } = useCategorias()
  const { mutate: criarDownload, isPending } = useCriarDownload()

  const plataforma = identificarPlataforma(url)
  const IconePlataforma = plataforma?.icone || Globe
  const categoriaSelecionada = categorias.find((c) => c.uuid === categoriaId)
  const expandido = Boolean(url.trim())

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') {
        return
      }

      const pastedText = e.clipboardData?.getData('text')?.trim()
      if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://'))) {
        e.preventDefault()
        setUrl(pastedText)
        inputRef.current?.focus()
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => {
      window.removeEventListener('paste', handleGlobalPaste)
    }
  }, [])

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
        inputRef.current?.focus()
      }
    } catch {}
  }

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      w="full"
      bg="bg.panel"
      borderWidth="1px"
      borderColor={emFoco || expandido ? 'cirqueira.brand.500' : 'border.subtle'}
      borderRadius="xl"
      shadow={emFoco || expandido ? 'md' : 'xs'}
      transition="all 0.25s ease"
      p={3}
      px={{ base: 3.5, md: 4 }}
    >
      <VStack gap={3} align="stretch">
        <Flex align="center" gap={3}>
          <Box
            p={2}
            borderRadius="lg"
            bg={expandido ? 'cirqueira.brand.500' : 'cirqueira.brand.500/10'}
            color={expandido ? 'white' : 'cirqueira.brand.500'}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            transition="all 0.2s ease"
          >
            {expandido ? <Download size={18} /> : <Sparkles size={18} />}
          </Box>

          <Box position="relative" flex={1}>
            <Input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setEmFoco(true)}
              onBlur={() => setEmFoco(false)}
              placeholder="Cole o link do YouTube, TikTok, Instagram ou X (ou pressione Ctrl+V)..."
              disabled={isPending}
              variant="flushed"
              fontSize={{ base: 'xs', sm: 'sm' }}
              fontWeight="medium"
              h={10}
              pr={expandido ? 8 : 20}
              borderBottom="none"
              _focus={{ outline: 'none', borderBottom: 'none' }}
            />

            {url && (
              <Button
                size="xs"
                variant="ghost"
                position="absolute"
                right={0}
                top="50%"
                transform="translateY(-50%)"
                onClick={() => setUrl('')}
                aria-label="Limpar campo"
                p={1}
                borderRadius="lg"
              >
                <X size={15} />
              </Button>
            )}
          </Box>

          {!expandido && (
            <Button
              size="sm"
              variant="subtle"
              onClick={colarAreaTransferencia}
              fontSize="xs"
              borderRadius="lg"
              px={3}
              h={9}
              colorPalette="gray"
              flexShrink={0}
            >
              <Clipboard size={13} style={{ marginRight: '6px' }} />
              <Text as="span">Colar Link</Text>
              <Text as="kbd" ml={2} fontSize="10px" opacity={0.6}>
                Ctrl+V
              </Text>
            </Button>
          )}
        </Flex>

        {expandido && (
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
            gap={3}
            pt={3}
            borderTopWidth="1px"
            borderColor="border.subtle"
            animation="fadeIn 0.2s ease"
          >
            <HStack gap={2} flexWrap="wrap">
              {plataforma && (
                <Badge
                  variant="subtle"
                  colorPalette={plataforma.colorPalette}
                  fontSize="xs"
                  fontWeight="semibold"
                  px={2.5}
                  py={1}
                  borderRadius="md"
                >
                  <HStack gap={1.5} alignItems="center">
                    <IconePlataforma size={13} />
                    <Text as="span">{plataforma.nome}</Text>
                  </HStack>
                </Badge>
              )}

              {categoriaSelecionada ? (
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
                        ? ' (Google Fotos)'
                        : ' (Pasta local)'}
                    </Text>
                  </HStack>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  colorPalette="gray"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  Sem categoria definida
                </Badge>
              )}
            </HStack>

            <HStack gap={2.5} w={{ base: 'full', md: 'auto' }} justify="flex-end">
              <Box w={{ base: 'full', sm: '56' }}>
                <NativeSelect.Root size="sm" w="full" disabled={isPending || carregandoCategorias}>
                  <NativeSelect.Field
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    bg="bg.muted"
                    borderColor="border.subtle"
                    borderRadius="lg"
                    fontSize="xs"
                    h={9}
                  >
                    <option value="">Classificar depois</option>
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
                h={9}
                px={5}
                fontWeight="semibold"
                fontSize="xs"
                flexShrink={0}
                borderRadius="lg"
              >
                {isPending ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                    />
                    <Text as="span">Baixando...</Text>
                  </>
                ) : (
                  <>
                    <Download size={14} style={{ marginRight: '6px' }} />
                    <Text as="span">Iniciar Download</Text>
                  </>
                )}
              </Button>
            </HStack>
          </Flex>
        )}
      </VStack>
    </Box>
  )
})
