import { formatarDataHora } from '@/shared/utils/formatarData'
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
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CloudOff,
  Copy,
  KeyRound,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react'
import { type ReactNode, memo, useState } from 'react'
import { useDesconectarGoogleFotos, useStatusGoogleFotos } from '../hooks/useGoogleFotos'
import { ModalConectarGoogleFotos } from './ModalConectarGoogleFotos'

export interface GateConexaoGoogleProps {
  children: ReactNode
}

export const GateConexaoGoogle = memo(function GateConexaoGoogle({
  children,
}: GateConexaoGoogleProps) {
  const { data: status, isLoading, isError, refetch, isRefetching } = useStatusGoogleFotos()
  const desconectarMutation = useDesconectarGoogleFotos()
  const [modalConectarAberto, setModalConectarAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const comandoCLI = 'make google-fotos-autorizar'

  function handleCopiarComando() {
    navigator.clipboard.writeText(comandoCLI).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  function handleDesconectar() {
    if (window.confirm('Tem certeza que deseja desconectar o Google Fotos do CirqueiraX?')) {
      desconectarMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <Flex w="full" minH="400px" align="center" justify="center" p={8}>
        <VStack gap={4}>
          <Spinner size="xl" color="cirqueira.teal.500" />
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
        <Card.Root
          maxW="2xl"
          w="full"
          borderRadius="xl"
          shadow="lg"
          border="1px solid"
          borderColor="border.subtle"
        >
          <Card.Header>
            <VStack gap={3} align="center" textAlign="center">
              <Box
                p={3}
                borderRadius="full"
                bg="cirqueira.amber.500/10"
                color="cirqueira.amber.500"
              >
                <Icon as={CloudOff} boxSize={8} />
              </Box>
              <VStack gap={1}>
                <Heading size="lg">Conexão com o Google Fotos Necessária</Heading>
                <Text fontSize="sm" color="fg.muted">
                  Para visualizar, gerenciar e vincular álbuns, você precisa autorizar a conta
                  Google no CirqueiraX.
                </Text>
              </VStack>
            </VStack>
          </Card.Header>

          <Card.Body>
            <VStack gap={6} align="stretch">
              <HStack justify="center">
                <Button
                  colorPalette="teal"
                  size="lg"
                  borderRadius="xl"
                  onClick={() => setModalConectarAberto(true)}
                  shadow="md"
                >
                  <Icon as={KeyRound} />
                  Conectar Conta Google Fotos
                </Button>
              </HStack>

              <Box
                p={4}
                borderRadius="xl"
                bg="bg.subtle"
                border="1px solid"
                borderColor="border.subtle"
              >
                <VStack gap={3} align="stretch">
                  <HStack gap={2}>
                    <Icon as={Terminal} color="cirqueira.teal.500" />
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Ou Autorize via Terminal / Servidor
                    </Text>
                  </HStack>

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
                      borderRadius="lg"
                      onClick={handleCopiarComando}
                    >
                      <Icon
                        as={copiado ? Check : Copy}
                        color={copiado ? 'cirqueira.green.500' : 'fg.muted'}
                      />
                    </IconButton>
                  </HStack>
                </VStack>
              </Box>

              <HStack justify="center">
                <Button
                  variant="ghost"
                  size="sm"
                  borderRadius="lg"
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

        <ModalConectarGoogleFotos
          aberto={modalConectarAberto}
          onFechar={() => setModalConectarAberto(false)}
          isReconexao={false}
        />
      </Flex>
    )
  }

  const tokenExpirado = Boolean(status.tokenExpirado)

  return (
    <VStack w="full" gap={6} align="stretch">
      <Box
        p={4}
        borderRadius="xl"
        bg={tokenExpirado ? 'cirqueira.amber.500/5' : 'bg.subtle'}
        border="1px solid"
        borderColor={tokenExpirado ? 'cirqueira.amber.500/30' : 'cirqueira.teal.500/20'}
        shadow="xs"
      >
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack gap={3}>
              <Box
                p={2.5}
                borderRadius="lg"
                bg={tokenExpirado ? 'cirqueira.amber.500/10' : 'cirqueira.teal.500/10'}
                color={tokenExpirado ? 'cirqueira.amber.500' : 'cirqueira.teal.500'}
              >
                <Icon as={tokenExpirado ? ShieldAlert : ShieldCheck} boxSize={5} />
              </Box>
              <VStack align="flex-start" gap={0.5}>
                <HStack gap={2}>
                  <Text fontWeight="semibold" fontSize="sm">
                    Google Fotos Conectado
                  </Text>
                  {tokenExpirado ? (
                    <Badge colorPalette="amber" variant="subtle" size="sm">
                      <Icon as={AlertTriangle} />
                      Token Expirado
                    </Badge>
                  ) : (
                    <Badge colorPalette="green" variant="subtle" size="sm">
                      <Icon as={CheckCircle2} />
                      Ativo
                    </Badge>
                  )}
                </HStack>
                <HStack gap={2} fontSize="xs" color="fg.muted">
                  {status.email && <Text fontWeight="medium">{status.email}</Text>}
                  {status.conectadoEm && (
                    <>
                      <Text>•</Text>
                      <Text>Autorizado em {formatarDataHora(status.conectadoEm)}</Text>
                    </>
                  )}
                </HStack>
              </VStack>
            </HStack>

            <HStack gap={2}>
              <Button
                size="sm"
                colorPalette={tokenExpirado ? 'amber' : 'teal'}
                variant={tokenExpirado ? 'solid' : 'outline'}
                borderRadius="lg"
                onClick={() => setModalConectarAberto(true)}
              >
                <Icon as={tokenExpirado ? AlertTriangle : KeyRound} />
                {tokenExpirado ? 'Reconectar Conta' : 'Reconectar'}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                colorPalette="red"
                borderRadius="lg"
                loading={desconectarMutation.isPending}
                onClick={handleDesconectar}
              >
                <Icon as={LogOut} />
                Desconectar
              </Button>

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

          {tokenExpirado && (
            <HStack
              gap={2.5}
              p={3}
              borderRadius="lg"
              bg="cirqueira.amber.500/10"
              border="1px solid"
              borderColor="cirqueira.amber.500/20"
            >
              <Icon as={AlertTriangle} color="cirqueira.amber.500" boxSize={4} flexShrink={0} />
              <Text fontSize="xs" color="fg.muted">
                O token OAuth da sua conta Google expirou ou foi revogado. O envio de mídias para os álbuns está pausado. Clique em <Text as="span" fontWeight="bold" color="fg">Reconectar Conta</Text> para renovar a autorização em poucos segundos.
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>

      <ModalConectarGoogleFotos
        aberto={modalConectarAberto}
        onFechar={() => setModalConectarAberto(false)}
        isReconexao={tokenExpirado || Boolean(status.conectado)}
      />

      {children}
    </VStack>
  )
})
