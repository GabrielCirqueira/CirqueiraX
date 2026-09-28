import { Box, Flex, HStack, Text } from '@/shared/ui/layout'
import { Button, Chip } from '@heroui/react'
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
    <Box className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
      <Flex className="flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg shadow-2xl">
        <HStack className="gap-2.5">
          <Chip size="sm" className="bg-brand-500 text-white font-bold">
            {totalSelecionados}
          </Chip>
          <Text as="span" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {totalSelecionados === 1 ? 'item selecionado' : 'itens selecionados'}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            isDisabled={processando}
            onPress={onLimparSelecao}
            aria-label="Desmarcar todos"
          >
            <X className="size-4 text-zinc-400" />
          </Button>
        </HStack>

        <HStack className="gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="ghost"
            isDisabled={processando}
            onPress={onCategorizarLote}
            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          >
            {processando ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FolderPlus className="size-3.5 text-brand-500" />
            )}
            <span>Categorizar</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            isDisabled={processando}
            onPress={onRebaixarLote}
            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          >
            {processando ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <DownloadCloud className="size-3.5 text-blue-500" />
            )}
            <span>Rebaixar</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            isDisabled={processando}
            onPress={onApagarLote}
            className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
          >
            {processando ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            <span>Apagar</span>
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
})
