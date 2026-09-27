import { cn } from '@/shared/lib/cn'
import { Box, Flex, Grid, HStack, Text, VStack } from '@/shared/ui/layout'
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
    <VStack className="w-full gap-6">
      {/* Área de Arrastar e Soltar */}
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative w-full rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-all duration-200',
          'flex flex-col items-center justify-center gap-3',
          isDragOver
            ? 'border-brand-500 bg-brand-500/10 scale-[1.01] shadow-lg'
            : 'border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 hover:border-brand-400 dark:hover:border-brand-500/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Box className="p-4 rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/20">
          <UploadCloud className="size-10 sm:size-12" />
        </Box>

        <VStack className="gap-1 items-center">
          <Text as="h3" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {isDragOver ? 'Solte os arquivos aqui' : 'Arraste e solte fotos ou vídeos aqui'}
          </Text>
          <Text className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Suporta arquivos de imagem (PNG, JPG, WEBP) e vídeos (MP4, MKV, WEBM). Clique para
            buscar no computador.
          </Text>
        </VStack>

        {/* Seleção de Categoria Padrão */}
        <HStack className="mt-2 gap-2" onClick={(e) => e.stopPropagation()}>
          <FolderPlus className="size-4 text-zinc-400" />
          <Text as="span" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Categoria pré-definida:
          </Text>
          <select
            value={categoriaPadraoId ?? ''}
            onChange={(e) => onSetCategoriaPadraoId(e.target.value || null)}
            className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">Nenhuma (triagem posterior)</option>
            {categorias.map((cat) => (
              <option key={cat.uuid} value={cat.uuid}>
                {cat.nome}
              </option>
            ))}
          </select>
        </HStack>
      </Box>

      {/* Controles da Fila */}
      {fila.length > 0 && (
        <VStack className="w-full gap-4">
          <Flex className="flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-100/80 dark:bg-zinc-800/80 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80">
            <HStack className="gap-2">
              <Text as="strong" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Fila de Upload ({fila.length})
              </Text>
              {pendentesCount > 0 && (
                <Text
                  as="span"
                  className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                >
                  {pendentesCount} pendente(s)
                </Text>
              )}
            </HStack>

            <HStack className="gap-2 justify-end">
              {concluidosCount > 0 && (
                <button
                  type="button"
                  onClick={onLimparConcluidos}
                  disabled={estaProcessando}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Limpar concluidos ({concluidosCount})
                </button>
              )}

              <button
                type="button"
                onClick={onEnviarTodos}
                disabled={estaProcessando || pendentesCount === 0}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-all shadow-sm',
                  'bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {estaProcessando ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-3.5" />
                    <span>Enviar Todos ({pendentesCount})</span>
                  </>
                )}
              </button>
            </HStack>
          </Flex>

          {/* Lista de Arquivos */}
          <Grid className="grid-cols-1 gap-3">
            {fila.map((item) => (
              <Box
                key={item.id}
                className={cn(
                  'p-3 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
                  'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm',
                  item.status === 'enviando' &&
                    'border-brand-500/50 bg-brand-500/5 dark:bg-brand-500/10',
                  item.status === 'sucesso' && 'border-emerald-500/30 dark:border-emerald-500/20',
                  item.status === 'duplicado' &&
                    'border-amber-500/30 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10',
                  item.status === 'erro' && 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10'
                )}
              >
                {/* Esquerda: Preview + Informações do Arquivo */}
                <HStack className="gap-3.5 flex-1 min-w-0">
                  {/* Miniature / Icon */}
                  <Box className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    {item.previewUrl && item.tipoMime.startsWith('image/') ? (
                      <img
                        src={item.previewUrl}
                        alt={item.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : item.previewUrl && item.tipoMime.startsWith('video/') ? (
                      <video src={item.previewUrl} className="w-full h-full object-cover">
                        <track kind="captions" />
                      </video>
                    ) : item.tipoMime.startsWith('video/') ? (
                      <FileVideo className="size-6 text-indigo-500" />
                    ) : (
                      <FileImage className="size-6 text-emerald-500" />
                    )}
                  </Box>

                  <VStack className="gap-0.5 min-w-0 flex-1">
                    <HStack className="gap-2">
                      <Text
                        as="span"
                        className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate"
                      >
                        {item.nome}
                      </Text>
                      <Text as="small" className="text-xs text-zinc-400 shrink-0">
                        ({formatarTamanho(item.tamanhoBytes)})
                      </Text>
                    </HStack>

                    {/* Selector de Categoria por Item */}
                    <HStack className="gap-2 mt-1">
                      <Text as="span" className="text-xs text-zinc-500 dark:text-zinc-400">
                        Categoria:
                      </Text>
                      <select
                        value={item.categoriaId ?? ''}
                        disabled={item.status === 'enviando' || item.status === 'sucesso'}
                        onChange={(e) => onAtualizarCategoriaItem(item.id, e.target.value || null)}
                        className="h-6 px-2 rounded text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      >
                        <option value="">Sem Categoria</option>
                        {categorias.map((cat) => (
                          <option key={cat.uuid} value={cat.uuid}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                    </HStack>

                    {/* Progress Bar during upload */}
                    {item.status === 'enviando' && (
                      <Box className="w-full mt-2 bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                        <Box
                          className="bg-brand-500 h-full transition-all duration-200"
                          style={{ width: `${item.progresso}%` }}
                        />
                      </Box>
                    )}

                    {/* Mensagem de Erro */}
                    {item.mensagemErro && (
                      <Text className="text-xs font-medium text-rose-500 mt-1">
                        {item.mensagemErro}
                      </Text>
                    )}
                  </VStack>
                </HStack>

                {/* Direita: Status Badge + Botões */}
                <HStack className="gap-3 shrink-0 self-end sm:self-center">
                  {/* Status Badges */}
                  {item.status === 'pendente' && (
                    <Text
                      as="span"
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                    >
                      Pendente
                    </Text>
                  )}

                  {item.status === 'enviando' && (
                    <HStack className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>{item.progresso}%</span>
                    </HStack>
                  )}

                  {item.status === 'sucesso' && (
                    <HStack className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="size-3.5" />
                      <span>Enviado</span>
                    </HStack>
                  )}

                  {item.status === 'duplicado' && (
                    <HStack className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="size-3.5" />
                      <span>Duplicado (já existia)</span>
                    </HStack>
                  )}

                  {item.status === 'erro' && (
                    <HStack className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <XCircle className="size-3.5" />
                      <span>Falha</span>
                    </HStack>
                  )}

                  {/* Actions */}
                  {(item.status === 'erro' || item.status === 'pendente') && (
                    <button
                      type="button"
                      onClick={() => onReenviarItem(item.id)}
                      disabled={estaProcessando}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-brand-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Enviar item"
                      aria-label="Enviar item"
                    >
                      <RefreshCw className="size-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemoverArquivo(item.id)}
                    disabled={item.status === 'enviando'}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                    title="Remover da fila"
                    aria-label="Remover da fila"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </HStack>
              </Box>
            ))}
          </Grid>
        </VStack>
      )}
    </VStack>
  )
})
