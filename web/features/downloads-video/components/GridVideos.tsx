import { CheckSquare, Film, Square } from 'lucide-react'
import { memo } from 'react'
import type { MediaItem } from '../types'
import { CardVideo } from './CardVideo'

export interface GridVideosProps {
  itens: MediaItem[]
  carregando?: boolean
  selecionados: string[]
  onToggleSelect: (uuid: string) => void
  onToggleSelectAll?: () => void
  onEditarMetadata?: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onRebaixar?: (uuid: string) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
}

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-video w-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="pt-2 flex justify-between">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
        </div>
      </div>
    </div>
  )
}

export const GridVideos = memo(function GridVideos({
  itens,
  carregando = false,
  selecionados,
  onToggleSelect,
  onToggleSelectAll,
  onEditarMetadata,
  onCategorizar,
  onRebaixar,
  onRetentar,
  onApagar,
}: GridVideosProps) {
  const todosSelecionados = itens.length > 0 && selecionados.length === itens.length
  const algunsSelecionados = selecionados.length > 0 && !todosSelecionados

  if (carregando && itens.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index + 1}`} />
        ))}
      </div>
    )
  }

  if (!carregando && itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mb-4">
          <Film className="size-10" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Nenhum vídeo encontrado
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          Cole o link de um vídeo do YouTube, TikTok, Twitter ou Instagram acima para iniciar o
          download.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {itens.length > 0 && onToggleSelectAll && (
        <div className="flex items-center justify-between px-1 py-1">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {todosSelecionados ? (
              <CheckSquare className="size-4 text-brand-500" />
            ) : (
              <Square className="size-4" />
            )}
            <span>
              {todosSelecionados
                ? 'Desmarcar todos'
                : algunsSelecionados
                  ? `Selecionados (${selecionados.length}/${itens.length})`
                  : 'Selecionar todos'}
            </span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {itens.map((item) => (
          <CardVideo
            key={item.uuid}
            item={item}
            selecionado={selecionados.includes(item.uuid)}
            onToggleSelect={onToggleSelect}
            onEditarMetadata={onEditarMetadata}
            onCategorizar={onCategorizar}
            onRebaixar={onRebaixar}
            onRetentar={onRetentar}
            onApagar={onApagar}
          />
        ))}
      </div>
    </div>
  )
})
