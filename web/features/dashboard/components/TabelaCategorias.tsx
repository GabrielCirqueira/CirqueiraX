import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  HStack,
  IconButton,
  Input,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Cloud, Edit3, FileVideo, Folder, HardDrive, Layers, Search } from 'lucide-react'
import { memo, useState } from 'react'
import type { CategoriaMetrica } from '../types'
import { ModalEditarCategoria } from './ModalEditarCategoria'

export interface TabelaCategoriasProps {
  categorias?: CategoriaMetrica[]
  carregando?: boolean
}

export const TabelaCategorias = memo(function TabelaCategorias({
  categorias = [],
  carregando = false,
}: TabelaCategoriasProps) {
  const [busca, setBusca] = useState('')
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaMetrica | null>(null)

  const categoriasFiltradas = categorias.filter((cat) => {
    const termo = busca.toLowerCase().trim()
    if (!termo) return true
    return cat.nome.toLowerCase().includes(termo) || cat.pastaLocal.toLowerCase().includes(termo)
  })

  if (carregando && categorias.length === 0) {
    return (
      <VStack w="full" gap={4} alignItems="stretch">
        <HStack justify="space-between" align="center">
          <Skeleton h={6} w={44} borderRadius="md" />
          <Skeleton h={9} w={60} borderRadius="xl" />
        </HStack>
        <Grid
          w="full"
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={4}
        >
          {['cat-sk-1', 'cat-sk-2', 'cat-sk-3'].map((chave) => (
            <Card.Root key={chave} borderWidth="1px" borderColor="border.subtle" bg="bg.panel">
              <Card.Body p={4}>
                <Skeleton h={5} w={32} borderRadius="md" mb={2} />
                <Skeleton h={4} w={48} borderRadius="md" mb={3} />
                <Skeleton h={8} w="full" borderRadius="lg" />
              </Card.Body>
            </Card.Root>
          ))}
        </Grid>
      </VStack>
    )
  }

  return (
    <VStack w="full" gap={4} alignItems="stretch">
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
        <HStack gap={2.5}>
          <Box p={2} borderRadius="xl" bg="purple.500/10" color="purple.500">
            <Layers size={20} />
          </Box>
          <VStack gap={0.5} alignItems="flex-start">
            <Text fontSize="base" fontWeight="semibold" color="fg">
              Mapeamento por Categoria
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              Controle de pastas locais, álbuns e consumo de armazenamento
            </Text>
          </VStack>
        </HStack>

        <Box position="relative" w={{ base: 'full', sm: '64' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              zIndex: 10,
              opacity: 0.5,
            }}
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar categoria..."
            pl={9}
            bg="bg.muted"
            borderColor="border.subtle"
            fontSize="xs"
            h={9}
            w="full"
          />
        </Box>
      </HStack>

      {categoriasFiltradas.length === 0 ? (
        <Card.Root
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.panel"
          p={8}
          textAlign="center"
        >
          <Card.Body
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <Folder size={32} style={{ opacity: 0.3 }} />
            <Text fontSize="sm" fontWeight="medium" color="fg.subtle">
              {busca ? 'Nenhuma categoria corresponde à busca.' : 'Nenhuma categoria cadastrada.'}
            </Text>
          </Card.Body>
        </Card.Root>
      ) : (
        <Grid
          w="full"
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={4}
        >
          {categoriasFiltradas.map((cat, idx) => {
            const ehSemCategoria = !cat.uuid || cat.uuid === 'sem_categoria'
            const itemKey = cat.uuid ? `cat-${cat.uuid}` : `cat-item-${cat.nome || idx}`

            return (
              <Card.Root
                key={itemKey}
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.panel"
                shadow="md"
                transition="all 0.2s"
                _hover={{ borderColor: 'brand.500' }}
              >
                <Card.Header
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  pb={2}
                >
                  <HStack gap={2.5}>
                    <Box p={2} borderRadius="xl" bg="purple.500/10" color="purple.400">
                      <Folder size={16} />
                    </Box>
                    <VStack gap={0.5} alignItems="flex-start">
                      <Card.Title fontSize="sm" fontWeight="semibold" color="fg">
                        {cat.nome}
                      </Card.Title>
                      <Text
                        fontSize="11px"
                        fontFamily="mono"
                        color="fg.subtle"
                        truncate
                        maxW="180px"
                      >
                        📁 {cat.pastaLocal || 'pasta padrão'}
                      </Text>
                    </VStack>
                  </HStack>

                  {!ehSemCategoria && (
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setCategoriaEditando(cat)}
                      aria-label="Editar Mapeamento"
                    >
                      <Edit3 size={14} />
                    </IconButton>
                  )}
                </Card.Header>

                <Card.Body pt={2}>
                  <HStack
                    justify="space-between"
                    align="center"
                    py={2}
                    borderTopWidth="1px"
                    borderColor="border.subtle"
                    fontSize="xs"
                    color="fg.subtle"
                  >
                    <HStack gap={1.5}>
                      <FileVideo size={14} color="#3b82f6" />
                      <Text as="span">
                        {cat.totalItens} {cat.totalItens === 1 ? 'mídia' : 'mídias'}
                      </Text>
                    </HStack>

                    <HStack gap={1.5}>
                      <HardDrive size={14} color="#a855f7" />
                      <Text as="span" fontWeight="semibold" color="fg">
                        {cat.tamanhoFormatado}
                      </Text>
                    </HStack>
                  </HStack>

                  <HStack pt={2} justify="space-between" align="center" fontSize="11px">
                    {cat.googlePhotosAlbumId ? (
                      <Badge size="sm" variant="subtle" colorPalette="green">
                        <HStack gap={1}>
                          <Cloud size={12} />
                          <Text as="span">Google Fotos</Text>
                        </HStack>
                      </Badge>
                    ) : (
                      <Badge size="sm" variant="subtle" colorPalette="gray">
                        Local apenas
                      </Badge>
                    )}

                    {!ehSemCategoria && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCategoriaEditando(cat)}
                        fontSize="11px"
                        color="purple.500"
                        p={0}
                        h={6}
                      >
                        Editar pasta
                      </Button>
                    )}
                  </HStack>
                </Card.Body>
              </Card.Root>
            )
          })}
        </Grid>
      )}

      <ModalEditarCategoria
        categoria={categoriaEditando}
        aberto={Boolean(categoriaEditando)}
        onFechar={() => setCategoriaEditando(null)}
      />
    </VStack>
  )
})
