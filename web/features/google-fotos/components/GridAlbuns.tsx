import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  HStack,
  Heading,
  Icon,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertCircle,
  CheckCircle2,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Images,
  Layers,
  LayoutDashboard,
} from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { AlbumGoogleFotos } from '../types'

export interface GridAlbunsProps {
  albuns?: AlbumGoogleFotos[]
  carregando?: boolean
  onVincularAlbum?: (album: AlbumGoogleFotos) => void
}

export const GridAlbuns = memo(function GridAlbuns({
  albuns = [],
  carregando = false,
  onVincularAlbum,
}: GridAlbunsProps) {
  if (carregando && albuns.length === 0) {
    return (
      <Grid
        templateColumns={{
          base: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
          xl: 'repeat(4, 1fr)',
        }}
        gap={6}
        w="full"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Card.Root
            key={`skeleton-album-${index}`}
            borderRadius="2xl"
            overflow="hidden"
            border="1px solid"
            borderColor="border.subtle"
          >
            <Skeleton h="180px" w="full" />
            <Card.Body p={4}>
              <VStack gap={3} align="stretch">
                <Skeleton h={5} w="70%" borderRadius="md" />
                <Skeleton h={4} w="40%" borderRadius="md" />
                <Skeleton h={8} w="full" borderRadius="xl" mt={2} />
              </VStack>
            </Card.Body>
          </Card.Root>
        ))}
      </Grid>
    )
  }

  if (albuns.length === 0) {
    return (
      <Card.Root
        w="full"
        p={8}
        borderRadius="2xl"
        border="1px dashed"
        borderColor="border.subtle"
        bg="bg.subtle"
      >
        <VStack gap={4} align="center" textAlign="center" py={8}>
          <Box p={4} borderRadius="full" bg="teal.500/10" color="teal.500">
            <Icon as={FolderPlus} boxSize={10} />
          </Box>
          <VStack gap={1}>
            <Heading size="md">Nenhum álbum do CirqueiraX encontrado</Heading>
            <Text fontSize="sm" color="fg.muted" maxW="md">
              Os álbuns criados pelo CirqueiraX serão exibidos aqui automaticamente assim que a
              primeira mídia de cada categoria for enviada ou vinculada.
            </Text>
          </VStack>
        </VStack>
      </Card.Root>
    )
  }

  return (
    <Grid
      templateColumns={{
        base: '1fr',
        sm: 'repeat(2, 1fr)',
        lg: 'repeat(3, 1fr)',
        xl: 'repeat(4, 1fr)',
      }}
      gap={6}
      w="full"
    >
      {albuns.map((album) => {
        const vinculado = album.vinculado && Boolean(album.categoria)

        return (
          <Card.Root
            key={album.id}
            borderRadius="2xl"
            overflow="hidden"
            border="1px solid"
            borderColor={vinculado ? 'border.subtle' : 'amber.500/30'}
            bg="bg.panel"
            shadow="sm"
            transition="all 0.2s ease"
            _hover={{
              shadow: 'md',
              transform: 'translateY(-2px)',
              borderColor: vinculado ? 'teal.500/40' : 'amber.500/60',
            }}
          >
            <Box position="relative" h="180px" w="full" overflow="hidden" bg="bg.muted">
              {album.urlCapa ? (
                <Box
                  w="full"
                  h="full"
                  backgroundImage={`url(${album.urlCapa})`}
                  backgroundSize="cover"
                  backgroundPosition="center"
                  transition="transform 0.3s ease"
                  _hover={{ transform: 'scale(1.05)' }}
                />
              ) : (
                <Flex
                  w="full"
                  h="full"
                  align="center"
                  justify="center"
                  bg="teal.500/5"
                  color="teal.500"
                >
                  <Icon as={Images} boxSize={12} opacity={0.6} />
                </Flex>
              )}

              <Box
                position="absolute"
                inset={0}
                bgGradient="to-t"
                gradientFrom="black/70"
                gradientVia="black/20"
                gradientTo="transparent"
              />

              <HStack
                position="absolute"
                top={3}
                left={3}
                right={3}
                justify="space-between"
                align="center"
              >
                <Badge
                  colorPalette={vinculado ? 'green' : 'amber'}
                  variant="solid"
                  size="sm"
                  borderRadius="full"
                  px={2.5}
                  py={0.5}
                  shadow="sm"
                >
                  <Icon as={vinculado ? CheckCircle2 : AlertCircle} />
                  {vinculado ? album.categoria?.nome : 'Sem Vínculo'}
                </Badge>

                <Badge
                  colorPalette="gray"
                  variant="solid"
                  size="sm"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  bg="black/60"
                  color="white"
                >
                  <Icon as={ImageIcon} />
                  {album.totalItens} {album.totalItens === 1 ? 'item' : 'itens'}
                </Badge>
              </HStack>
            </Box>

            <Card.Body p={4}>
              <VStack gap={3} align="stretch">
                <VStack gap={1} align="flex-start">
                  <Heading size="sm" lineClamp={1} title={album.titulo} color="fg">
                    {album.titulo}
                  </Heading>

                  {vinculado && album.categoria ? (
                    <HStack gap={1.5} fontSize="xs" color="fg.muted">
                      <Icon as={Folder} boxSize={3.5} color="teal.500" />
                      <Text lineClamp={1}>
                        Pasta:{' '}
                        <Text as="span" fontFamily="mono">
                          /{album.categoria.pastaLocal}
                        </Text>
                      </Text>
                    </HStack>
                  ) : (
                    <HStack gap={1.5} fontSize="xs" color="amber.600">
                      <Icon as={AlertCircle} boxSize={3.5} />
                      <Text lineClamp={1}>Álbum órfão (sem categoria associada)</Text>
                    </HStack>
                  )}
                </VStack>

                {vinculado ? (
                  <HStack gap={2} w="full">
                    <Button
                      colorPalette="gray"
                      variant="outline"
                      size="sm"
                      borderRadius="xl"
                      flex={1}
                      onClick={() => onVincularAlbum?.(album)}
                    >
                      <Icon as={Layers} />
                      Alterar
                    </Button>

                    <Link to="/dashboard">
                      <Button
                        variant="subtle"
                        size="sm"
                        borderRadius="xl"
                        colorPalette="purple"
                        px={2.5}
                        title="Ver categoria no Dashboard"
                      >
                        <Icon as={LayoutDashboard} />
                        <Text as="span">Dashboard</Text>
                      </Button>
                    </Link>
                  </HStack>
                ) : (
                  <Button
                    colorPalette="teal"
                    variant="solid"
                    size="sm"
                    borderRadius="xl"
                    w="full"
                    onClick={() => onVincularAlbum?.(album)}
                  >
                    <Icon as={Layers} />
                    Vincular à Categoria
                  </Button>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        )
      })}
    </Grid>
  )
})
