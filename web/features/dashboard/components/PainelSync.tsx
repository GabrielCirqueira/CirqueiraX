import { Badge, Box, Button, HStack, IconButton, Skeleton, Text, VStack } from '@chakra-ui/react'
import { Loader2, RefreshCw } from 'lucide-react'
import { memo, useState } from 'react'
import { useSincronizarPasta, useStatusSync } from '../hooks/useDashboard'
import type { PastaSync } from '../types'
import { obterEstadoBadge } from '../utils/statusSync'
import { PainelDashboard } from './PainelDashboard'

export interface PainelSyncProps {
  pastas?: PastaSync[]
  carregando?: boolean
}

const CHAVES_CARREGANDO = ['sync-sk-1', 'sync-sk-2']
const TEMPO_MENSAGEM_MS = 4000

export const PainelSync = memo(function PainelSync({
  pastas: pastasList,
  carregando: carregandoProp,
}: PainelSyncProps) {
  const { data: statusQuery, isLoading: carregandoQuery, refetch, isFetching } = useStatusSync()
  const { mutate: dispararSync, isPending: sincronizando } = useSincronizarPasta()
  const [pastaEmAcao, setPastaEmAcao] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const online = statusQuery?.online ?? false
  const versao = statusQuery?.versao
  const pastas = pastasList ?? statusQuery?.pastas ?? []
  const carregando = carregandoProp ?? carregandoQuery

  function handleSincronizar(pastaId: string) {
    setPastaEmAcao(pastaId)
    setMensagemSucesso(null)
    dispararSync(pastaId, {
      onSuccess: (resposta) => {
        setMensagemSucesso(resposta.mensagem || `Sincronização da pasta ${pastaId} iniciada.`)
        setPastaEmAcao(null)
        setTimeout(() => setMensagemSucesso(null), TEMPO_MENSAGEM_MS)
      },
      onError: () => setPastaEmAcao(null),
    })
  }

  return (
    <PainelDashboard
      semEspacamento
      titulo="Sincronização"
      descricao="Pastas do Syncthing com o celular e a VPS"
      acao={
        <HStack gap={2}>
          <HStack gap={1.5} fontSize="xs" color="fg.subtle">
            <Box
              w={1.5}
              h={1.5}
              borderRadius="full"
              bg={online ? 'cirqueira.green.500' : 'cirqueira.red.500'}
            />
            <Text as="span">{online ? `Online${versao ? ` · v${versao}` : ''}` : 'Offline'}</Text>
          </HStack>
          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="lg"
            color="fg.muted"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Atualizar status"
          >
            <RefreshCw
              size={13}
              style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }}
            />
          </IconButton>
        </HStack>
      }
    >
      {mensagemSucesso && (
        <Text px={5} pb={3} fontSize="xs" color="cirqueira.green.500">
          {mensagemSucesso}
        </Text>
      )}

      <VStack align="stretch" gap={0} borderTopWidth="1px" borderColor="border.subtle">
        {carregando &&
          pastas.length === 0 &&
          CHAVES_CARREGANDO.map((chave) => (
            <HStack key={chave} px={5} py={3} justify="space-between">
              <Skeleton h={4} w="40%" />
              <Skeleton h={4} w={24} />
            </HStack>
          ))}

        {!carregando && pastas.length === 0 && (
          <Text px={5} py={8} fontSize="sm" color="fg.subtle" textAlign="center">
            Nenhuma pasta configurada no Syncthing.
          </Text>
        )}

        {pastas.map((pasta) => {
          const estado = obterEstadoBadge(pasta.estado, pasta.emSincronizacao)
          const sincronizandoEsta = sincronizando && pastaEmAcao === pasta.id
          return (
            <HStack
              key={pasta.id}
              justify="space-between"
              gap={4}
              px={5}
              py={3}
              borderBottomWidth="1px"
              borderColor="border.subtle"
              _last={{ borderBottomWidth: 0 }}
              flexWrap={{ base: 'wrap', md: 'nowrap' }}
            >
              <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
                <Text fontSize="sm" color="fg" truncate maxW="full">
                  {pasta.label || pasta.id}
                </Text>
                <Text fontSize="xs" fontFamily="mono" color="fg.subtle" truncate maxW="full">
                  {pasta.caminho || pasta.id}
                </Text>
              </VStack>

              <Text fontSize="xs" color="fg.subtle" flexShrink={0}>
                {pasta.tamanhoFormatado || '0 B'}
              </Text>

              <Badge
                size="sm"
                variant="subtle"
                colorPalette={estado.colorPalette}
                borderRadius="md"
                flexShrink={0}
              >
                {estado.label}
              </Badge>

              <Button
                size="xs"
                variant="ghost"
                borderRadius="lg"
                color="fg.muted"
                flexShrink={0}
                disabled={sincronizandoEsta || pasta.emSincronizacao}
                onClick={() => handleSincronizar(pasta.id)}
              >
                {sincronizandoEsta ? (
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RefreshCw size={12} />
                )}
                Sincronizar
              </Button>
            </HStack>
          )
        })}
      </VStack>
    </PainelDashboard>
  )
})
