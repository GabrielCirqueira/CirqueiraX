import { AppContainer } from '@/layouts/AppContainer'
import { Box, Button, Card, Flex, Grid, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, CheckCircle2, FolderSync, Images, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { AvisoMigracaoAlbuns } from './components/AvisoMigracaoAlbuns'
import { GateConexaoGoogle } from './components/GateConexaoGoogle'
import { GridAlbuns } from './components/GridAlbuns'
import { ModalVincularAlbum } from './components/ModalVincularAlbum'
import { useAlbunsGoogleFotos } from './hooks/useGoogleFotos'
import type { AlbumGoogleFotos } from './types'

export default function GoogleFotos() {
  const [albumVinculando, setAlbumVinculando] = useState<AlbumGoogleFotos | null>(null)
  const { data: respostaAlbuns, isLoading, isFetching, refetch } = useAlbunsGoogleFotos()

  const resumo = respostaAlbuns?.resumo ?? {
    totalAlbuns: 0,
    totalVinculados: 0,
    totalOrfaos: 0,
    totalCategoriasSemAlbum: 0,
  }

  return (
    <AppContainer maxWidth="7xl" paddingY="8" paddingX="6">
      <VStack w="full" gap={8} alignItems="stretch">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap={4}
          borderBottomWidth="1px"
          borderColor="border.subtle"
          pb={6}
        >
          <VStack gap={1} alignItems="flex-start">
            <HStack gap={2.5}>
              <Box p={2} borderRadius="xl" bg="teal.500/10" color="teal.500">
                <Icon as={Images} boxSize={6} />
              </Box>
              <Text as="h1" fontSize="2xl" fontWeight="bold" color="fg">
                Álbuns do Google Fotos
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.subtle">
              Gerencie os álbuns criados e sincronizados pelo CirqueiraX e associe-os com as pastas
              de categorias locais.
            </Text>
          </VStack>

          <Button
            size="sm"
            variant="ghost"
            disabled={isFetching}
            onClick={() => refetch()}
            borderRadius="xl"
          >
            <RefreshCw
              size={14}
              style={{
                animation: isFetching ? 'spin 1s linear infinite' : 'none',
                marginRight: '6px',
              }}
            />
            <Text as="span">Atualizar Álbuns</Text>
          </Button>
        </Flex>

        <GateConexaoGoogle>
          <Grid
            templateColumns={{
              base: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
            gap={4}
            w="full"
          >
            <Card.Root borderWidth="1px" borderColor="border.subtle" bg="bg.panel" shadow="sm">
              <Card.Body p={4}>
                <HStack justify="space-between" align="flex-start">
                  <VStack align="flex-start" gap={1}>
                    <Text fontSize="xs" fontWeight="medium" color="fg.subtle">
                      Total de Álbuns CirqueiraX
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="fg">
                      {isLoading ? '...' : resumo.totalAlbuns}
                    </Text>
                  </VStack>
                  <Box p={2} borderRadius="xl" bg="teal.500/10" color="teal.500">
                    <Icon as={Images} boxSize={5} />
                  </Box>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root borderWidth="1px" borderColor="border.subtle" bg="bg.panel" shadow="sm">
              <Card.Body p={4}>
                <HStack justify="space-between" align="flex-start">
                  <VStack align="flex-start" gap={1}>
                    <Text fontSize="xs" fontWeight="medium" color="fg.subtle">
                      Álbuns Vinculados
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {isLoading ? '...' : resumo.totalVinculados}
                    </Text>
                  </VStack>
                  <Box p={2} borderRadius="xl" bg="green.500/10" color="green.500">
                    <Icon as={CheckCircle2} boxSize={5} />
                  </Box>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root borderWidth="1px" borderColor="border.subtle" bg="bg.panel" shadow="sm">
              <Card.Body p={4}>
                <HStack justify="space-between" align="flex-start">
                  <VStack align="flex-start" gap={1}>
                    <Text fontSize="xs" fontWeight="medium" color="fg.subtle">
                      Álbuns Sem Vínculo (Órfãos)
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="amber.500">
                      {isLoading ? '...' : resumo.totalOrfaos}
                    </Text>
                  </VStack>
                  <Box p={2} borderRadius="xl" bg="amber.500/10" color="amber.500">
                    <Icon as={AlertTriangle} boxSize={5} />
                  </Box>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root borderWidth="1px" borderColor="border.subtle" bg="bg.panel" shadow="sm">
              <Card.Body p={4}>
                <HStack justify="space-between" align="flex-start">
                  <VStack align="flex-start" gap={1}>
                    <Text fontSize="xs" fontWeight="medium" color="fg.subtle">
                      Categorias Sem Álbum
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                      {isLoading ? '...' : resumo.totalCategoriasSemAlbum}
                    </Text>
                  </VStack>
                  <Box p={2} borderRadius="xl" bg="purple.500/10" color="purple.500">
                    <Icon as={FolderSync} boxSize={5} />
                  </Box>
                </HStack>
              </Card.Body>
            </Card.Root>
          </Grid>

          <AvisoMigracaoAlbuns />

          <GridAlbuns
            albuns={respostaAlbuns?.albuns}
            carregando={isLoading}
            onVincularAlbum={(album) => setAlbumVinculando(album)}
          />

          <ModalVincularAlbum
            album={albumVinculando}
            aberto={Boolean(albumVinculando)}
            onFechar={() => setAlbumVinculando(null)}
            onSucesso={() => refetch()}
          />
        </GateConexaoGoogle>
      </VStack>
    </AppContainer>
  )
}

export { GoogleFotos as Component }
