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
  Layers,
  ListPlus,
  Loader2,
  Video,
  X,
  Youtube,
  Zap,
} from 'lucide-react'
import { type FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCategorias } from '../hooks/useDownloadsVideo'
import { useFilaDownloadsStore } from '../stores/useFilaDownloadsStore'
import { extrairUrlsTexto } from '../utils/extrairUrls'
import { identificarPlataforma } from '../utils/plataformaVideo'

export interface CampoNovoLinkProps {
  onDownloadIniciado?: () => void
}

export const CampoNovoLink = memo(function CampoNovoLink({
  onDownloadIniciado,
}: CampoNovoLinkProps) {
  // Modo: 'unico' (input rápido) ou 'lote' (textarea para vários links)
  const [modo, setModo] = useState<'unico' | 'lote'>('unico')

  const [url, setUrl] = useState('')
  const [textoLote, setTextoLote] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [emFoco, setEmFoco] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: categorias = [], isLoading: carregandoCategorias } = useCategorias()
  const { adicionarUrls, itens, processandoAtivo } = useFilaDownloadsStore()

  const plataforma = identificarPlataforma(url)
  const IconePlataforma = plataforma?.icone || Globe
  const categoriaSelecionada = categorias.find((c) => c.uuid === categoriaId)
  const expandido = Boolean(url.trim())

  // Múltiplos links detectados no modo lote
  const urlsLoteDetectadas = useMemo(() => extrairUrlsTexto(textoLote), [textoLote])

  const itensPendentesOuBaixando = itens.filter(
    (it) => it.status === 'pendente' || it.status === 'baixando'
  )

  const adicionarLinkAFila = useCallback(
    (linksParaAdicionar: string[]) => {
      if (linksParaAdicionar.length === 0) return

      const catId = categoriaId.trim() ? categoriaId.trim() : null
      const nomeCat = categoriaSelecionada?.nome

      adicionarUrls(linksParaAdicionar, catId, nomeCat, onDownloadIniciado)
      setUrl('')
      setTextoLote('')
    },
    [categoriaId, categoriaSelecionada?.nome, adicionarUrls, onDownloadIniciado]
  )

  // Tratamento de paste global: se colar 1 ou mais links em qualquer lugar da tela
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      const isSearchInput =
        target?.getAttribute('placeholder')?.toLowerCase().includes('buscar') ||
        target?.getAttribute('type') === 'search'

      if (isSearchInput) return

      const pastedText = e.clipboardData?.getData('text')?.trim()
      if (!pastedText) return

      const urlsExtraidas = extrairUrlsTexto(pastedText)

      // Se tiver múltiplos links colados, enfileira todos automaticamente!
      if (urlsExtraidas.length > 1) {
        e.preventDefault()
        adicionarLinkAFila(urlsExtraidas)
        return
      }

      // Se for um link único conhecido
      if (urlsExtraidas.length === 1 && urlsExtraidas[0]) {
        const primeiroLink = urlsExtraidas[0]
        const infoPlat = identificarPlataforma(primeiroLink)
        if (infoPlat?.conhecido) {
          e.preventDefault()
          adicionarLinkAFila([primeiroLink])
          return
        }

        if (modo === 'unico') {
          e.preventDefault()
          setUrl(primeiroLink)
          inputRef.current?.focus()
        }
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => {
      window.removeEventListener('paste', handleGlobalPaste)
    }
  }, [modo, adicionarLinkAFila])

  const handleSubmitUnico = (e: FormEvent) => {
    e.preventDefault()
    const urlFormatada = url.trim()
    if (!urlFormatada) return

    // Se o usuário colou múltiplos links dentro do campo de input único
    const urlsExtraidas = extrairUrlsTexto(urlFormatada)
    if (urlsExtraidas.length > 1) {
      adicionarLinkAFila(urlsExtraidas)
      return
    }

    adicionarLinkAFila([urlFormatada])
  }

  const handleSubmitLote = (e: FormEvent) => {
    e.preventDefault()
    if (urlsLoteDetectadas.length === 0) return
    adicionarLinkAFila(urlsLoteDetectadas)
    setModo('unico')
  }

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text')?.trim()
    if (!pastedText) return

    const urlsExtraidas = extrairUrlsTexto(pastedText)
    if (urlsExtraidas.length > 1) {
      e.preventDefault()
      adicionarLinkAFila(urlsExtraidas)
    }
  }

  const colarAreaTransferencia = async () => {
    try {
      const texto = await navigator.clipboard.readText()
      const textoLimpo = texto?.trim()
      if (!textoLimpo) return

      const urlsExtraidas = extrairUrlsTexto(textoLimpo)
      if (urlsExtraidas.length > 1) {
        adicionarLinkAFila(urlsExtraidas)
        return
      }

      if (urlsExtraidas.length === 1) {
        adicionarLinkAFila(urlsExtraidas)
        return
      }

      setUrl(textoLimpo)
      inputRef.current?.focus()
    } catch {}
  }

  return (
    <Box
      w="full"
      bg="bg.panel"
      borderWidth="1px"
      borderColor={emFoco || expandido || modo === 'lote' ? 'cirqueira.brand.500' : 'border.subtle'}
      borderRadius="xl"
      shadow={emFoco || expandido || modo === 'lote' ? 'md' : 'xs'}
      transition="all 0.25s ease"
      p={3}
      px={{ base: 3.5, md: 4 }}
    >
      <VStack gap={3} align="stretch">
        {/* Barra superior de alternância entre Modo Rápido e Modo em Lote */}
        <Flex align="center" justify="space-between" gap={2} flexWrap="wrap">
          <HStack gap={2} align="center">
            <Box
              p={1.5}
              borderRadius="lg"
              bg={processandoAtivo ? 'cirqueira.brand.500/15' : 'bg.muted'}
              color={processandoAtivo ? 'cirqueira.brand.400' : 'fg.subtle'}
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
            >
              {processandoAtivo ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Zap size={16} />
              )}
            </Box>

            <HStack gap={1} p={0.5} bg="bg.muted" borderRadius="lg">
              <Button
                size="xs"
                variant={modo === 'unico' ? 'solid' : 'ghost'}
                colorPalette={modo === 'unico' ? 'brand' : 'gray'}
                onClick={() => setModo('unico')}
                borderRadius="md"
                h={7}
                px={2.5}
                fontSize="xs"
                fontWeight="semibold"
              >
                Link Único
              </Button>
              <Button
                size="xs"
                variant={modo === 'lote' ? 'solid' : 'ghost'}
                colorPalette={modo === 'lote' ? 'brand' : 'gray'}
                onClick={() => {
                  setModo('lote')
                  setTimeout(() => textareaRef.current?.focus(), 50)
                }}
                borderRadius="md"
                h={7}
                px={2.5}
                fontSize="xs"
                fontWeight="semibold"
              >
                <HStack gap={1.5}>
                  <ListPlus size={13} />
                  <Text as="span">Vários Links (Fila)</Text>
                </HStack>
              </Button>
            </HStack>
          </HStack>

          {/* Indicador de fila ativa */}
          {itensPendentesOuBaixando.length > 0 && (
            <Badge size="xs" variant="subtle" colorPalette="brand" borderRadius="md" px={2} py={0.5}>
              <HStack gap={1}>
                <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                <Text as="span">
                  {itensPendentesOuBaixando.length}{' '}
                  {itensPendentesOuBaixando.length === 1
                    ? 'vídeo processando na fila'
                    : 'vídeos processando na fila'}
                </Text>
              </HStack>
            </Badge>
          )}
        </Flex>

        {/* ── MODO 1: LINK ÚNICO RÁPIDO ──────────────────────────────────── */}
        {modo === 'unico' && (
          <Box as="form" onSubmit={handleSubmitUnico} w="full">
            <VStack gap={3} align="stretch">
              <Flex align="center" gap={3}>
                <Box position="relative" flex={1}>
                  <Input
                    ref={inputRef}
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onPaste={handleInputPaste}
                    onFocus={() => setEmFoco(true)}
                    onBlur={() => setEmFoco(false)}
                    placeholder="Cole o link do YouTube, TikTok, Instagram ou X (ou cole múltiplos links)..."
                    variant="flushed"
                    fontSize={{ base: 'xs', sm: 'sm' }}
                    fontWeight="medium"
                    h={10}
                    pr={expandido ? 8 : 28}
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
                    colorPalette="brand"
                    flexShrink={0}
                  >
                    <Clipboard size={13} style={{ marginRight: '6px' }} />
                    <Text as="span">Colar e Baixar</Text>
                    <Text as="kbd" ml={2} fontSize="10px" opacity={0.6}>
                      Ctrl+V
                    </Text>
                  </Button>
                )}
              </Flex>

              {!expandido && (
                <HStack gap={2} pt={0.5} px={1} flexWrap="wrap" align="center">
                  <Text fontSize="11px" color="fg.subtle" fontWeight="medium">
                    Plataformas suportadas:
                  </Text>
                  <HStack gap={1.5} flexWrap="wrap">
                    <Badge size="xs" variant="subtle" colorPalette="red" borderRadius="md" px={2} py={0.5}>
                      <HStack gap={1} alignItems="center">
                        <Youtube size={11} />
                        <Text as="span" fontSize="10px">YouTube</Text>
                      </HStack>
                    </Badge>
                    <Badge size="xs" variant="subtle" colorPalette="cyan" borderRadius="md" px={2} py={0.5}>
                      <HStack gap={1} alignItems="center">
                        <Video size={11} />
                        <Text as="span" fontSize="10px">TikTok</Text>
                      </HStack>
                    </Badge>
                    <Badge size="xs" variant="subtle" colorPalette="pink" borderRadius="md" px={2} py={0.5}>
                      <HStack gap={1} alignItems="center">
                        <Instagram size={11} />
                        <Text as="span" fontSize="10px">Instagram</Text>
                      </HStack>
                    </Badge>
                    <Badge size="xs" variant="subtle" colorPalette="blue" borderRadius="md" px={2} py={0.5}>
                      <HStack gap={1} alignItems="center">
                        <Globe size={11} />
                        <Text as="span" fontSize="10px">X / Twitter</Text>
                      </HStack>
                    </Badge>
                  </HStack>
                </HStack>
              )}

              {expandido && (
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  align={{ base: 'stretch', md: 'center' }}
                  justify="space-between"
                  gap={3}
                  pt={3}
                  borderTopWidth="1px"
                  borderColor="border.subtle"
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
                          <Text as="span">Destino: {categoriaSelecionada.nome}</Text>
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
                      <NativeSelect.Root size="sm" w="full" disabled={carregandoCategorias}>
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
                      disabled={!url.trim()}
                      h={9}
                      px={5}
                      fontWeight="bold"
                      fontSize="xs"
                      flexShrink={0}
                      borderRadius="lg"
                    >
                      <Download size={14} style={{ marginRight: '6px' }} />
                      <Text as="span">Adicionar à Fila</Text>
                    </Button>
                  </HStack>
                </Flex>
              )}
            </VStack>
          </Box>
        )}

        {/* ── MODO 2: VÁRIOS LINKS EM LOTE (TEXTAREA) ───────────────────── */}
        {modo === 'lote' && (
          <Box as="form" onSubmit={handleSubmitLote} w="full">
            <VStack gap={3} align="stretch">
              <Box position="relative">
                <Box
                  as="textarea"
                  ref={textareaRef}
                  value={textoLote}
                  onChange={(e: any) => setTextoLote(e.target.value)}
                  placeholder={`Cole múltiplos links aqui (um por linha ou separados por espaço)...

Exemplo:
https://x.com/usuario/status/123456789
https://www.tiktok.com/@criador/video/987654321
https://youtube.com/watch?v=abcdefghij`}
                  w="full"
                  rows={4}
                  p={3}
                  fontSize="xs"
                  fontFamily="mono"
                  bg="bg.muted/50"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  outline="none"
                  color="fg"
                  _focus={{ borderColor: 'cirqueira.brand.500', bg: 'bg.muted' }}
                  resize="vertical"
                />

                {textoLote && (
                  <Button
                    size="xs"
                    variant="ghost"
                    position="absolute"
                    right={2}
                    top={2}
                    onClick={() => setTextoLote('')}
                    aria-label="Limpar texto"
                    p={1}
                    borderRadius="md"
                    color="fg.subtle"
                  >
                    <X size={14} />
                  </Button>
                )}
              </Box>

              <Flex
                direction={{ base: 'column', sm: 'row' }}
                align={{ base: 'stretch', sm: 'center' }}
                justify="space-between"
                gap={3}
              >
                <HStack gap={2} flexWrap="wrap" align="center">
                  <Badge
                    size="sm"
                    variant={urlsLoteDetectadas.length > 0 ? 'solid' : 'subtle'}
                    colorPalette={urlsLoteDetectadas.length > 0 ? 'brand' : 'gray'}
                    borderRadius="md"
                    px={2.5}
                    py={1}
                  >
                    <HStack gap={1.5}>
                      <Layers size={13} />
                      <Text as="span" fontWeight="bold">
                        {urlsLoteDetectadas.length}{' '}
                        {urlsLoteDetectadas.length === 1 ? 'link detectado' : 'links detectados'}
                      </Text>
                    </HStack>
                  </Badge>

                  {urlsLoteDetectadas.length > 0 && (
                    <Text fontSize="11px" color="fg.subtle">
                      Serão baixados sequencialmente em fila
                    </Text>
                  )}
                </HStack>

                <HStack gap={2.5} justify="flex-end">
                  <Box w={{ base: 'full', sm: '52' }}>
                    <NativeSelect.Root size="sm" w="full" disabled={carregandoCategorias}>
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
                    disabled={urlsLoteDetectadas.length === 0}
                    h={9}
                    px={5}
                    fontWeight="bold"
                    fontSize="xs"
                    borderRadius="lg"
                  >
                    <Download size={14} style={{ marginRight: '6px' }} />
                    <Text as="span">
                      Baixar Todos ({urlsLoteDetectadas.length})
                    </Text>
                  </Button>
                </HStack>
              </Flex>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  )
})
