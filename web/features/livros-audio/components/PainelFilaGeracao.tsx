import { Badge, Box, HStack, IconButton, Progress, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, ArrowUpToLine, ListOrdered, Pause, Play } from 'lucide-react'
import { memo } from 'react'
import { useAlterarFilaLivro } from '../hooks/useLivrosAudio'
import type { EstadoDisco, FilaGeracao } from '../types'
import { formatarTamanhoLivro, formatarTempoRestante } from '../utils/livros'

interface PainelFilaGeracaoProps {
  fila: FilaGeracao | undefined
  disco: EstadoDisco | undefined
}

export const PainelFilaGeracao = memo(function PainelFilaGeracao({
  fila,
  disco,
}: PainelFilaGeracaoProps) {
  const alterarFilaMutation = useAlterarFilaLivro()
  const livros = fila?.livros ?? []
  const avisoDisco = disco && disco.nivel !== 'ok' ? disco : null

  if (livros.length === 0 && !avisoDisco) return null

  return (
    <VStack align="stretch" gap={3} w="full">
      {avisoDisco && (
        <HStack
          gap={2.5}
          align="start"
          px={4}
          py={3}
          borderRadius="xl"
          border="1px solid"
          borderColor={
            avisoDisco.nivel === 'critico' ? 'cirqueira.red.500/40' : 'cirqueira.yellow.500/30'
          }
          bg={avisoDisco.nivel === 'critico' ? 'cirqueira.red.500/10' : 'cirqueira.yellow.500/10'}
          color={avisoDisco.nivel === 'critico' ? 'cirqueira.red.300' : 'cirqueira.yellow.300'}
        >
          <Box flexShrink={0} mt="2px">
            <AlertTriangle size={16} />
          </Box>
          <Text fontSize="sm">
            {avisoDisco.mensagem} Livre: {formatarTamanhoLivro(avisoDisco.livreBytes)} de{' '}
            {formatarTamanhoLivro(avisoDisco.totalBytes)}
            {avisoDisco.bytesParaFila > 0
              ? `. A fila ainda vai ocupar cerca de ${formatarTamanhoLivro(avisoDisco.bytesParaFila)}.`
              : '.'}
          </Text>
        </HStack>
      )}

      {livros.length > 0 && fila && (
        <Box
          bg="cirqueira.grey.950"
          border="1px solid"
          borderColor="cirqueira.grey.900"
          borderRadius="xl"
          p={4}
        >
          <HStack justify="space-between" mb={3} gap={3} flexWrap="wrap">
            <HStack gap={2} color="cirqueira.brand.400">
              <ListOrdered size={16} />
              <Text fontSize="sm" fontWeight="bold" color="cirqueira.grey.0">
                Fila de geração
              </Text>
            </HStack>
            <Text fontSize="xs" color="cirqueira.grey.400">
              {fila.partesNaFila} partes, cerca de {formatarTempoRestante(fila.segundosRestantes)} (
              {fila.segundosPorParte} s por parte)
            </Text>
          </HStack>

          <Text fontSize="11px" color="cirqueira.grey.500" mb={3}>
            O livro que você está ouvindo passa na frente, e as partes a partir da página onde você
            está são geradas primeiro.
          </Text>

          <VStack align="stretch" gap={2}>
            {livros.map((item) => {
              const percentual =
                item.totalPartes > 0 ? Math.round((item.partesProntas / item.totalPartes) * 100) : 0
              const alterando =
                alterarFilaMutation.isPending && alterarFilaMutation.variables?.uuid === item.uuid

              return (
                <HStack
                  key={item.uuid}
                  gap={3}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  bg="cirqueira.grey.900/50"
                  opacity={item.pausado ? 0.65 : 1}
                >
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="cirqueira.grey.400"
                    w="20px"
                    textAlign="center"
                    flexShrink={0}
                  >
                    {item.posicao}
                  </Text>
                  <VStack align="stretch" gap={1} flex={1} minW={0}>
                    <HStack gap={1.5} minW={0}>
                      <Text fontSize="xs" fontWeight="semibold" color="cirqueira.grey.100" truncate>
                        {item.titulo}
                      </Text>
                      {item.pausado && (
                        <Badge size="xs" variant="subtle" colorPalette="gray" fontSize="9px">
                          Pausado
                        </Badge>
                      )}
                      {!item.pausado && item.priorizado && (
                        <Badge size="xs" variant="subtle" colorPalette="brand" fontSize="9px">
                          Prioridade
                        </Badge>
                      )}
                      {!item.pausado && item.ouvindoAgora && (
                        <Badge size="xs" variant="subtle" colorPalette="green" fontSize="9px">
                          Ouvindo agora · pág. {item.paginaAtual}
                        </Badge>
                      )}
                    </HStack>
                    <Progress.Root value={percentual} size="xs" colorPalette="brand">
                      <Progress.Track bg="cirqueira.grey.900" borderRadius="full">
                        <Progress.Range borderRadius="full" />
                      </Progress.Track>
                    </Progress.Root>
                    <Text fontSize="10px" color="cirqueira.grey.500">
                      {item.partesProntas} de {item.totalPartes} partes
                      {item.segundosParaTerminar !== null
                        ? ` · termina em cerca de ${formatarTempoRestante(item.segundosParaTerminar)}`
                        : ''}
                    </Text>
                  </VStack>
                  <HStack gap={0.5} flexShrink={0}>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      color="cirqueira.grey.400"
                      _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.800' }}
                      aria-label={item.pausado ? 'Retomar geração' : 'Pausar geração'}
                      title={item.pausado ? 'Retomar' : 'Pausar'}
                      disabled={alterando}
                      onClick={() =>
                        alterarFilaMutation.mutate({
                          uuid: item.uuid,
                          acao: item.pausado ? 'retomar' : 'pausar',
                        })
                      }
                    >
                      {item.pausado ? <Play size={13} /> : <Pause size={13} />}
                    </IconButton>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      color="cirqueira.grey.400"
                      _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.800' }}
                      aria-label="Gerar este livro primeiro"
                      title="Gerar este primeiro"
                      disabled={alterando || (item.posicao === 1 && !item.pausado)}
                      onClick={() =>
                        alterarFilaMutation.mutate({ uuid: item.uuid, acao: 'priorizar' })
                      }
                    >
                      <ArrowUpToLine size={13} />
                    </IconButton>
                  </HStack>
                </HStack>
              )
            })}
          </VStack>
        </Box>
      )}
    </VStack>
  )
})
