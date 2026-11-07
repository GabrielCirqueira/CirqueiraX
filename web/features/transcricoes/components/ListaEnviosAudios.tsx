import { Box, Button, HStack, Progress, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, CheckCircle2, Loader2, UploadCloud } from 'lucide-react'
import { memo } from 'react'
import type { EnvioAudio } from '../types'
import { formatarTamanho, isEnvioFinalizado } from '../utils'

function IconeEnvio({ envio }: { envio: EnvioAudio }) {
  if (envio.situacao === 'enviado') return <CheckCircle2 size={14} />
  if (envio.situacao === 'falhou') return <AlertTriangle size={14} />
  if (envio.situacao === 'enviando') {
    return <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
  }
  return <UploadCloud size={14} />
}

function corEnvio(envio: EnvioAudio): string {
  if (envio.situacao === 'enviado') return 'cirqueira.green.500'
  if (envio.situacao === 'falhou') return 'cirqueira.red.500'
  return 'cirqueira.brand.400'
}

function descreverEnvio(envio: EnvioAudio): string {
  if (envio.situacao === 'enviado') return 'Enviado · na fila de transcrição'
  if (envio.situacao === 'falhou') return envio.erro ?? 'Falha no envio'
  if (envio.situacao === 'enviando') return `Enviando ${envio.percentual}%`
  return 'Aguardando envio'
}

export interface ListaEnviosAudiosProps {
  envios: EnvioAudio[]
  onLimpar: () => void
}

export const ListaEnviosAudios = memo(function ListaEnviosAudios({
  envios,
  onLimpar,
}: ListaEnviosAudiosProps) {
  const finalizados = envios.filter(isEnvioFinalizado).length

  return (
    <VStack align="stretch" gap={2}>
      <HStack justify="space-between">
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
          Envios · {finalizados}/{envios.length}
        </Text>
        {finalizados > 0 && (
          <Button size="2xs" variant="ghost" borderRadius="md" color="fg.subtle" onClick={onLimpar}>
            Limpar concluídos
          </Button>
        )}
      </HStack>
      <VStack align="stretch" gap={1.5} maxH="220px" overflowY="auto" pr={1}>
        {envios.map((envio) => (
          <HStack
            key={envio.id}
            gap={2.5}
            p={2}
            borderRadius="lg"
            bg="bg.subtle"
            animation="fade-in 0.25s ease-out"
          >
            <Box color={corEnvio(envio)} display="inline-flex" flexShrink={0}>
              <IconeEnvio envio={envio} />
            </Box>
            <VStack align="stretch" gap={1} flex={1} minW={0}>
              <HStack justify="space-between" gap={2}>
                <Text fontSize="xs" fontWeight="medium" color="fg" truncate title={envio.nome}>
                  {envio.nome}
                </Text>
                <Text fontSize="10px" color="fg.subtle" fontFamily="mono" flexShrink={0}>
                  {formatarTamanho(envio.tamanhoBytes)}
                </Text>
              </HStack>
              {envio.situacao === 'enviando' && (
                <Progress.Root value={envio.percentual} size="xs" colorPalette="brand">
                  <Progress.Track borderRadius="full" bg="bg.muted">
                    <Progress.Range borderRadius="full" />
                  </Progress.Track>
                </Progress.Root>
              )}
              <Text
                fontSize="10px"
                color={envio.situacao === 'falhou' ? 'cirqueira.red.500' : 'fg.subtle'}
                lineClamp={2}
              >
                {descreverEnvio(envio)}
              </Text>
            </VStack>
          </HStack>
        ))}
      </VStack>
    </VStack>
  )
})
