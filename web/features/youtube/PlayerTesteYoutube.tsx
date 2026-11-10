import { useSEO } from '@/shared/hooks'
import { Box, Button, HStack, Input, Spinner, Text, VStack } from '@chakra-ui/react'
import { CheckCircle2, Circle, Pause, Play, RefreshCw, Wifi, XCircle } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import {
  type EstadoEtapaYoutube,
  type EtapaPlayerTesteYoutube,
  VIDEO_TESTE_PADRAO,
  extrairIdVideoYoutube,
  usePlayerTesteYoutube,
} from './hooks/usePlayerTesteYoutube'

const TITULOS_ETAPAS: Record<EtapaPlayerTesteYoutube, string> = {
  api: '1. Baixar a biblioteca do player do YouTube',
  player: '2. Abrir o player nesta aba',
  audio: '3. Tocar e ver o tempo andar',
}

const ORDEM_ETAPAS: EtapaPlayerTesteYoutube[] = ['api', 'player', 'audio']

function IconeEtapa({ estado }: { estado: EstadoEtapaYoutube }): ReactNode {
  if (estado.situacao === 'executando') return <Spinner size="sm" color="red.400" />
  if (estado.situacao === 'ok') return <CheckCircle2 size={20} color="#22C55E" />
  if (estado.situacao === 'falhou') return <XCircle size={20} color="#EF4444" />
  return <Circle size={20} color="#71717A" />
}

function formatarTempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function PlayerTesteYoutube() {
  useSEO({
    title: 'Teste do player · YouTube',
    description: 'Testa se o player do YouTube toca nesta rede.',
  })
  const {
    containerRef,
    etapas,
    registros,
    reproducao,
    playerPronto,
    iniciar,
    tocar,
    trocarVideo,
    alternarPausa,
    testarEnderecos,
  } = usePlayerTesteYoutube()
  const [link, setLink] = useState('')
  const idDigitado = extrairIdVideoYoutube(link)
  const testando = ORDEM_ETAPAS.some((etapa) => etapas[etapa].situacao === 'executando')

  return (
    <Box w="full" maxW="2xl" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
      <VStack align="stretch" gap={5}>
        <VStack align="start" gap={1}>
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            Teste do player do YouTube
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Abra esta página na rede do trabalho, clique em começar e depois em tocar. Cada passo
            mostra se passou ou onde travou. Nada aqui é salvo.
          </Text>
        </VStack>

        <VStack align="stretch" gap={2}>
          {ORDEM_ETAPAS.map((etapa) => (
            <HStack key={etapa} align="start" gap={3} p={3} borderRadius="8px" bg="bg.panel">
              <Box pt={0.5}>
                <IconeEtapa estado={etapas[etapa]} />
              </Box>
              <VStack align="start" gap={0.5}>
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  {TITULOS_ETAPAS[etapa]}
                </Text>
                {etapas[etapa].detalhe && (
                  <Text fontSize="xs" color="fg.muted">
                    {etapas[etapa].detalhe}
                  </Text>
                )}
              </VStack>
            </HStack>
          ))}
        </VStack>

        <HStack gap={2} flexWrap="wrap">
          <Button
            colorPalette="red"
            borderRadius="full"
            loading={testando && !playerPronto}
            onClick={() => void iniciar(idDigitado ?? VIDEO_TESTE_PADRAO)}
          >
            <RefreshCw size={16} />
            {registros.length > 0 ? 'Testar de novo' : 'Começar teste'}
          </Button>
          {playerPronto && (
            <Button
              variant="outline"
              borderRadius="full"
              loading={etapas.audio.situacao === 'executando'}
              onClick={tocar}
            >
              <Play size={16} />
              Tocar
            </Button>
          )}
          <Button variant="ghost" borderRadius="full" onClick={() => void testarEnderecos()}>
            <Wifi size={16} />
            Testar endereços
          </Button>
        </HStack>

        <VStack align="stretch" gap={2}>
          <Text fontSize="xs" color="fg.muted">
            Opcional: cole o link de uma música (YouTube ou YouTube Music) para ver se ela toca fora
            do YouTube. Sem link, o teste usa um vídeo de exemplo do próprio YouTube.
          </Text>
          <HStack gap={2}>
            <Input
              size="sm"
              placeholder="https://music.youtube.com/watch?v=..."
              value={link}
              onChange={(evento) => setLink(evento.target.value)}
            />
            {playerPronto && (
              <Button
                size="sm"
                variant="outline"
                disabled={!idDigitado}
                onClick={() => idDigitado && trocarVideo(idDigitado)}
              >
                Tocar este
              </Button>
            )}
          </HStack>
          {link.trim() !== '' && !idDigitado && (
            <Text fontSize="xs" color="red.400">
              Não encontrei o código do vídeo nesse link.
            </Text>
          )}
        </VStack>

        <Box
          ref={containerRef}
          w="356px"
          maxW="full"
          minH={playerPronto ? '200px' : 0}
          borderRadius="8px"
          overflow="hidden"
        />

        {reproducao && (
          <HStack justify="space-between" p={4} borderRadius="8px" bg="bg.muted">
            <VStack align="start" gap={0} minW={0}>
              <Text fontWeight="bold" color="fg" truncate>
                {reproducao.titulo}
              </Text>
              <Text fontSize="sm" color="fg.muted" truncate>
                {reproducao.canal} · {formatarTempo(reproducao.segundos)} /{' '}
                {formatarTempo(reproducao.duracao)}
              </Text>
            </VStack>
            <Button
              borderRadius="full"
              aria-label={reproducao.pausado ? 'Tocar' : 'Pausar'}
              onClick={alternarPausa}
            >
              {reproducao.pausado ? <Play size={18} /> : <Pause size={18} />}
            </Button>
          </HStack>
        )}

        {registros.length > 0 && (
          <Box
            p={3}
            borderRadius="8px"
            bg="bg.subtle"
            fontFamily="mono"
            fontSize="xs"
            color="fg.muted"
            maxH="220px"
            overflowY="auto"
          >
            {registros.map((registro, indice) => (
              <Text key={`${indice}-${registro}`}>{registro}</Text>
            ))}
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export const Component = PlayerTesteYoutube

export default PlayerTesteYoutube
