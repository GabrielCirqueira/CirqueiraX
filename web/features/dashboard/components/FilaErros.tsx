import { Badge, Box, Button, Card, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
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

const ORIGEM_ICON: Record<OrigemMedia, typeof Bot> = {
  print_empresa: Building2,
  print_pessoal: Smartphone,
  bot_telegram: Bot,
  download: DownloadCloud,
  manual: UploadCloud,
}

export const FilaErros = memo(function FilaErros() {
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
      <VStack w="full" gap={4} alignItems="stretch">
        <HStack justify="space-between" align="center">
          <Skeleton h={6} w={48} borderRadius="md" />
          <Skeleton h={9} w={32} borderRadius="xl" />
        </HStack>
        <VStack gap={3} w="full" alignItems="stretch">
          {['erro-sk-1', 'erro-sk-2'].map((chave) => (
            <Card.Root key={chave} borderWidth="1px" borderColor="border.subtle" bg="bg.panel">
              <Card.Body p={4}>
                <Skeleton h={5} w={44} borderRadius="md" mb={2} />
                <Skeleton h={10} w="full" borderRadius="md" mb={3} />
                <Skeleton h={8} w={32} borderRadius="lg" />
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      </VStack>
    )
  }

  return (
    <VStack w="full" gap={4} alignItems="stretch">
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
        <HStack gap={2.5}>
          <Box p={2} borderRadius="xl" bg="red.500/10" color="red.500">
            <AlertTriangle size={20} />
          </Box>
          <VStack gap={0.5} alignItems="flex-start">
            <HStack gap={2} align="center">
              <Text fontSize="base" fontWeight="semibold" color="fg">Fila Operacional de Erros</Text>
              {total > 0 && (
                <Badge
                  size="sm"
                  variant="subtle"
                  colorPalette="red"
                  fontWeight="semibold"
                >
                  {total} {total === 1 ? 'falha' : 'falhas'}
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color="fg.subtle">
              Itens que falharam na ingestão, download ou sincronização
            </Text>
          </VStack>
        </HStack>

        {total > 0 && (
          <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            disabled={retentandoTodos}
            onClick={handleRetentarTodos}
            fontSize="xs"
            fontWeight="medium"
            h={9}
            borderRadius="xl"
          >
            {retentandoTodos ? (
              <HStack gap={1.5}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Reprocessando...</span>
              </HStack>
            ) : (
              <HStack gap={1.5}>
                <RotateCcw size={14} />
                <span>Retentar Todos ({total})</span>
              </HStack>
            )}
          </Button>
        )}
      </HStack>

      {mensagemSucesso && (
        <Box p={3} borderRadius="xl" bg="emerald.500/10" borderWidth="1px" borderColor="emerald.500/20" color="emerald.500" fontSize="xs" display="flex" alignItems="center" gap={2}>
          <CheckCircle2 size={16} flexShrink={0} />
          <span>{mensagemSucesso}</span>
        </Box>
      )}

      {itens.length === 0 ? (
        <Card.Root borderWidth="1px" borderColor="emerald.500/20" bg="emerald.500/5" p={8} textAlign="center" shadow="lg">
          <Card.Body display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2.5}>
            <Box p={3} borderRadius="full" bg="emerald.500/10" color="emerald.500">
              <CheckCircle2 size={32} />
            </Box>
            <Text fontSize="sm" fontWeight="semibold" color="emerald.500">
              Nenhuma falha ativa no pipeline
            </Text>
            <Text fontSize="xs" color="fg.subtle" maxW="md">
              Todos os downloads, prints e sincronizações foram processados com sucesso.
            </Text>
          </Card.Body>
        </Card.Root>
      ) : (
        <VStack w="full" gap={3} alignItems="stretch">
          {itens.map((item) => {
            const IconeOrigem = ORIGEM_ICON[item.origem] || FileVideo
            const estaRetentando = retentandoIndividual && itemEmAcao === item.uuid
            const tituloMedia =
              (item.metadata?.titulo as string) ||
              (item.metadata?.nome_original as string) ||
              item.caminhoLocal?.split('/').pop() ||
              `Mídia ${item.hash.substring(0, 8)}`

            return (
              <Card.Root
                key={item.uuid}
                borderWidth="1px"
                borderColor="red.500/30"
                bg="red.500/5"
                shadow="md"
                transition="all 0.2s"
                _hover={{ borderColor: 'red.500/50' }}
              >
                <Card.Body p={4}>
                  <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={2} mb={3}>
                    <HStack gap={2.5} align="center">
                      <Box p={2} borderRadius="xl" bg="red.500/10" color="red.500">
                        <IconeOrigem size={16} />
                      </Box>
                      <VStack gap={0.5} alignItems="flex-start">
                        <Text fontSize="sm" fontWeight="semibold" color="fg" truncate maxW={{ base: '280px', sm: 'md' }}>
                          {tituloMedia}
                        </Text>
                        <HStack gap={2} fontSize="11px" color="fg.subtle">
                          <span>Origem: {item.origemDescricao}</span>
                          <span>•</span>
                          <span>Hash: {item.hash.substring(0, 10)}...</span>
                        </HStack>
                      </VStack>
                    </HStack>

                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      disabled={estaRetentando || retentandoTodos}
                      onClick={() => handleRetentarItem(item.uuid)}
                      fontSize="xs"
                      fontWeight="medium"
                      h={8}
                    >
                      {estaRetentando ? (
                        <HStack gap={1.5}>
                          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Retentando...</span>
                        </HStack>
                      ) : (
                        <HStack gap={1.5}>
                          <RefreshCw size={12} />
                          <span>Tentar novamente</span>
                        </HStack>
                      )}
                    </Button>
                  </HStack>

                  <Box p={3} borderRadius="xl" bg="red.500/10" borderWidth="1px" borderColor="red.500/20" color="red.500" fontSize="xs" display="flex" alignItems="flex-start" gap={2.5} mb={3}>
                    <AlertCircle size={16} flexShrink={0} style={{ marginTop: '2px' }} />
                    <VStack gap={0.5} flex={1} alignItems="flex-start">
                      <Text fontWeight="semibold" color="red.500">Motivo da Falha:</Text>
                      <Text fontFamily="mono" fontSize="11px" wordBreak="break-all">
                        {item.erroMotivo || 'Erro genérico durante o processamento do pipeline.'}
                      </Text>
                    </VStack>
                  </Box>

                  <HStack justify="space-between" align="center" fontSize="11px" color="fg.subtle" pt={1} borderTopWidth="1px" borderColor="border.subtle" flexWrap="wrap" gap={2}>
                    <HStack gap={2}>
                      {item.categoria?.nome && <span>Categoria: {item.categoria.nome}</span>}
                      {item.caminhoLocal && (
                        <span style={{ fontFamily: 'monospace' }}>
                          📁 {item.caminhoLocal}
                        </span>
                      )}
                    </HStack>
                    <span>
                      Registrado em:{' '}
                      {new Date(item.atualizadoEm || item.criadoEm).toLocaleString('pt-BR')}
                    </span>
                  </HStack>
                </Card.Body>
              </Card.Root>
            )
          })}

          {totalPaginas > 1 && (
            <HStack justify="space-between" align="center" pt={2} px={1} fontSize="xs" color="fg.subtle">
              <Text>
                Página {pagina} de {totalPaginas} ({total} itens)
              </Text>
              <HStack gap={1.5}>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  h={8}
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  h={8}
                >
                  <span>Próxima</span>
                  <ChevronRight size={16} />
                </Button>
              </HStack>
            </HStack>
          )}
        </VStack>
      )}
    </VStack>
  )
})