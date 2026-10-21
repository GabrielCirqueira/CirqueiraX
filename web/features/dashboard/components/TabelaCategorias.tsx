import { ModalVincularAlbum } from '@/features/google-fotos'
import { Box, Button, HStack, IconButton, Input, Skeleton, Text, VStack } from '@chakra-ui/react'
import { Edit3, Plus, Search } from 'lucide-react'
import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CategoriaMetrica } from '../types'
import { filtrarCategorias, isCategoriaEditavel, pluralizar } from '../utils/metricasDashboard'
import { ModalCriarCategoria } from './ModalCriarCategoria'
import { ModalEditarCategoria } from './ModalEditarCategoria'
import { PainelDashboard } from './PainelDashboard'

export interface TabelaCategoriasProps {
  categorias?: CategoriaMetrica[]
  carregando?: boolean
}

const CHAVES_CARREGANDO = ['cat-sk-1', 'cat-sk-2', 'cat-sk-3']

export const TabelaCategorias = memo(function TabelaCategorias({
  categorias = [],
  carregando = false,
}: TabelaCategoriasProps) {
  const [busca, setBusca] = useState('')
  const [modalCriarAberto, setModalCriarAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaMetrica | null>(null)
  const [categoriaVinculandoAlbum, setCategoriaVinculandoAlbum] = useState<CategoriaMetrica | null>(
    null
  )

  const categoriasFiltradas = filtrarCategorias(categorias, busca)

  return (
    <PainelDashboard
      semEspacamento
      titulo="Categorias"
      descricao="Pastas locais, álbuns do Google Fotos e espaço em disco"
      acao={
        <HStack gap={2}>
          <Button asChild size="xs" variant="ghost" borderRadius="lg" color="fg.muted">
            <Link to="/google-fotos">Álbuns</Link>
          </Button>
          <Button
            size="xs"
            variant="outline"
            borderRadius="lg"
            onClick={() => setModalCriarAberto(true)}
          >
            <Plus size={12} />
            Nova
          </Button>
        </HStack>
      }
    >
      <Box px={5} pb={4}>
        <Box position="relative" maxW={{ base: 'full', sm: '72' }}>
          <Box
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            color="fg.subtle"
            zIndex={1}
          >
            <Search size={14} />
          </Box>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar categoria..."
            size="sm"
            pl={8}
            borderRadius="lg"
          />
        </Box>
      </Box>

      <VStack align="stretch" gap={0} borderTopWidth="1px" borderColor="border.subtle">
        {carregando &&
          categorias.length === 0 &&
          CHAVES_CARREGANDO.map((chave) => (
            <HStack key={chave} px={5} py={3} justify="space-between">
              <Skeleton h={4} w="40%" />
              <Skeleton h={4} w={24} />
            </HStack>
          ))}

        {!carregando && categoriasFiltradas.length === 0 && (
          <Text px={5} py={8} fontSize="sm" color="fg.subtle" textAlign="center">
            {busca ? 'Nenhuma categoria corresponde à busca.' : 'Nenhuma categoria cadastrada.'}
          </Text>
        )}

        {categoriasFiltradas.map((categoria, indice) => {
          const editavel = isCategoriaEditavel(categoria)
          return (
            <HStack
              key={categoria.uuid || `categoria-${categoria.nome || indice}`}
              justify="space-between"
              gap={4}
              px={5}
              py={3}
              borderBottomWidth="1px"
              borderColor="border.subtle"
              _last={{ borderBottomWidth: 0 }}
              flexWrap={{ base: 'wrap', md: 'nowrap' }}
            >
              <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
                <Text fontSize="sm" color="fg" truncate maxW="full">
                  {categoria.nome}
                </Text>
                <Text fontSize="xs" fontFamily="mono" color="fg.subtle" truncate maxW="full">
                  {categoria.pastaLocal || 'pasta padrão'}
                </Text>
              </VStack>

              <Text fontSize="xs" color="fg.subtle" w={{ md: '36' }} flexShrink={0}>
                {pluralizar(categoria.totalItens, 'mídia', 'mídias')} · {categoria.tamanhoFormatado}
              </Text>

              <HStack gap={1} flexShrink={0} w={{ md: '56' }} justify="flex-end">
                {!categoria.googlePhotosAlbumId && (
                  <Text fontSize="xs" color="cirqueira.amber.500" mr={1}>
                    Sem álbum
                  </Text>
                )}
                {editavel && (
                  <>
                    <Button
                      size="xs"
                      variant="ghost"
                      borderRadius="lg"
                      color="fg.muted"
                      onClick={() => setCategoriaVinculandoAlbum(categoria)}
                    >
                      {categoria.googlePhotosAlbumId ? 'Trocar álbum' : 'Vincular álbum'}
                    </Button>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      borderRadius="lg"
                      color="fg.muted"
                      aria-label="Editar categoria"
                      onClick={() => setCategoriaEditando(categoria)}
                    >
                      <Edit3 size={13} />
                    </IconButton>
                  </>
                )}
              </HStack>
            </HStack>
          )
        })}
      </VStack>

      <ModalCriarCategoria aberto={modalCriarAberto} onFechar={() => setModalCriarAberto(false)} />

      <ModalEditarCategoria
        categoria={categoriaEditando}
        aberto={Boolean(categoriaEditando)}
        onFechar={() => setCategoriaEditando(null)}
      />

      <ModalVincularAlbum
        categoria={categoriaVinculandoAlbum}
        aberto={Boolean(categoriaVinculandoAlbum)}
        onFechar={() => setCategoriaVinculandoAlbum(null)}
      />
    </PainelDashboard>
  )
})
