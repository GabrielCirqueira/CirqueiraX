import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Check, CheckCircle2, CloudOff, Copy, RefreshCw, ShieldCheck, Terminal } from 'lucide-react'
import { type ReactNode, memo, useState } from 'react'
import { useStatusGoogleFotos } from '../hooks/useGoogleFotos'

export interface GateConexaoGoogleProps {
  children: ReactNode
}

export const GateConexaoGoogle = memo(function GateConexaoGoogle({
  children,
}: GateConexaoGoogleProps) {
  const { data: status, isLoading, isError, refetch, isRefetching } = useStatusGoogleFotos()
  const [copiado, setCopiado] = useState(false)

  const comandoCLI = 'make google-fotos-autorizar'

  function handleCopiarComando() {
    navigator.clipboard.writeText(comandoCLI).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  function formatarDataConexao(dataIso: string | null): string {
    if (!dataIso) return ''
    try {
      const d = new Date(dataIso)
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dataIso
    }
  }

  if (isLoading) {
    return (
      <Flex w="full" minH="400px" align="center" justify="center" p={8}>
        <VStack gap={4}>
          <Spinner size="xl" color="teal.500" />
          <Text fontSize="sm" color="fg.muted">
            Verificando status de conexão com o Google Fotos...
          </Text>
        </VStack>
      </Flex>
    )
  }

  if (isError || !status?.conectado) {
    return (
      <Flex w="full" minH="500px" align="center" justify="center" py={12} px={4}>
        <Card.Root maxW="2xl" w="full" shadow="lg" border="1px solid" borderColor="border.subtle">
          <Card.Header>
            <VStack gap={3} align="center" textAlign="center">
              <Box p={3} borderRadius="full" bg="amber.500/10" color="amber.500">
                <Icon as={CloudOff} boxSize={8} />
              </Box>
              <VStack gap={1}>
                <Heading size="lg">Conexão com o Google Fotos Necessária</Heading>
                <Text fontSize="sm" color="fg.muted">
                  Para visualizar, gerenciar e vincular álbuns, você precisa autorizar a conta
                  Google no servidor do CirqueiraX.
                </Text>
              </VStack>
            </VStack>
          </Card.Header>

          <Card.Body>
            <VStack gap={6} align="stretch">
              <Box
                p={4}
                borderRadius="xl"
                bg="bg.subtle"
                border="1px solid"
                borderColor="border.subtle"
              >
                <VStack gap={3} align="stretch">
                  <HStack gap={2}>
                    <Icon as={Terminal} color="teal.500" />
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Passo a Passo de Autorização
                    </Text>
                  </HStack>

                  <Text fontSize="sm" color="fg.muted">
                    1. Execute o comando abaixo no terminal da sua máquina ou servidor:
                  </Text>

                  <HStack
                    justify="space-between"
                    p={3}
                    borderRadius="lg"
                    bg="bg.muted"
                    border="1px solid"
                    borderColor="border.subtle"
                  >
                    <Code fontSize="sm" colorScheme="teal" bg="transparent">
                      {comandoCLI}
                    </Code>
                    <IconButton
                      aria-label="Copiar comando"
                      size="xs"
                      variant="ghost"
                      onClick={handleCopiarComando}
                    >
                      <Icon
                        as={copiado ? Check : Copy}
                        color={copiado ? 'green.500' : 'fg.muted'}
                      />
                    </IconButton>
                  </HStack>

                  <Text fontSize="sm" color="fg.muted">
                    2. Abra a URL exibida no navegador, faça login na sua conta Google e conceda as
                    permissões de Fotos.
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    3. Ao ser redirecionado para a página local, copie a URL inteira da barra de
                    endereços e cole no terminal para concluir.
                  </Text>
                </VStack>
              </Box>

              <HStack justify="center">
                <Button
                  colorPalette="teal"
                  size="md"
                  onClick={() => refetch()}
                  loading={isRefetching}
                >
                  <Icon as={RefreshCw} />
                  Verificar Conexão Novamente
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Flex>
    )
  }

  return (
    <VStack w="full" gap={6} align="stretch">
      <Box
        p={4}
        borderRadius="xl"
        bg="bg.subtle"
        border="1px solid"
        borderColor="teal.500/20"
        shadow="xs"
      >
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <HStack gap={3}>
            <Box p={2.5} borderRadius="lg" bg="teal.500/10" color="teal.500">
              <Icon as={ShieldCheck} boxSize={5} />
            </Box>
            <VStack align="flex-start" gap={0.5}>
              <HStack gap={2}>
                <Text fontWeight="semibold" fontSize="sm">
                  Google Fotos Conectado
                </Text>
                <Badge colorPalette="green" variant="subtle" size="sm">
                  <Icon as={CheckCircle2} />
                  Ativo
                </Badge>
              </HStack>
              <HStack gap={2} fontSize="xs" color="fg.muted">
                {status.email && <Text fontWeight="medium">{status.email}</Text>}
                {status.conectadoEm && (
                  <>
                    <Text>•</Text>
                    <Text>Autorizado em {formatarDataConexao(status.conectadoEm)}</Text>
                  </>
                )}
              </HStack>
            </VStack>
          </HStack>

          <HStack gap={2}>
            <IconButton
              aria-label="Atualizar status"
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              loading={isRefetching}
            >
              <Icon as={RefreshCw} />
            </IconButton>
          </HStack>
        </HStack>
      </Box>

      {children}
    </VStack>
  )
})
