import { AppContainer } from '@/layouts'
import { useSEO } from '@/shared/hooks'
import { Box, Button, Container, HStack, Spinner, Text, VStack } from '@chakra-ui/react'
import { CheckCircle2, Circle, Pause, Play, RefreshCw, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { TemaSpotify } from './components'
import { CHAVE_RETORNO_APOS_CONEXAO } from './components/SpotifyCallback'
import {
  type EstadoEtapa,
  type EtapaPlayerTeste,
  useObterUrlAutorizacaoSpotify,
  usePlayerTesteSpotify,
} from './hooks'

const TITULOS_ETAPAS: Record<EtapaPlayerTeste, string> = {
  sdk: '1. Baixar a biblioteca do Spotify',
  permissao: '2. Permissão de reprodução da conta',
  player: '3. Transformar esta aba num dispositivo',
  audio: '4. Tocar o som',
}

const ORDEM_ETAPAS: EtapaPlayerTeste[] = ['sdk', 'permissao', 'player', 'audio']

function IconeEtapa({ estado }: { estado: EstadoEtapa }): ReactNode {
  if (estado.situacao === 'executando') return <Spinner size="sm" color="cirqueira.spotify.verde" />
  if (estado.situacao === 'ok') return <CheckCircle2 size={20} color="#1ED760" />
  if (estado.situacao === 'falhou') return <XCircle size={20} color="#F15E6C" />
  return <Circle size={20} color="#535353" />
}

export function PlayerTesteSpotify() {
  useSEO({ title: 'Teste do player · Spotify', description: 'Testa se o Spotify toca nesta rede.' })
  const {
    etapas,
    registros,
    faixa,
    precisaReconectar,
    playerPronto,
    iniciar,
    tocar,
    alternarPausa,
  } = usePlayerTesteSpotify()
  const reconectar = useObterUrlAutorizacaoSpotify()
  const testando = ORDEM_ETAPAS.some((etapa) => etapas[etapa].situacao === 'executando')

  function abrirReconexao() {
    try {
      sessionStorage.setItem(CHAVE_RETORNO_APOS_CONEXAO, '/spotify/player-teste')
    } catch {
      return
    }
    reconectar.mutate(undefined, {
      onSuccess: (resposta) => {
        window.location.href = resposta.url
      },
    })
  }

  return (
    <TemaSpotify>
      <AppContainer>
        <Container maxW="2xl" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
          <VStack align="stretch" gap={5}>
            <VStack align="start" gap={1}>
              <Text fontSize="2xl" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                Teste do player do Spotify
              </Text>
              <Text fontSize="sm" color="cirqueira.spotify.textoSecundario">
                Abra esta página na rede do trabalho e clique em começar. Cada passo mostra se
                passou ou onde travou.
              </Text>
            </VStack>

            <VStack align="stretch" gap={2}>
              {ORDEM_ETAPAS.map((etapa) => (
                <HStack
                  key={etapa}
                  align="start"
                  gap={3}
                  p={3}
                  borderRadius="8px"
                  bg="cirqueira.spotify.cartao"
                >
                  <Box pt={0.5}>
                    <IconeEtapa estado={etapas[etapa]} />
                  </Box>
                  <VStack align="start" gap={0.5}>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="cirqueira.spotify.textoPrincipal"
                    >
                      {TITULOS_ETAPAS[etapa]}
                    </Text>
                    {etapas[etapa].detalhe && (
                      <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                        {etapas[etapa].detalhe}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              ))}
            </VStack>

            <HStack gap={2} flexWrap="wrap">
              <Button
                borderRadius="full"
                bg="cirqueira.spotify.verde"
                color="black"
                fontWeight="bold"
                _hover={{ bg: 'cirqueira.spotify.verdeHover' }}
                loading={testando && !playerPronto}
                onClick={() => void iniciar()}
              >
                <RefreshCw size={16} />
                {registros.length > 0 ? 'Testar de novo' : 'Começar teste'}
              </Button>
              {playerPronto && (
                <Button
                  borderRadius="full"
                  variant="outline"
                  color="cirqueira.spotify.textoPrincipal"
                  loading={etapas.audio.situacao === 'executando'}
                  onClick={() => void tocar()}
                >
                  <Play size={16} />
                  Tocar música de teste
                </Button>
              )}
              {precisaReconectar && (
                <Button
                  borderRadius="full"
                  variant="outline"
                  color="cirqueira.spotify.textoPrincipal"
                  loading={reconectar.isPending}
                  onClick={abrirReconexao}
                >
                  Reconectar Spotify
                </Button>
              )}
            </HStack>

            {faixa && (
              <HStack
                justify="space-between"
                p={4}
                borderRadius="8px"
                bg="cirqueira.spotify.cartaoElevado"
              >
                <VStack align="start" gap={0} minW={0}>
                  <Text fontWeight="bold" color="cirqueira.spotify.textoPrincipal" truncate>
                    {faixa.nome}
                  </Text>
                  <Text fontSize="sm" color="cirqueira.spotify.textoSecundario" truncate>
                    {faixa.artistas}
                  </Text>
                </VStack>
                <Button
                  borderRadius="full"
                  bg="white"
                  color="black"
                  aria-label={faixa.pausado ? 'Tocar' : 'Pausar'}
                  onClick={alternarPausa}
                >
                  {faixa.pausado ? <Play size={18} /> : <Pause size={18} />}
                </Button>
              </HStack>
            )}

            {registros.length > 0 && (
              <Box
                p={3}
                borderRadius="8px"
                bg="blackAlpha.500"
                fontFamily="mono"
                fontSize="xs"
                color="cirqueira.spotify.textoSecundario"
                maxH="220px"
                overflowY="auto"
              >
                {registros.map((registro, indice) => (
                  <Text key={`${indice}-${registro}`}>{registro}</Text>
                ))}
              </Box>
            )}
          </VStack>
        </Container>
      </AppContainer>
    </TemaSpotify>
  )
}

export const Component = PlayerTesteSpotify

export default PlayerTesteSpotify
