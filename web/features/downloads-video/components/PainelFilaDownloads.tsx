import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { memo } from 'react'
import { useFilaDownloadsStore } from '../stores/useFilaDownloadsStore'
import { obterIconePlataforma } from '../utils/plataformaVideo'

export interface PainelFilaDownloadsProps {
  onRefetch?: () => void
}

export const PainelFilaDownloads = memo(function PainelFilaDownloads({
  onRefetch,
}: PainelFilaDownloadsProps) {
  const {
    itens,
    pausado,
    painelAberto,
    removerItem,
    limparConcluidos,
    pausar,
    retomar,
    retentarItem,
    retentarTodosErros,
    togglePainel,
  } = useFilaDownloadsStore()

  if (itens.length === 0) {
    return null
  }

  const pendentes = itens.filter((i) => i.status === 'pendente')
  const baixando = itens.find((i) => i.status === 'baixando')
  const concluidos = itens.filter((i) => i.status === 'concluido')
  const erros = itens.filter((i) => i.status === 'erro')

  const total = itens.length
  const concluidosTotal = concluidos.length
  const percentual = total > 0 ? Math.round((concluidosTotal / total) * 100) : 0

  return (
    <Box
      w="full"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={baixando ? 'cirqueira.brand.500/50' : 'border.subtle'}
      bg="bg.panel"
      shadow={baixando ? '0 10px 30px rgba(0, 186, 156, 0.1)' : 'sm'}
      overflow="hidden"
      transition="all 0.25s ease"
    >
      {/* Barra de cabeçalho da fila */}
      <Flex
        align="center"
        justify="space-between"
        p={3}
        px={4}
        bg={baixando ? 'cirqueira.brand.500/5' : 'bg.muted/30'}
        borderBottomWidth={painelAberto ? '1px' : '0px'}
        borderColor="border.subtle"
        gap={3}
        flexWrap="wrap"
      >
        <HStack gap={2.5} flex={1} minW="240px">
          <Box
            p={2}
            borderRadius="lg"
            bg={
              baixando
                ? 'cirqueira.brand.500/15'
                : pausado
                  ? 'amber.500/15'
                  : concluidosTotal === total
                    ? 'green.500/15'
                    : 'bg.muted'
            }
            color={
              baixando
                ? 'cirqueira.brand.400'
                : pausado
                  ? 'amber.400'
                  : concluidosTotal === total
                    ? 'green.400'
                    : 'fg.subtle'
            }
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
          >
            {baixando ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : pausado ? (
              <Pause size={16} />
            ) : concluidosTotal === total ? (
              <CheckCircle2 size={16} />
            ) : (
              <Sparkles size={16} />
            )}
          </Box>

          <VStack align="start" gap={0.5}>
            <HStack gap={2} align="center">
              <Text fontSize="xs" fontWeight="bold" color="fg">
                Fila de Downloads
              </Text>
              <Badge
                size="xs"
                variant={baixando ? 'solid' : 'subtle'}
                colorPalette={baixando ? 'brand' : 'gray'}
                borderRadius="md"
              >
                {concluidosTotal}/{total} concluídos
              </Badge>
              {erros.length > 0 && (
                <Badge size="xs" variant="solid" colorPalette="red" borderRadius="md">
                  {erros.length} com erro
                </Badge>
              )}
            </HStack>

            <Text fontSize="11px" color="fg.subtle" truncate maxW={{ base: '260px', sm: '420px' }}>
              {baixando
                ? `Baixando agora: ${baixando.titulo || baixando.url}`
                : pausado
                  ? 'Fila pausada temporariamente'
                  : concluidosTotal === total
                    ? 'Todos os downloads foram concluídos!'
                    : `${pendentes.length} vídeo(s) aguardando na fila`}
            </Text>
          </VStack>
        </HStack>

        {/* Barra de progresso visual */}
        <Box w={{ base: 'full', sm: '140px', md: '200px' }} display={{ base: 'none', sm: 'block' }}>
          <Progress.Root value={percentual} size="xs" colorPalette="brand">
            <Progress.Track borderRadius="full" bg="bg.muted">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          <HStack justify="space-between" mt={1} fontSize="10px" color="fg.subtle">
            <Text as="span">{percentual}%</Text>
            <Text as="span">
              {baixando ? 'Baixando...' : pausado ? 'Pausado' : 'Pronto'}
            </Text>
          </HStack>
        </Box>

        {/* Botões de Ação da Fila */}
        <HStack gap={1.5} align="center">
          {erros.length > 0 && (
            <Button
              size="xs"
              variant="subtle"
              colorPalette="red"
              onClick={() => retentarTodosErros(onRefetch)}
              h={7}
              px={2.5}
              borderRadius="md"
              fontSize="xs"
              title="Retentar todos os downloads que falharam"
            >
              <RotateCcw size={12} style={{ marginRight: '4px' }} />
              <Text as="span">Retentar ({erros.length})</Text>
            </Button>
          )}

          {pendentes.length > 0 && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => (pausado ? retomar(onRefetch) : pausar())}
              h={7}
              px={2}
              borderRadius="md"
              color="fg.muted"
              title={pausado ? 'Retomar processamento da fila' : 'Pausar fila'}
            >
              {pausado ? <Play size={13} /> : <Pause size={13} />}
              <Text as="span" ml={1} fontSize="xs" display={{ base: 'none', md: 'inline' }}>
                {pausado ? 'Retomar' : 'Pausar'}
              </Text>
            </Button>
          )}

          {concluidos.length > 0 && (
            <Button
              size="xs"
              variant="ghost"
              onClick={limparConcluidos}
              h={7}
              px={2}
              borderRadius="md"
              color="fg.subtle"
              _hover={{ color: 'fg' }}
              title="Remover vídeos já concluídos da lista da fila"
            >
              <Trash2 size={13} />
              <Text as="span" ml={1} fontSize="xs" display={{ base: 'none', md: 'inline' }}>
                Limpar Concluídos
              </Text>
            </Button>
          )}

          <IconButton
            size="xs"
            variant="ghost"
            onClick={togglePainel}
            aria-label={painelAberto ? 'Recolher fila' : 'Expandir fila'}
            h={7}
            w={7}
            borderRadius="md"
          >
            {painelAberto ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </IconButton>
        </HStack>
      </Flex>

      {/* Lista de itens da fila (quando expandida) */}
      {painelAberto && (
        <VStack
          gap={1.5}
          p={2.5}
          px={3}
          maxH="280px"
          overflowY="auto"
          align="stretch"
        >
          {itens.map((item, index) => {
            const IconePlat =
              typeof item.plataforma?.icone === 'function'
                ? item.plataforma.icone
                : obterIconePlataforma(item.plataforma?.id || item.url)
            return (
              <Flex
                key={item.id}
                align="center"
                justify="space-between"
                py={1.5}
                px={2}
                borderRadius="lg"
                bg={item.status === 'baixando' ? 'cirqueira.brand.500/8' : 'transparent'}
                borderBottomWidth={index < itens.length - 1 ? '1px' : '0px'}
                borderColor="border.subtle/40"
                gap={2.5}
                transition="all 0.15s ease"
              >
                <HStack gap={2.5} flex={1} minW={0}>
                  <Box
                    p={1.5}
                    borderRadius="md"
                    bg={
                      item.status === 'baixando'
                        ? 'cirqueira.brand.500/20'
                        : item.status === 'concluido'
                          ? 'green.500/15'
                          : item.status === 'erro'
                            ? 'red.500/15'
                            : 'bg.muted'
                    }
                    color={
                      item.status === 'baixando'
                        ? 'cirqueira.brand.400'
                        : item.status === 'concluido'
                          ? 'green.400'
                          : item.status === 'erro'
                            ? 'red.400'
                            : 'fg.subtle'
                    }
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    {item.status === 'baixando' ? (
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <IconePlat size={13} />
                    )}
                  </Box>

                  <VStack align="start" gap={0} flex={1} minW={0}>
                    <HStack gap={1.5} w="full">
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color={item.status === 'baixando' ? 'cirqueira.brand.400' : 'fg'}
                        truncate
                      >
                        {item.titulo || item.url}
                      </Text>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--chakra-colors-fg-subtle)', display: 'inline-flex', flexShrink: 0 }}
                      >
                        <ExternalLink size={11} />
                      </a>
                    </HStack>

                    <HStack gap={1.5} fontSize="10px" color="fg.subtle">
                      <Text as="span">{item.plataforma?.nome || 'Web'}</Text>
                      {item.nomeCategoria && (
                        <>
                          <Text as="span">•</Text>
                          <Text as="span" color="purple.400">
                            {item.nomeCategoria}
                          </Text>
                        </>
                      )}
                    </HStack>

                    {item.erro && (
                      <Text
                        fontSize="10px"
                        color="red.400"
                        lineClamp={3}
                        wordBreak="break-word"
                        title={item.erro}
                      >
                        {item.erro}
                      </Text>
                    )}
                  </VStack>
                </HStack>

                <HStack gap={2} flexShrink={0}>
                  {item.status === 'baixando' && (
                    <Badge size="xs" variant="solid" colorPalette="brand" borderRadius="md">
                      Baixando...
                    </Badge>
                  )}

                  {item.status === 'pendente' && (
                    <Badge size="xs" variant="subtle" colorPalette="gray" borderRadius="md">
                      #{index + 1} na fila
                    </Badge>
                  )}

                  {item.status === 'concluido' && (
                    <Badge size="xs" variant="subtle" colorPalette="green" borderRadius="md">
                      <CheckCircle2 size={10} style={{ marginRight: '3px' }} />
                      Concluído
                    </Badge>
                  )}

                  {item.status === 'erro' && (
                    <HStack gap={1}>
                      <Badge size="xs" variant="subtle" colorPalette="red" borderRadius="md">
                        <AlertCircle size={10} style={{ marginRight: '3px' }} />
                        Erro
                      </Badge>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={() => retentarItem(item.id, onRefetch)}
                        aria-label="Tentar novamente"
                        h={6}
                        w={6}
                        color="red.400"
                        title="Tentar baixar este link novamente"
                      >
                        <RotateCcw size={11} />
                      </IconButton>
                    </HStack>
                  )}

                  {item.status !== 'baixando' && (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      onClick={() => removerItem(item.id)}
                      aria-label="Remover da fila"
                      h={6}
                      w={6}
                      color="fg.subtle"
                      _hover={{ color: 'fg' }}
                    >
                      <X size={12} />
                    </IconButton>
                  )}
                </HStack>
              </Flex>
            )
          })}
        </VStack>
      )}
    </Box>
  )
})
