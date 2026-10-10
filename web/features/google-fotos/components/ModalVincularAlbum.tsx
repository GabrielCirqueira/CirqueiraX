import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  NativeSelect,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { AlertCircle, Folder, Images, Layers, Save, X } from 'lucide-react'
import { memo, useState } from 'react'
import { useAlbunsGoogleFotos, useTodasCategorias, useVincularAlbum } from '../hooks/useGoogleFotos'
import type { AlbumGoogleFotos, CategoriaVinculo } from '../types'

export interface ModalVincularAlbumProps {
  album?: AlbumGoogleFotos | null
  categoria?: CategoriaVinculo | null
  aberto: boolean
  onFechar: () => void
  onSucesso?: () => void
}

export const ModalVincularAlbum = memo(function ModalVincularAlbum({
  album,
  categoria,
  aberto,
  onFechar,
  onSucesso,
}: ModalVincularAlbumProps) {
  if (!aberto || (!album && !categoria)) return null

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
          maxW="lg"
          w="full"
        >
          <Dialog.Header
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            p={5}
            borderBottomWidth="1px"
            borderColor="border.subtle"
          >
            <HStack gap={3}>
              <Box p={2} borderRadius="lg" bg="cirqueira.teal.500/10" color="cirqueira.teal.500">
                <Icon as={Layers} boxSize={5} />
              </Box>
              <VStack gap={0.5} align="flex-start">
                <Dialog.Title fontSize="base" fontWeight="semibold" color="fg">
                  {album ? 'Vincular Álbum à Categoria' : 'Vincular Categoria a Álbum'}
                </Dialog.Title>
                <Text fontSize="xs" color="fg.muted">
                  Associe o álbum do Google Fotos com a pasta de classificação local
                </Text>
              </VStack>
            </HStack>
            <IconButton size="sm" variant="ghost" onClick={onFechar} aria-label="Fechar modal">
              <Icon as={X} />
            </IconButton>
          </Dialog.Header>

          {album ? (
            <FormularioVincularAlbumParaCategoria
              album={album}
              onFechar={onFechar}
              onSucesso={onSucesso}
            />
          ) : categoria ? (
            <FormularioVincularCategoriaParaAlbum
              categoria={categoria}
              onFechar={onFechar}
              onSucesso={onSucesso}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
})

function FormularioVincularAlbumParaCategoria({
  album,
  onFechar,
  onSucesso,
}: {
  album: AlbumGoogleFotos
  onFechar: () => void
  onSucesso?: () => void
}) {
  const { data: categorias = [], isLoading: carregandoCategorias } = useTodasCategorias()
  const { mutate: vincular, isPending } = useVincularAlbum()
  const [categoriaSelecionadaUuid, setCategoriaSelecionadaUuid] = useState<string>(
    album.categoria?.uuid ?? ''
  )
  const [erro, setErro] = useState<string | null>(null)

  const categoriaAtual = categorias.find((c) => c.uuid === categoriaSelecionadaUuid)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!categoriaSelecionadaUuid) {
      setErro('Por favor, selecione uma categoria para vincular a este álbum.')
      return
    }

    setErro(null)
    vincular(
      {
        uuidCategoria: categoriaSelecionadaUuid,
        googlePhotosAlbumId: album.id,
        nomeCategoria: categoriaAtual?.nome,
      },
      {
        onSuccess: () => {
          onSucesso?.()
          onFechar()
        },
        onError: (err) => {
          setErro(err.message || 'Falha ao vincular o álbum.')
        },
      }
    )
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Dialog.Body p={5}>
        <VStack gap={5} align="stretch">
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
              <HStack gap={2}>
                <Icon as={AlertCircle} />
                <Text>{erro}</Text>
              </HStack>
            </Box>
          )}

          <Box p={4} borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
            <HStack gap={3}>
              {album.urlCapa ? (
                <Box
                  w="56px"
                  h="56px"
                  borderRadius="lg"
                  backgroundImage={`url(${album.urlCapa})`}
                  backgroundSize="cover"
                  backgroundPosition="center"
                  flexShrink={0}
                />
              ) : (
                <Flex
                  w="56px"
                  h="56px"
                  borderRadius="lg"
                  bg="cirqueira.teal.500/10"
                  color="cirqueira.teal.500"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={Images} boxSize={6} />
                </Flex>
              )}
              <VStack align="flex-start" gap={0.5} overflow="hidden">
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="fg.muted">
                  Álbum no Google Fotos
                </Text>
                <Heading size="sm" lineClamp={1}>
                  {album.titulo}
                </Heading>
                <Text fontSize="xs" color="fg.muted">
                  {album.totalItens} {album.totalItens === 1 ? 'item' : 'itens'} no Google Fotos
                </Text>
              </VStack>
            </HStack>
          </Box>

          <VStack gap={2} align="stretch">
            <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
              Selecione a Categoria de Destino
            </Text>

            {carregandoCategorias ? (
              <Flex py={4} justify="center">
                <Spinner size="sm" color="cirqueira.teal.500" />
              </Flex>
            ) : (
              <NativeSelect.Root size="md" w="full">
                <NativeSelect.Field
                  value={categoriaSelecionadaUuid}
                  onChange={(e) => setCategoriaSelecionadaUuid(e.target.value)}
                  bg="bg.muted"
                  borderRadius="lg"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categorias.map((cat) => {
                    const jaTemOutroAlbum =
                      cat.googlePhotosAlbumId && cat.googlePhotosAlbumId !== album.id
                    return (
                      <option key={cat.uuid} value={cat.uuid}>
                        {cat.nome} (/{cat.pastaLocal})
                        {jaTemOutroAlbum ? ' - [Já possui outro álbum]' : ''}
                      </option>
                    )
                  })}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            )}

            {categoriaAtual && (
              <Box
                p={3}
                borderRadius="lg"
                bg="cirqueira.teal.500/5"
                border="1px solid"
                borderColor="cirqueira.teal.500/20"
              >
                <HStack justify="space-between" fontSize="xs">
                  <HStack gap={1.5} color="cirqueira.teal.600">
                    <Icon as={Folder} />
                    <Text fontWeight="medium">Pasta Local: /{categoriaAtual.pastaLocal}</Text>
                  </HStack>
                  <Badge colorPalette="teal" size="xs" variant="subtle" borderRadius="md">
                    Selecionada
                  </Badge>
                </HStack>
              </Box>
            )}
          </VStack>
        </VStack>
      </Dialog.Body>

      <Dialog.Footer p={5} borderTopWidth="1px" borderColor="border.subtle">
        <HStack justify="flex-end" gap={3} w="full">
          <Button
            variant="ghost"
            size="sm"
            borderRadius="lg"
            onClick={onFechar}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            colorPalette="teal"
            size="sm"
            borderRadius="lg"
            loading={isPending}
            disabled={!categoriaSelecionadaUuid}
          >
            <Icon as={Save} />
            Confirmar Vínculo
          </Button>
        </HStack>
      </Dialog.Footer>
    </Box>
  )
}

function FormularioVincularCategoriaParaAlbum({
  categoria,
  onFechar,
  onSucesso,
}: {
  categoria: CategoriaVinculo
  onFechar: () => void
  onSucesso?: () => void
}) {
  const { data: respostaAlbuns, isLoading: carregandoAlbuns } = useAlbunsGoogleFotos()
  const { mutate: vincular, isPending } = useVincularAlbum()
  const [albumSelecionadoId, setAlbumSelecionadoId] = useState<string>('')
  const [erro, setErro] = useState<string | null>(null)

  const albuns = respostaAlbuns?.albuns ?? []
  const albumAtual = albuns.find((a) => a.id === albumSelecionadoId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!albumSelecionadoId) {
      setErro('Por favor, selecione um álbum para vincular a esta categoria.')
      return
    }

    setErro(null)
    vincular(
      {
        uuidCategoria: categoria.uuid,
        googlePhotosAlbumId: albumSelecionadoId,
        nomeCategoria: categoria.nome,
      },
      {
        onSuccess: () => {
          onSucesso?.()
          onFechar()
        },
        onError: (err) => {
          setErro(err.message || 'Falha ao vincular o álbum.')
        },
      }
    )
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Dialog.Body p={5}>
        <VStack gap={5} align="stretch">
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
              <HStack gap={2}>
                <Icon as={AlertCircle} />
                <Text>{erro}</Text>
              </HStack>
            </Box>
          )}

          <Box p={4} borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
            <HStack gap={3}>
              <Flex
                w="56px"
                h="56px"
                borderRadius="lg"
                bg="cirqueira.teal.500/10"
                color="cirqueira.teal.500"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={Folder} boxSize={6} />
              </Flex>
              <VStack align="flex-start" gap={0.5} overflow="hidden">
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="fg.muted">
                  Categoria Selecionada
                </Text>
                <Heading size="sm" lineClamp={1}>
                  {categoria.nome}
                </Heading>
                <Text fontSize="xs" color="fg.muted">
                  Pasta local: /{categoria.pastaLocal}
                </Text>
              </VStack>
            </HStack>
          </Box>

          <VStack gap={2} align="stretch">
            <Text fontSize="xs" fontWeight="semibold" color="fg.subtle">
              Selecione o Álbum do Google Fotos
            </Text>

            {carregandoAlbuns ? (
              <Flex py={4} justify="center">
                <Spinner size="sm" color="cirqueira.teal.500" />
              </Flex>
            ) : albuns.length === 0 ? (
              <Text fontSize="xs" color="fg.muted">
                Nenhum álbum do CirqueiraX disponível para vínculo.
              </Text>
            ) : (
              <NativeSelect.Root size="md" w="full">
                <NativeSelect.Field
                  value={albumSelecionadoId}
                  onChange={(e) => setAlbumSelecionadoId(e.target.value)}
                  bg="bg.muted"
                  borderRadius="lg"
                >
                  <option value="">Selecione um álbum...</option>
                  {albuns.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.titulo} ({alb.totalItens} itens)
                      {alb.vinculado ? ` - [Vinculado: ${alb.categoria?.nome}]` : ' - [Disponível]'}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            )}

            {albumAtual && (
              <Box
                p={3}
                borderRadius="lg"
                bg="cirqueira.teal.500/5"
                border="1px solid"
                borderColor="cirqueira.teal.500/20"
              >
                <HStack justify="space-between" fontSize="xs">
                  <HStack gap={1.5} color="cirqueira.teal.600">
                    <Icon as={Images} />
                    <Text fontWeight="medium">
                      {albumAtual.titulo} ({albumAtual.totalItens} itens)
                    </Text>
                  </HStack>
                  <Badge
                    colorPalette={albumAtual.vinculado ? 'amber' : 'green'}
                    size="xs"
                    variant="subtle"
                    borderRadius="md"
                  >
                    {albumAtual.vinculado ? 'Já Vinculado' : 'Disponível'}
                  </Badge>
                </HStack>
              </Box>
            )}
          </VStack>
        </VStack>
      </Dialog.Body>

      <Dialog.Footer p={5} borderTopWidth="1px" borderColor="border.subtle">
        <HStack justify="flex-end" gap={3} w="full">
          <Button
            variant="ghost"
            size="sm"
            borderRadius="lg"
            onClick={onFechar}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            colorPalette="teal"
            size="sm"
            borderRadius="lg"
            loading={isPending}
            disabled={!albumSelecionadoId}
          >
            <Icon as={Save} />
            Confirmar Vínculo
          </Button>
        </HStack>
      </Dialog.Footer>
    </Box>
  )
}
