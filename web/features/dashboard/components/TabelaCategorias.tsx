import { cn } from '@/shared/lib/cn'
import { Box, Grid, HStack, Text, VStack } from '@/shared/ui/layout'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  Input,
  Skeleton,
} from '@heroui/react'
import { Cloud, Edit3, FileVideo, Folder, HardDrive, Layers, Search } from 'lucide-react'
import { memo, useState } from 'react'
import type { CategoriaMetrica } from '../types'
import { ModalEditarCategoria } from './ModalEditarCategoria'

export interface TabelaCategoriasProps {
  categorias?: CategoriaMetrica[]
  carregando?: boolean
  className?: string
}

export const TabelaCategorias = memo(function TabelaCategorias({
  categorias = [],
  carregando = false,
  className,
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
      <VStack className={cn('w-full gap-4', className)}>
        <HStack className="justify-between items-center">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-9 w-60 rounded-xl" />
        </HStack>
        <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['cat-sk-1', 'cat-sk-2', 'cat-sk-3'].map((chave) => (
            <Card key={chave} className="border border-white/10 bg-black/40 backdrop-blur-md">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-32 rounded-md mb-2" />
                <Skeleton className="h-4 w-48 rounded-md mb-3" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </Grid>
      </VStack>
    )
  }

  return (
    <VStack className={cn('w-full gap-4', className)}>
      {/* ── Cabeçalho e Busca ── */}
      <HStack className="justify-between items-center flex-wrap gap-3">
        <HStack className="gap-2.5">
          <Box className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </Box>
          <VStack className="gap-0.5">
            <Text className="text-base font-semibold text-white">Mapeamento por Categoria</Text>
            <Text className="text-xs text-white/50">
              Controle de pastas locais, álbuns e consumo de armazenamento
            </Text>
          </VStack>
        </HStack>

        <Box className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar categoria..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-xs h-9 w-full"
          />
        </Box>
      </HStack>

      {/* ── Grid de Categorias ── */}
      {categoriasFiltradas.length === 0 ? (
        <Card className="border border-white/10 bg-white/2 backdrop-blur-md p-8 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-2">
            <Folder className="w-8 h-8 text-white/30" />
            <Text className="text-sm font-medium text-white/70">
              {busca ? 'Nenhuma categoria corresponde à busca.' : 'Nenhuma categoria cadastrada.'}
            </Text>
          </CardContent>
        </Card>
      ) : (
        <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriasFiltradas.map((cat, idx) => {
            const ehSemCategoria = !cat.uuid || cat.uuid === 'sem_categoria'
            const itemKey = cat.uuid ? `cat-${cat.uuid}` : `cat-item-${cat.nome || idx}`

            return (
              <Card
                key={itemKey}
                className="border border-white/10 bg-linear-to-br from-white/5 to-white/2 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300 shadow-md group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <HStack className="gap-2.5">
                    <Box className="p-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                      <Folder className="w-4 h-4" />
                    </Box>
                    <VStack className="gap-0.5">
                      <CardTitle className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {cat.nome}
                      </CardTitle>
                      <Text className="text-[11px] font-mono text-white/40 truncate max-w-[180px]">
                        📁 {cat.pastaLocal || 'pasta padrão'}
                      </Text>
                    </VStack>
                  </HStack>

                  {!ehSemCategoria && (
                    <Button
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      onPress={() => setCategoriaEditando(cat)}
                      className="text-white/60 hover:text-white hover:bg-purple-500/20"
                      aria-label="Editar Mapeamento"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="pt-2">
                  <HStack className="justify-between items-center py-2 border-t border-white/5 text-xs text-white/60">
                    <HStack className="gap-1.5">
                      <FileVideo className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {cat.totalItens} {cat.totalItens === 1 ? 'mídia' : 'mídias'}
                      </span>
                    </HStack>

                    <HStack className="gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-semibold text-white/80">{cat.tamanhoFormatado}</span>
                    </HStack>
                  </HStack>

                  <HStack className="pt-2 justify-between items-center text-[11px]">
                    {cat.googlePhotosAlbumId ? (
                      <Chip
                        size="sm"
                        variant="soft"
                        className="h-5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      >
                        <HStack className="gap-1">
                          <Cloud className="w-3 h-3" />
                          <span>Google Fotos</span>
                        </HStack>
                      </Chip>
                    ) : (
                      <Chip
                        size="sm"
                        variant="soft"
                        className="h-5 text-[10px] bg-white/5 text-white/40 border border-white/10"
                      >
                        Local apenas
                      </Chip>
                    )}

                    {!ehSemCategoria && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={() => setCategoriaEditando(cat)}
                        className="h-6 text-[11px] text-purple-400 hover:text-purple-300 p-0"
                      >
                        Editar pasta
                      </Button>
                    )}
                  </HStack>
                </CardContent>
              </Card>
            )
          })}
        </Grid>
      )}

      {/* ── Modal de Edição de Mapeamento ── */}
      <ModalEditarCategoria
        categoria={categoriaEditando}
        aberto={Boolean(categoriaEditando)}
        onFechar={() => setCategoriaEditando(null)}
      />
    </VStack>
  )
})
