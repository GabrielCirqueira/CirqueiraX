import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  HStack,
  NativeSelect,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  FileImage,
  FileVideo,
  FolderPlus,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react'
import { type ChangeEvent, type DragEvent, memo, useRef, useState } from 'react'
import type { ItemDuplicadoConfirmacao } from './ModalConfirmarSincronizacaoDuplicado'
import type { ArquivoFilaUpload } from '../types'
import { formatarTamanhoBytes } from '../utils/arquivosUpload'

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
  onAbrirConfirmacaoDuplicado?: (confirmacao: ItemDuplicadoConfirmacao) => void
}

const FORMATOS_IMAGEM = ['PNG', 'JPG', 'WEBP', 'GIF']
const FORMATOS_VIDEO = ['MP4', 'MKV', 'WEBM', 'MOV']

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
  onAbrirConfirmacaoDuplicado,
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
    <VStack w="full" gap={5}>
      <Card.Root
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        w="full"
        borderRadius="2xl"
        borderWidth="2px"
        borderStyle="dashed"
        p={{ base: 6, sm: 8, md: 10 }}
        textAlign="center"
        cursor="pointer"
        transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        shadow="none"
        borderColor={isDragOver ? 'cirqueira.brand.500' : 'border.subtle'}
        bg={isDragOver ? 'cirqueira.brand.500/10' : 'bg.panel'}
        transform={isDragOver ? 'scale(1.008)' : 'none'}
        _hover={{ borderColor: 'cirqueira.brand.500', bg: 'bg.muted' }}
      >
        <Card.Body
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={4}
          p={0}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <Box
            p={4}
            borderRadius="2xl"
            bg="cirqueira.brand.500/15"
            color="cirqueira.brand.400"
            transition="transform 0.2s"
            transform={isDragOver ? 'scale(1.1)' : 'none'}
          >
            <UploadCloud size={44} strokeWidth={2.2} />
          </Box>

          <VStack gap={1.5} alignItems="center" maxW="lg">
            <Text as="h3" fontSize={{ base: 'md', sm: 'lg', md: 'xl' }} fontWeight="black" color="fg">
              {isDragOver ? 'Solte os arquivos para iniciar o upload' : 'Arraste e solte fotos ou vídeos aqui'}
            </Text>
            <Text fontSize={{ base: 'xs', sm: 'sm' }} color="fg.subtle">
              Suporta mídias de alta resolução para ingestão direta. Clique para navegar no computador ou cole imagens com Ctrl+V.
            </Text>
          </VStack>

          {/* Formatos Suportados e Dica de Clipboard */}
          <HStack gap={2} flexWrap="wrap" justify="center" pt={1}>
            <HStack gap={1} px={2} py={0.5} borderRadius="md" bg="bg.muted" borderWidth="1px" borderColor="border.subtle">
              <FileImage size={12} />
              <Text as="span" fontSize="11px" fontWeight="medium" color="fg.subtle">
                {FORMATOS_IMAGEM.join(', ')}
              </Text>
            </HStack>

            <HStack gap={1} px={2} py={0.5} borderRadius="md" bg="bg.muted" borderWidth="1px" borderColor="border.subtle">
              <FileVideo size={12} />
              <Text as="span" fontSize="11px" fontWeight="medium" color="fg.subtle">
                {FORMATOS_VIDEO.join(', ')}
              </Text>
            </HStack>

            <Badge variant="subtle" colorPalette="brand" size="xs" borderRadius="md" px={2} py={0.5}>
              <HStack gap={1}>
                <Sparkles size={11} />
                <Text as="span">Ctrl + V suportado</Text>
              </HStack>
            </Badge>
          </HStack>

          {/* Seletor de Categoria Pré-definida */}
          <Box
            mt={2}
            p={2.5}
            px={4}
            borderRadius="xl"
            bg="bg.muted"
            borderWidth="1px"
            borderColor="border.subtle"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            cursor="default"
          >
            <HStack gap={2.5} align="center">
              <Box color="cirqueira.brand.400" display="inline-flex">
                <FolderPlus size={16} />
              </Box>
              <Text as="span" fontSize="xs" fontWeight="semibold" color="fg.subtle">
                Categoria pré-definida:
              </Text>
              <NativeSelect.Root size="sm" w={{ base: '180px', sm: '230px' }}>
                <NativeSelect.Field
                  value={categoriaPadraoId ?? ''}
                  onChange={(e) => onSetCategoriaPadraoId(e.target.value || null)}
                  bg="bg.panel"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  fontSize="xs"
                  h={7}
                  fontWeight="medium"
                >
                  <option value="">Nenhuma (triagem posterior)</option>
                  {categorias.map((cat) => (
                    <option key={cat.uuid} value={cat.uuid}>
                      {cat.nome}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </HStack>
          </Box>
        </Card.Body>
      </Card.Root>

      {/* Fila de Arquivos em Envio */}
      {fila.length > 0 && (
        <VStack w="full" gap={3}>
          <Flex
            w="full"
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'stretch', sm: 'center' }}
            justify="space-between"
            gap={3}
            bg="bg.panel"
            p={3.5}
            px={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <HStack gap={2.5}>
              <Badge colorPalette="brand" size="md" px={2.5} py={0.5} borderRadius="lg" fontWeight="bold">
                {fila.length} {fila.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
              </Badge>
              {concluidosCount > 0 && (
                <Badge colorPalette="green" variant="subtle" size="sm" borderRadius="md">
                  {concluidosCount} enviado{concluidosCount > 1 ? 's' : ''}
                </Badge>
              )}
            </HStack>

            <HStack gap={2}>
              {concluidosCount > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={onLimparConcluidos}
                  disabled={estaProcessando}
                  borderRadius="lg"
                >
                  <Trash2 size={13} style={{ marginRight: '5px' }} />
                  <Text as="span">Limpar Concluídos</Text>
                </Button>
              )}

              <Button
                size="sm"
                colorPalette="brand"
                disabled={pendentesCount === 0 || estaProcessando}
                onClick={onEnviarTodos}
                fontWeight="bold"
                borderRadius="lg"
              >
                {estaProcessando ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                    />
                    <Text as="span">Enviando arquivos...</Text>
                  </>
                ) : (
                  <>
                    <CloudUpload size={14} style={{ marginRight: '6px' }} />
                    <Text as="span">Enviar Todos ({pendentesCount})</Text>
                  </>
                )}
              </Button>
            </HStack>
          </Flex>

          <Grid w="full" templateColumns="1fr" gap={2.5}>
            {fila.map((item) => (
              <Card.Root
                key={item.id}
                p={3}
                px={4}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.panel"
                transition="all 0.15s"
              >
                <Flex
                  direction={{ base: 'column', sm: 'row' }}
                  align={{ base: 'flex-start', sm: 'center' }}
                  justify="space-between"
                  gap={3}
                >
                  <HStack gap={3} flex={1} minW={0} w="full">
                    {/* Miniatura do Arquivo */}
                    <Box
                      w={11}
                      h={11}
                      borderRadius="lg"
                      bg="bg.muted"
                      overflow="hidden"
                      flexShrink={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderWidth="1px"
                      borderColor="border.subtle"
                    >
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.nome}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : item.tipoMime.startsWith('video/') ? (
                        <FileVideo size={20} color="var(--chakra-colors-cirqueira-purple-500, #a855f7)" />
                      ) : (
                        <FileImage size={20} color="var(--chakra-colors-cirqueira-brand-500, #22c55e)" />
                      )}
                    </Box>

                    <VStack align="flex-start" gap={0.5} flex={1} minW={0}>
                      <Text fontWeight="semibold" fontSize="xs" color="fg" truncate w="full">
                        {item.nome}
                      </Text>

                      <HStack gap={2} fontSize="11px" color="fg.subtle">
                        <Text as="span">{formatarTamanhoBytes(item.tamanhoBytes)}</Text>
                        <Text as="span">•</Text>
                        <Text as="span" fontFamily="mono" fontSize="10px">
                          {item.tipoMime || 'desconhecido'}
                        </Text>
                      </HStack>

                      {/* Progresso de Envio */}
                      {item.status === 'enviando' && (
                        <Box w="full" mt={1.5}>
                          <Progress.Root value={item.progresso} size="xs" colorPalette="brand">
                            <Progress.Track bg="bg.muted" borderRadius="full">
                              <Progress.Range borderRadius="full" />
                            </Progress.Track>
                          </Progress.Root>
                        </Box>
                      )}

                      {item.mensagemErro && (
                        <Text fontSize="11px" fontWeight="medium" color="cirqueira.red.500" mt={0.5}>
                          {item.mensagemErro}
                        </Text>
                      )}
                    </VStack>
                  </HStack>

                  {/* Seletor de Categoria e Ações */}
                  <HStack gap={2.5} flexShrink={0} alignSelf={{ base: 'flex-end', sm: 'center' }}>
                    <NativeSelect.Root
                      size="xs"
                      w="36"
                      disabled={item.status === 'enviando' || item.status === 'sucesso'}
                    >
                      <NativeSelect.Field
                        value={item.categoriaId ?? ''}
                        onChange={(e) => onAtualizarCategoriaItem(item.id, e.target.value || null)}
                        bg="bg.muted"
                        borderColor="border.subtle"
                        borderRadius="md"
                        fontSize="11px"
                        h={7}
                      >
                        <option value="">Sem Categoria</option>
                        {categorias.map((cat) => (
                          <option key={cat.uuid} value={cat.uuid}>
                            {cat.nome}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>

                    {item.status === 'pendente' && (
                      <Badge variant="subtle" colorPalette="gray" size="xs" borderRadius="md">
                        Pendente
                      </Badge>
                    )}

                    {item.status === 'enviando' && (
                      <Badge variant="subtle" colorPalette="brand" size="xs" borderRadius="md">
                        <HStack gap={1}>
                          <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                          <Text as="span">{item.progresso}%</Text>
                        </HStack>
                      </Badge>
                    )}

                    {item.status === 'sucesso' && (
                      <Badge variant="subtle" colorPalette="green" size="xs" borderRadius="md">
                        <HStack gap={1}>
                          <CheckCircle2 size={11} />
                          <Text as="span">Enviado</Text>
                        </HStack>
                      </Badge>
                    )}

                    {item.status === 'duplicado' && (
                      <Badge variant="subtle" colorPalette="amber" size="xs" borderRadius="md">
                        <HStack gap={1}>
                          <AlertTriangle size={11} />
                          <Text as="span">Duplicado</Text>
                        </HStack>
                      </Badge>
                    )}

                    {item.status === 'erro' && (
                      <Badge variant="subtle" colorPalette="red" size="xs" borderRadius="md">
                        <HStack gap={1}>
                          <XCircle size={11} />
                          <Text as="span">Erro</Text>
                        </HStack>
                      </Badge>
                    )}

                    {/* Botões de Ação na Fila */}
                    {item.status === 'duplicado' && onAbrirConfirmacaoDuplicado && item.mediaItem && (
                      <Button
                        size="xs"
                        variant="subtle"
                        colorPalette="amber"
                        onClick={() =>
                          onAbrirConfirmacaoDuplicado({
                            nome: item.nome,
                            tamanhoBytes: item.tamanhoBytes,
                            previewUrl: item.previewUrl,
                            mediaItem: item.mediaItem ?? undefined,
                          })
                        }
                        borderRadius="md"
                        fontSize="11px"
                      >
                        Forçar Envio
                      </Button>
                    )}

                    {item.status === 'erro' && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onReenviarItem(item.id)}
                        aria-label="Reenviar arquivo"
                        borderRadius="md"
                      >
                        Retentar
                      </Button>
                    )}

                    {item.status !== 'enviando' && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onRemoverArquivo(item.id)}
                        aria-label="Remover da fila"
                        color="fg.subtle"
                        _hover={{ color: 'cirqueira.red.500' }}
                        borderRadius="md"
                        p={1}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </HStack>
                </Flex>
              </Card.Root>
            ))}
          </Grid>
        </VStack>
      )}
    </VStack>
  )
})
