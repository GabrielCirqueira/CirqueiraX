import { Box, Button, HStack, Heading, Spinner, Text, VStack } from '@chakra-ui/react'
import { ArrowLeftRight, RefreshCw } from 'lucide-react'
import { memo, useState } from 'react'
import {
  useListarTransferenciasPendentes,
  useListarVinculos,
  useSincronizarVinculo,
} from '../hooks'
import type { TransferenciaResumo } from '../types'
import { formatarDataCurta, formatarNumero, labelServico } from '../utils'
import { AssistenteTransferenciaPlaylists } from './AssistenteTransferenciaPlaylists'

function rotuloStatusPendente(transferencia: TransferenciaResumo): string {
  switch (transferencia.status) {
    case 'casando':
      return 'Casando faixas'
    case 'previa':
      return 'Prévia pronta — revisar e confirmar'
    case 'executando':
      return 'Transferindo faixas'
    case 'pausada_cota':
      return 'Pausada por cota da API'
    default:
      return transferencia.statusDescricao
  }
}

export const SecaoTransferenciaPlaylists = memo(function SecaoTransferenciaPlaylists() {
  const [assistenteAberto, setAssistenteAberto] = useState(false)
  const [uuidRetomar, setUuidRetomar] = useState<string | null>(null)
  const { data: vinculos, isLoading } = useListarVinculos()
  const { data: pendentesData, isLoading: carregandoPendentes } = useListarTransferenciasPendentes()
  const sincronizar = useSincronizarVinculo()
  const pendentes = pendentesData?.itens ?? []

  function abrirNova() {
    setUuidRetomar(null)
    setAssistenteAberto(true)
  }

  function continuar(uuid: string) {
    setUuidRetomar(uuid)
    setAssistenteAberto(true)
  }

  function fecharAssistente() {
    setAssistenteAberto(false)
    setUuidRetomar(null)
  }

  return (
    <>
      <VStack
        align="stretch"
        gap={4}
        p={{ base: 4, md: 6 }}
        bg="cirqueira.musica.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="cirqueira.musica.cartaoElevado"
      >
        <HStack justify="space-between" align="start" gap={3} wrap="wrap">
          <VStack align="start" gap={1} minW={0} flex={1}>
            <HStack gap={2}>
              <ArrowLeftRight size={18} color="var(--chakra-colors-cirqueira-musica-verde)" />
              <Heading
                as="h2"
                fontSize="md"
                fontWeight="bold"
                color="cirqueira.musica.textoPrincipal"
              >
                Transferência de playlists
              </Heading>
            </HStack>
            <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
              Copie playlists entre Spotify e YouTube Music, revise o casamento das faixas e
              sincronize vínculos já criados.
            </Text>
          </VStack>
          <Button
            borderRadius="full"
            fontWeight="bold"
            bg="cirqueira.musica.verde"
            color="cirqueira.grey.950"
            _hover={{ bg: 'cirqueira.musica.verdeHover' }}
            onClick={abrirNova}
          >
            Nova transferência
          </Button>
        </HStack>

        {carregandoPendentes ? (
          <HStack gap={2}>
            <Spinner size="sm" color="cirqueira.musica.verde" />
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              Buscando transferências em andamento...
            </Text>
          </HStack>
        ) : pendentes.length > 0 ? (
          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.amarelo">
              Em andamento / aguardando confirmação
            </Text>
            {pendentes.map((transferencia) => (
              <Box
                key={transferencia.uuid}
                p={3}
                borderRadius="8px"
                bg="cirqueira.musica.cartaoElevado"
                border="1px solid"
                borderColor="cirqueira.musica.verde"
              >
                <HStack justify="space-between" align="start" gap={3}>
                  <VStack align="start" gap={0.5} minW={0} flex={1}>
                    <Text fontSize="sm" fontWeight="semibold">
                      {rotuloStatusPendente(transferencia)}
                    </Text>
                    <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                      {labelServico(transferencia.origem)} → {labelServico(transferencia.destino)} ·{' '}
                      {formatarNumero(transferencia.totalCasadas)} casadas ·{' '}
                      {formatarNumero(transferencia.totalNaoEncontradas)} não encontradas ·{' '}
                      {formatarNumero(transferencia.totalFaixas)} faixas
                    </Text>
                    <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
                      atualizado {formatarDataCurta(transferencia.atualizadoEm)}
                    </Text>
                  </VStack>
                  <Button
                    size="xs"
                    borderRadius="full"
                    fontWeight="bold"
                    bg="cirqueira.musica.verde"
                    color="cirqueira.grey.950"
                    flexShrink={0}
                    onClick={() => continuar(transferencia.uuid)}
                  >
                    Continuar
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : null}

        {isLoading ? (
          <HStack gap={2}>
            <Spinner size="sm" color="cirqueira.musica.verde" />
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              Carregando vínculos...
            </Text>
          </HStack>
        ) : !vinculos || vinculos.length === 0 ? (
          <Text fontSize="xs" color="cirqueira.musica.textoDesabilitado">
            Nenhum vínculo de playlist ainda. Os vínculos aparecem depois que você confirma e
            executa uma transferência.
          </Text>
        ) : (
          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.textoSecundario">
              Vínculos já criados
            </Text>
            {vinculos.map((vinculo) => (
              <Box key={vinculo.uuid} p={3} borderRadius="8px" bg="cirqueira.musica.cartaoElevado">
                <HStack justify="space-between" align="start" gap={3}>
                  <VStack align="start" gap={0.5} minW={0} flex={1}>
                    <Text fontSize="sm" fontWeight="semibold" truncate maxW="full">
                      {vinculo.nomeSpotify} ↔ {vinculo.nomeYoutube}
                    </Text>
                    <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                      {vinculo.modoDescricao}
                      {vinculo.ultimaSincronizacaoEm
                        ? ` · última sync ${formatarDataCurta(vinculo.ultimaSincronizacaoEm)}`
                        : ' · ainda não sincronizado'}
                    </Text>
                  </VStack>
                  <Button
                    size="xs"
                    borderRadius="full"
                    variant="outline"
                    borderColor="cirqueira.musica.verde"
                    color="cirqueira.musica.verde"
                    flexShrink={0}
                    loading={sincronizar.isPending && sincronizar.variables?.uuid === vinculo.uuid}
                    onClick={() => sincronizar.mutate({ uuid: vinculo.uuid })}
                  >
                    <HStack gap={1}>
                      <RefreshCw size={12} />
                      <Text as="span">Sincronizar</Text>
                    </HStack>
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>

      <AssistenteTransferenciaPlaylists
        aberto={assistenteAberto}
        onFechar={fecharAssistente}
        uuidRetomar={uuidRetomar}
      />
    </>
  )
})
