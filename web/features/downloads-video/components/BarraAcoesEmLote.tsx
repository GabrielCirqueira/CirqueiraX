import { cn } from '@/shared/lib/cn'
import { DownloadCloud, FolderPlus, Loader2, Trash2, X } from 'lucide-react'
import { memo } from 'react'

export interface BarraAcoesEmLoteProps {
  totalSelecionados: number
  selecionados: string[]
  onLimparSelecao: () => void
  onCategorizarLote: () => void
  onRebaixarLote: () => void
  onApagarLote: () => void
  processando?: boolean
}

export const BarraAcoesEmLote = memo(function BarraAcoesEmLote({
  totalSelecionados,
  onLimparSelecao,
  onCategorizarLote,
  onRebaixarLote,
  onApagarLote,
  processando = false,
}: BarraAcoesEmLoteProps) {
  if (totalSelecionados === 0) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={cn(
          'flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5',
          'rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80',
          'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg shadow-2xl'
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-brand-500 text-white font-bold text-xs">
            {totalSelecionados}
          </span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {totalSelecionados === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
          <button
            type="button"
            onClick={onLimparSelecao}
            disabled={processando}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors ml-1"
            title="Desmarcar todos"
            aria-label="Desmarcar todos"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onCategorizarLote}
            disabled={processando}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {processando ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FolderPlus className="size-3.5 text-brand-500" />
            )}
            <span>Categorizar</span>
          </button>

          <button
            type="button"
            onClick={onRebaixarLote}
            disabled={processando}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {processando ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <DownloadCloud className="size-3.5 text-blue-500" />
            )}
            <span>Rebaixar</span>
          </button>

          <button
            type="button"
            onClick={onApagarLote}
            disabled={processando}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
              'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {processando ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            <span>Apagar</span>
          </button>
        </div>
      </div>
    </div>
  )
})
