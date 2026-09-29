import { Badge, Box, Button, Card, Flex, Grid, HStack, Progress, Text, VStack } from '@chakra-ui/react'
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  FileVideo,
  FolderPlus,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { type ChangeEvent, type DragEvent, memo, useRef, useState } from 'react'
import type { ArquivoFilaUpload } from '../types'

export interface DropzoneUploadProps {
  fila: ArquivoFilaUpload[]
  estaProcessando: boolean
  categorias: Array<{ uuid: string; nome: string }>
  categoriaPadraoId: string | null
  onSetCategoriaPadraoId: (id: string | null) => void
  onAdicionarArquivos: (files: FileList | File[]) => void
  onRemoverArquivo: (id: string) => void
  onAtualizarCategoriaItem: (id: string, categoriaId: string | null) => void
  onLimparConcluidos: () => void
  onEnviarTodos: () => void
  onReenviarItem: (id: string) => void
}

function formatarTamanho(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const tamanhos = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(1)} ${tamanhos[i]}`
}

export const DropzoneUpload = memo(function DropzoneUpload({
  fila,
  estaProcessando,
  categorias,
  categoriaPadraoId,
  onSetCategoriaPadraoId,
  onAdicionarArquivos,
  onRemoverArquivo,
  onAtualizarCategoriaItem,
  onLimparConcluidos,
  onEnviarTodos,
  onReenviarItem,
}: DropzoneUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAdicionarArquivos(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAdicionarArquivos(e.target.files)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const pendentesCount = fila.filter((f) => f.status === 'pendente' || f.status === 'erro').length
  const concluidosCount = fila.filter(
    (f) => f.status === 'sucesso' || f.status === 'duplicado'
  ).length

  return (
    <VStack w="full" gap={6}>
      <Card.Root
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        w="full"
        borderRadius="2xl"
        borderWidth="2px"
        borderStyle="dashed"
        p={{ base: 8, sm: 10 }}
        textAlign="center"
        cursor="pointer"
        transition="all 0.2s"
        shadow="none"
        borderColor={isDragOver ? 'brand.500' : 'border.subtle'}
        bg={isDragOver ? 'brand.500/10' : 'bg.panel'}
        transform={isDragOver ? 'scale(1.01)' : 'none'}
        _hover={{ borderColor: 'brand.500', bg: 'bg.muted' }}
      >
        <Card.Body display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={3} p={0}>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <Box p={4} borderRadius="2xl" bg="brand.500/10" color="brand.500">
            <UploadCloud size={40} />
          </Box>

          <VStack gap={1} alignItems="center">
            <Text
              as="h3"
              fontSize={{ base: 'md', sm: 'lg' }}
              fontWeight="bold"
              color="fg"
            >
              {isDragOver ? 'Solte os arquivos aqui' : 'Arraste e solte fotos ou vídeos aqui'}
            </Text>
            <Text fontSize={{ base: 'xs', sm: 'sm' }} color="fg.muted">
              Suporta arquivos de imagem (PNG, JPG, WEBP) e vídeos (MP4, MKV, WEBM). Clique para
              buscar no computador.
            </Text>
          </VStack>

          <HStack mt={2} gap={2} onClick={(e) => e.stopPropagation()}>
            <FolderPlus size={16} />
            <Text as="span" fontSize="xs" fontWeight="medium" color="fg.subtle">
              Categoria pré-definida:
            </Text>
            <select
              value={categoriaPadraoId ?? ''}
              onChange={(e) => onSetCategoriaPadraoId(e.target.value || null)}
              style={{
                height: '32px',
                paddingLeft: '12px',
                paddingRight: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: 'var(--chakra-colors-bg-muted)',
                borderColor: 'var(--chakra-colors-border-subtle)',
                color: 'inherit',
                borderWidth: '1px',
                outline: 'none',
              }}
            >
              <option value="">Nenhuma (triagem posterior)</option>
              {categorias.map((cat) => (
                <option key={cat.uuid} value={cat.uuid}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </HStack>
        </Card.Body>
      </Card.Root>

      {fila.length > 0 && (
        <VStack w="full" gap={4}>
          <Flex
            w="full"
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'stretch', sm: 'center' }}
            justify="space-between"
            gap={3}
            bg="bg.muted"
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <HStack gap={2}>
              <Text as="strong" fontSize="sm" fontWeight="bold" color="fg">
                Fila de Upload ({fila.length})
              </Text>
              {pendentesCount > 0 && (
                <Badge
                  colorPalette="amber"
                  variant="subtle"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                >
                  {pendentesCount} pendente(s)
                </Badge>
              )}
            </HStack>

            <HStack gap={2} justify="flex-end">
              {concluidosCount > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  disabled={estaProcessando}
                  onClick={onLimparConcluidos}
                >
                  Limpar concluidos ({concluidosCount})
                </Button>
              )}

              <Button
                size="sm"
                colorPalette="brand"
                disabled={estaProcessando || pendentesCount === 0}
                onClick={onEnviarTodos}
                fontWeight="bold"
                borderRadius="xl"
              >
                {estaProcessando ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }} />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} style={{ marginRight: '6px' }} />
                    <span>Enviar Todos ({pendentesCount})</span>
                  </>
                )}
              </Button>
            </HStack>
          </Flex>

          <Grid w="full" templateColumns="1fr" gap={3}>
            {fila.map((item) => (
              <Card.Root
                key={item.id}
                p={{ base: 3, sm: 4 }}
                borderRadius="xl"
                borderWidth="1px"
                transition="all 0.2s"
                shadow="none"
                bg={
                  item.status === 'enviando'
                    ? 'brand.500/5'
                    : item.status === 'duplicado'
                    ? 'amber.500/5'
                    : item.status === 'erro'
                    ? 'red.500/5'
                    : 'bg.panel'
                }
                borderColor={
                  item.status === 'enviando'
                    ? 'brand.500/50'
                    : item.status === 'sucesso'
                    ? 'emerald.500/30'
                    : item.status === 'duplicado'
                    ? 'amber.500/30'
                    : item.status === 'erro'
                    ? 'red.500/40'
                    : 'border.subtle'
                }
              >
                <Card.Body display="flex" flexDirection={{ base: 'column', sm: 'row' }} alignItems={{ base: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={4} p={0}>
                  <HStack gap={3.5} flex={1} minW={0} w="full">
                    <Box
                      position="relative"
                      w={12}
                      h={12}
                      borderRadius="lg"
                      overflow="hidden"
                      bg="bg.muted"
                      flexShrink={0}
                      borderWidth="1px"
                      borderColor="border.subtle"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {item.previewUrl && item.tipoMime.startsWith('image/') ? (
                        <img
                          src={item.previewUrl}
                          alt={item.nome}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : item.previewUrl && item.tipoMime.startsWith('video/') ? (
                        <video src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                          <track kind="captions" />
                        </video>
                      ) : item.tipoMime.startsWith('video/') ? (
                        <FileVideo size={24} color="#6366f1" />
                      ) : (
                        <FileImage size={24} color="#10b981" />
                      )}
                    </Box>

                    <VStack gap={0.5} minW={0} flex={1} alignItems="flex-start">
                      <HStack gap={2} w="full">
                        <Text
                          as="span"
                          fontWeight="semibold"
                          fontSize="sm"
                          color="fg"
                          truncate
                        >
                          {item.nome}
                        </Text>
                        <Text as="small" fontSize="xs" color="fg.subtle" flexShrink={0}>
                          ({formatarTamanho(item.tamanhoBytes)})
                        </Text>
                      </HStack>

                      <HStack gap={2} mt={1}>
                        <Text as="span" fontSize="xs" color="fg.subtle">
                          Categoria:
                        </Text>
                        <select
                          value={item.categoriaId ?? ''}
                          disabled={item.status === 'enviando' || item.status === 'sucesso'}
                          onChange={(e) =>
                            onAtualizarCategoriaItem(item.id, e.target.value || null)
                          }
                          style={{
                            height: '24px',
                            paddingLeft: '8px',
                            paddingRight: '8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: 'var(--chakra-colors-bg-muted)',
                            borderColor: 'var(--chakra-colors-border-subtle)',
                            color: 'inherit',
                            borderWidth: '1px',
                            outline: 'none',
                          }}
                        >
                          <option value="">Sem Categoria</option>
                          {categorias.map((cat) => (
                            <option key={cat.uuid} value={cat.uuid}>
                              {cat.nome}
                            </option>
                          ))}
                        </select>
                      </HStack>

                      {item.status === 'enviando' && (
                        <Box w="full" mt={2}>
                          <Progress.Root value={item.progresso} size="xs" colorPalette="brand">
                            <Progress.Track bg="bg.muted" borderRadius="full">
                              <Progress.Range borderRadius="full" />
                            </Progress.Track>
                          </Progress.Root>
                        </Box>
                      )}

                      {item.mensagemErro && (
                        <Text fontSize="xs" fontWeight="medium" color="red.500" mt={1}>
                          {item.mensagemErro}
                        </Text>
                      )}
                    </VStack>
                  </HStack>

                  <HStack gap={3} flexShrink={0} alignSelf={{ base: 'flex-end', sm: 'center' }}>
                    {item.status === 'pendente' && (
                      <Badge variant="subtle" colorPalette="gray" px={2} py={0.5} borderRadius="md">
                        Pendente
                      </Badge>
                    )}

                    {item.status === 'enviando' && (
                      <Badge variant="subtle" colorPalette="brand" px={2} py={0.5} borderRadius="md">
                        <HStack gap={1.5} alignItems="center">
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>{item.progresso}%</span>
                        </HStack>
                      </Badge>
                    )}

                    {item.status === 'sucesso' && (
                      <Badge variant="subtle" colorPalette="green" px={2} py={0.5} borderRadius="md">
                        <HStack gap={1.5} alignItems="center">
                          <CheckCircle2 size={14} />
                          <span>Enviado</span>
                        </HStack>
                      </Badge>
                    )}

                    {item.status === 'duplicado' && (
                      <Badge variant="subtle" colorPalette="amber" px={2} py={0.5} borderRadius="md">
                        <HStack gap={1.5} alignItems="center">
                          <AlertTriangle size={14} />
                          <span>Duplicado (já existia)</span>
                        </HStack>
                      </Badge>
                    )}

                    {item.status === 'erro' && (
                      <Badge variant="subtle" colorPalette="red" px={2} py={0.5} borderRadius="md">
                        <HStack gap={1.5} alignItems="center">
                          <XCircle size={14} />
                          <span>Falha</span>
                        </HStack>
                      </Badge>
                    )}

                    {(item.status === 'erro' || item.status === 'pendente') && (
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={estaProcessando}
                        onClick={() => onReenviarItem(item.id)}
                        aria-label="Enviar item"
                        p={1.5}
                      >
                        <RefreshCw size={16} />
                      </Button>
                    )}

                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={item.status === 'enviando'}
                      onClick={() => onRemoverArquivo(item.id)}
                      aria-label="Remover da fila"
                      p={1.5}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}
          </Grid>
        </VStack>
      )}
    </VStack>
  )
})