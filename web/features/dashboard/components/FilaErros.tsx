import { Button, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react'
import { memo, useState } from 'react'
import { useFilaErros, useRetentarErroIndividual, useRetentarErros } from '../hooks/useDashboard'
import { extrairTituloErro, formatarDataHoraErro } from '../utils/formatadoresDashboard'
import { pluralizar } from '../utils/metricasDashboard'
import { PainelDashboard } from './PainelDashboard'

const LIMITE_POR_PAGINA = 10
const TEMPO_MENSAGEM_MS = 4000
const CHAVES_CARREGANDO = ['erro-sk-1', 'erro-sk-2', 'erro-sk-3']

export const FilaErros = memo(function FilaErros() {
  const [pagina, setPagina] = useState(1)
  const [itemEmAcao, setItemEmAcao] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const { data: resposta, isLoading: carregando } = useFilaErros(pagina, LIMITE_POR_PAGINA)
  const { mutate: retentarTodos, isPending: retentandoTodos } = useRetentarErros()
  const { mutate: retentarIndividual, isPending: retentandoIndividual } =
    useRetentarErroIndividual()

  const itens = resposta?.data ?? []
  const total = resposta?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA))

  function exibirMensagem(mensagem: string) {
    setMensagemSucesso(mensagem)
    setTimeout(() => setMensagemSucesso(null), TEMPO_MENSAGEM_MS)
  }

  function handleRetentarTodos() {
    setMensagemSucesso(null)
    retentarTodos(undefined, {
      onSuccess: (retentados) =>
        exibirMensagem(
          `Reprocessamento iniciado para ${pluralizar(retentados.length, 'mídia', 'mídias')}.`
        ),
    })
  }

  function handleRetentarItem(uuid: string) {
    setItemEmAcao(uuid)
    setMensagemSucesso(null)
    retentarIndividual(uuid, {
      onSuccess: () => exibirMensagem('Reprocessamento do item iniciado.'),
      onSettled: () => setItemEmAcao(null),
    })
  }

  return (
    <PainelDashboard
      semEspacamento
      titulo="Erros"
      descricao="Mídias que falharam na ingestão, no download ou na sincronização"
      acao={
        total > 0 && (
          <Button
            size="xs"
            variant="outline"
            borderRadius="lg"
            disabled={retentandoTodos}
            onClick={handleRetentarTodos}
          >
            {retentandoTodos ? (
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <RotateCcw size={12} />
            )}
            Retentar todos ({total})
          </Button>
        )
      }
    >
      {mensagemSucesso && (
        <Text px={5} pb={3} fontSize="xs" color="cirqueira.green.500">
          {mensagemSucesso}
        </Text>
      )}

      <VStack align="stretch" gap={0} borderTopWidth="1px" borderColor="border.subtle">
        {carregando &&
          itens.length === 0 &&
          CHAVES_CARREGANDO.map((chave) => (
            <VStack key={chave} align="stretch" px={5} py={3} gap={2}>
              <Skeleton h={4} w="50%" />
              <Skeleton h={3} w="80%" />
            </VStack>
          ))}

        {!carregando && itens.length === 0 && (
          <Text px={5} py={8} fontSize="sm" color="fg.subtle" textAlign="center">
            Nenhuma falha pendente.
          </Text>
        )}

        {itens.map((item) => {
          const retentandoEste = retentandoIndividual && itemEmAcao === item.uuid
          return (
            <HStack
              key={item.uuid}
              justify="space-between"
              align="flex-start"
              gap={4}
              px={5}
              py={3}
              borderBottomWidth="1px"
              borderColor="border.subtle"
              _last={{ borderBottomWidth: 0 }}
            >
              <VStack align="flex-start" gap={1} minW={0} flex={1}>
                <Text fontSize="sm" color="fg" truncate maxW="full">
                  {extrairTituloErro(item)}
                </Text>
                <Text fontSize="xs" color="fg.subtle" truncate maxW="full">
                  {item.origemDescricao}
                  {item.categoria?.nome ? ` · ${item.categoria.nome}` : ''} ·{' '}
                  {formatarDataHoraErro(item.atualizadoEm || item.criadoEm)}
                </Text>
                <Text
                  fontSize="xs"
                  fontFamily="mono"
                  color="cirqueira.red.500"
                  lineClamp={2}
                  wordBreak="break-word"
                >
                  {item.erroMotivo || 'Erro sem descrição.'}
                </Text>
              </VStack>

              <Button
                size="xs"
                variant="ghost"
                borderRadius="lg"
                color="fg.muted"
                flexShrink={0}
                disabled={retentandoEste || retentandoTodos}
                onClick={() => handleRetentarItem(item.uuid)}
              >
                {retentandoEste ? (
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RotateCcw size={12} />
                )}
                Retentar
              </Button>
            </HStack>
          )
        })}
      </VStack>

      {totalPaginas > 1 && (
        <HStack
          justify="space-between"
          px={5}
          py={3}
          borderTopWidth="1px"
          borderColor="border.subtle"
        >
          <Text fontSize="xs" color="fg.subtle">
            Página {pagina} de {totalPaginas}
          </Text>
          <HStack gap={1}>
            <Button
              size="xs"
              variant="ghost"
              borderRadius="lg"
              disabled={pagina <= 1}
              onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
            >
              <ChevronLeft size={14} />
              Anterior
            </Button>
            <Button
              size="xs"
              variant="ghost"
              borderRadius="lg"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((atual) => atual + 1)}
            >
              Próxima
              <ChevronRight size={14} />
            </Button>
          </HStack>
        </HStack>
      )}
    </PainelDashboard>
  )
})
