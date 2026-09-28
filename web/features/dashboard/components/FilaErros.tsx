import { cn } from '@/shared/lib/cn'
import { Box, HStack, Text, VStack } from '@/shared/ui/layout'
import { Button, Card, CardContent, Chip, Skeleton } from '@heroui/react'
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  FileVideo,
  Loader2,
  RefreshCw,
  RotateCcw,
  Smartphone,
  UploadCloud,
} from 'lucide-react'
import { memo, useState } from 'react'
import { useFilaErros, useRetentarErroIndividual, useRetentarErros } from '../hooks/useDashboard'
import type { OrigemMedia } from '../types'

export interface FilaErrosProps {
  className?: string
}

const ORIGEM_ICON: Record<OrigemMedia, typeof Bot> = {
  print_empresa: Building2,
  print_pessoal: Smartphone,
  bot_telegram: Bot,
  download: DownloadCloud,
  manual: UploadCloud,
}

export const FilaErros = memo(function FilaErros({ className }: FilaErrosProps) {
  const [pagina, setPagina] = useState(1)
  const limite = 10

  const { data: resposta, isLoading: carregando } = useFilaErros(pagina, limite)
  const { mutate: retentarTodos, isPending: retentandoTodos } = useRetentarErros()
  const { mutate: retentarIndividual, isPending: retentandoIndividual } =
    useRetentarErroIndividual()

  const [itemEmAcao, setItemEmAcao] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const itens = resposta?.data ?? []
  const total = resposta?.total ?? 0
  const totalPaginas = Math.ceil(total / limite) || 1

  function handleRetentarTodos() {
    setMensagemSucesso(null)
    retentarTodos(undefined, {
      onSuccess: (itensRetentados) => {
        setMensagemSucesso(
          `Reprocessamento disparado para ${itensRetentados.length} ${
            itensRetentados.length === 1 ? 'mídia' : 'mídias'
          }.`
        )
        setTimeout(() => setMensagemSucesso(null), 4000)
      },
    })
  }

  function handleRetentarItem(uuid: string) {
    setItemEmAcao(uuid)
    setMensagemSucesso(null)
    retentarIndividual(uuid, {
      onSuccess: () => {
        setMensagemSucesso('Reprocessamento do item disparado com sucesso.')
        setItemEmAcao(null)
        setTimeout(() => setMensagemSucesso(null), 4000)
      },
      onError: () => {
        setItemEmAcao(null)
      },
    })
  }

  if (carregando && itens.length === 0) {
    return (
      <VStack className={cn('w-full gap-4', className)}>
        <HStack className="justify-between items-center">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </HStack>
        <VStack className="gap-3 w-full">
          {['erro-sk-1', 'erro-sk-2'].map((chave) => (
            <Card key={chave} className="border border-white/10 bg-black/40 backdrop-blur-md">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-44 rounded-md mb-2" />
                <Skeleton className="h-10 w-full rounded-md mb-3" />
                <Skeleton className="h-8 w-32 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </VStack>
      </VStack>
    )
  }

  return (
    <VStack className={cn('w-full gap-4', className)}>
      {/* ── Cabeçalho da Fila de Erros ── */}
      <HStack className="justify-between items-center flex-wrap gap-3">
        <HStack className="gap-2.5">
          <Box className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </Box>
          <VStack className="gap-0.5">
            <HStack className="gap-2 items-center">
              <Text className="text-base font-semibold text-white">Fila Operacional de Erros</Text>
              {total > 0 && (
                <Chip
                  size="sm"
                  variant="soft"
                  className="h-5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold"
                >
                  {total} {total === 1 ? 'falha' : 'falhas'}
                </Chip>
              )}
            </HStack>
            <Text className="text-xs text-white/50">
              Itens que falharam na ingestão, download ou sincronização
            </Text>
          </VStack>
        </HStack>

        {total > 0 && (
          <Button
            size="sm"
            variant="ghost"
            isDisabled={retentandoTodos}
            onPress={handleRetentarTodos}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-medium text-xs h-9"
          >
            {retentandoTodos ? (
              <HStack className="gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reprocessando...</span>
              </HStack>
            ) : (
              <HStack className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retentar Todos ({total})</span>
              </HStack>
            )}
          </Button>
        )}
      </HStack>

      {/* ── Mensagem de Feedback Rápido ── */}
      {mensagemSucesso && (
        <Box className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </Box>
      )}

      {/* ── Lista de Itens com Erro ou Estado Saudável ── */}
      {itens.length === 0 ? (
        <Card className="border border-emerald-500/20 bg-linear-to-br from-emerald-500/5 to-white/2 backdrop-blur-xl p-8 text-center shadow-lg">
          <CardContent className="flex flex-col items-center justify-center gap-2.5">
            <Box className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </Box>
            <Text className="text-sm font-semibold text-emerald-300">
              Nenhuma falha ativa no pipeline
            </Text>
            <Text className="text-xs text-white/50 max-w-md">
              Todos os downloads, prints e sincronizações foram processados com sucesso.
            </Text>
          </CardContent>
        </Card>
      ) : (
        <VStack className="w-full gap-3">
          {itens.map((item) => {
            const IconeOrigem = ORIGEM_ICON[item.origem] || FileVideo
            const estaRetentando = retentandoIndividual && itemEmAcao === item.uuid
            const tituloMedia =
              (item.metadata?.titulo as string) ||
              (item.metadata?.nome_original as string) ||
              item.caminhoLocal?.split('/').pop() ||
              `Mídia ${item.hash.substring(0, 8)}`

            return (
              <Card
                key={item.uuid}
                className="border border-rose-500/30 bg-linear-to-br from-rose-500/5 via-black/40 to-white/2 backdrop-blur-xl shadow-md hover:border-rose-500/50 transition-all duration-300"
              >
                <CardContent className="p-4">
                  <HStack className="justify-between items-start flex-wrap gap-2 mb-3">
                    <HStack className="gap-2.5 items-center">
                      <Box className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <IconeOrigem className="w-4 h-4" />
                      </Box>
                      <VStack className="gap-0.5">
                        <Text className="text-sm font-semibold text-white truncate max-w-[280px] sm:max-w-md">
                          {tituloMedia}
                        </Text>
                        <HStack className="gap-2 text-[11px] text-white/50">
                          <span>Origem: {item.origemDescricao}</span>
                          <span>•</span>
                          <span>Hash: {item.hash.substring(0, 10)}...</span>
                        </HStack>
                      </VStack>
                    </HStack>

                    <Button
                      size="sm"
                      variant="ghost"
                      isDisabled={estaRetentando || retentandoTodos}
                      onPress={() => handleRetentarItem(item.uuid)}
                      className="h-8 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-medium"
                    >
                      {estaRetentando ? (
                        <HStack className="gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Retentando...</span>
                        </HStack>
                      ) : (
                        <HStack className="gap-1.5">
                          <RefreshCw className="w-3 h-3" />
                          <span>Tentar novamente</span>
                        </HStack>
                      )}
                    </Button>
                  </HStack>

                  {/* ── Motivo do Erro ── */}
                  <Box className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-start gap-2.5 mb-3">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <VStack className="gap-0.5 flex-1">
                      <Text className="font-semibold text-rose-300">Motivo da Falha:</Text>
                      <Text className="text-rose-200/90 font-mono text-[11px] break-all">
                        {item.erroMotivo || 'Erro genérico durante o processamento do pipeline.'}
                      </Text>
                    </VStack>
                  </Box>

                  {/* ── Detalhes Adicionais ── */}
                  <HStack className="justify-between items-center text-[11px] text-white/40 pt-1 border-t border-white/5 flex-wrap gap-2">
                    <HStack className="gap-2">
                      {item.categoria?.nome && <span>Categoria: {item.categoria.nome}</span>}
                      {item.caminhoLocal && (
                        <span className="font-mono truncate max-w-[200px]">
                          📁 {item.caminhoLocal}
                        </span>
                      )}
                    </HStack>
                    <span>
                      Registrado em:{' '}
                      {new Date(item.atualizadoEm || item.criadoEm).toLocaleString('pt-BR')}
                    </span>
                  </HStack>
                </CardContent>
              </Card>
            )
          })}

          {/* ── Paginação ── */}
          {totalPaginas > 1 && (
            <HStack className="justify-between items-center pt-2 px-1 text-xs text-white/60">
              <Text>
                Página {pagina} de {totalPaginas} ({total} itens)
              </Text>
              <HStack className="gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={pagina <= 1}
                  onPress={() => setPagina((p) => Math.max(1, p - 1))}
                  className="h-8 text-white/70"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={pagina >= totalPaginas}
                  onPress={() => setPagina((p) => p + 1)}
                  className="h-8 text-white/70"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </HStack>
            </HStack>
          )}
        </VStack>
      )}
    </VStack>
  )
})
