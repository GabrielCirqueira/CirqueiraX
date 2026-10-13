import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'
import { memo, useState } from 'react'
import { useConectarGoogleFotos, useUrlOAuthGoogleFotos } from '../hooks/useGoogleFotos'

export interface ModalConectarGoogleFotosProps {
  aberto: boolean
  onFechar: () => void
  isReconexao?: boolean
}

export const ModalConectarGoogleFotos = memo(function ModalConectarGoogleFotos({
  aberto,
  onFechar,
  isReconexao = false,
}: ModalConectarGoogleFotosProps) {
  const [codigoOuUrl, setCodigoOuUrl] = useState('')
  const { data: authUrl, isLoading: isLoadingUrl, isError: isErrorUrl } = useUrlOAuthGoogleFotos(aberto)
  const conectarMutation = useConectarGoogleFotos()

  if (!aberto) return null

  function handleAbrirGoogle() {
    if (authUrl) {
      window.open(authUrl, '_blank', 'noopener,noreferrer')
    }
  }

  function handleConcluir() {
    if (!codigoOuUrl.trim()) return

    conectarMutation.mutate(codigoOuUrl.trim(), {
      onSuccess: () => {
        setCodigoOuUrl('')
        onFechar()
      },
    })
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(e) => !e.open && onFechar()} placement="center">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.75)" backdropFilter="blur(8px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            color="fg"
            borderRadius="xl"
            p={0}
            maxW="2xl"
            w="full"
            shadow="2xl"
          >
            <Dialog.Header p={6} pb={4} borderBottomWidth="1px" borderColor="border.subtle">
              <HStack justify="space-between" align="center">
                <HStack gap={3}>
                  <Box
                    p={2.5}
                    borderRadius="lg"
                    bg="cirqueira.teal.500/10"
                    color="cirqueira.teal.500"
                  >
                    <Icon as={KeyRound} boxSize={5} />
                  </Box>
                  <VStack align="flex-start" gap={0.5}>
                    <HStack gap={2}>
                      <Heading size="md">
                        {isReconexao ? 'Reconectar Google Fotos' : 'Conectar Google Fotos'}
                      </Heading>
                      <Badge colorPalette={isReconexao ? 'amber' : 'teal'} variant="subtle" size="sm">
                        OAuth 2.0
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      Autorize a sincronização direta de mídias e gerenciamento de álbuns.
                    </Text>
                  </VStack>
                </HStack>
                <IconButton
                  aria-label="Fechar modal"
                  variant="ghost"
                  size="sm"
                  borderRadius="lg"
                  onClick={onFechar}
                >
                  <Icon as={X} />
                </IconButton>
              </HStack>
            </Dialog.Header>

            <Dialog.Body p={6}>
              <VStack gap={5} align="stretch">
                {isReconexao && (
                  <Box
                    p={3.5}
                    borderRadius="lg"
                    bg="cirqueira.amber.500/10"
                    border="1px solid"
                    borderColor="cirqueira.amber.500/20"
                  >
                    <HStack gap={2.5} align="flex-start">
                      <Icon as={AlertTriangle} color="cirqueira.amber.500" boxSize={4} mt={0.5} />
                      <Text fontSize="xs" color="fg.muted">
                        O token de autorização anterior expirou ou foi revogado pelo Google. Siga os dois passos abaixo para restabelecer a conexão.
                      </Text>
                    </HStack>
                  </Box>
                )}

                {/* Passo 1 */}
                <Box
                  p={4}
                  borderRadius="xl"
                  bg="bg.subtle"
                  border="1px solid"
                  borderColor="border.subtle"
                >
                  <VStack gap={3} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                        Passo 1: Conceder Permissões
                      </Text>
                      <Badge colorPalette="teal" variant="outline" size="xs">
                        Navegador
                      </Badge>
                    </HStack>

                    <Text fontSize="sm" color="fg.muted">
                      Clique no botão abaixo para abrir a página de autorização oficial do Google. Faça login na sua conta e aceite as permissões do Google Fotos.
                    </Text>

                    <Button
                      colorPalette="teal"
                      variant="solid"
                      size="sm"
                      borderRadius="lg"
                      loading={isLoadingUrl}
                      disabled={isErrorUrl || !authUrl}
                      onClick={handleAbrirGoogle}
                      alignSelf="flex-start"
                    >
                      <Icon as={ExternalLink} />
                      Abrir Autorização no Google
                    </Button>
                  </VStack>
                </Box>

                {/* Passo 2 */}
                <Box
                  p={4}
                  borderRadius="xl"
                  bg="bg.subtle"
                  border="1px solid"
                  borderColor="border.subtle"
                >
                  <VStack gap={3} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                        Passo 2: Confirmar Código de Retorno
                      </Text>
                      <Badge colorPalette="purple" variant="outline" size="xs">
                        Confirmação
                      </Badge>
                    </HStack>

                    <Text fontSize="sm" color="fg.muted">
                      Após autorizar no Google, você será redirecionado para uma página local (ex: <Text as="span" fontFamily="mono" fontSize="xs">http://localhost/?code=4/0A...</Text>). Copie o endereço completo da barra de endereços (ou apenas o código) e cole abaixo:
                    </Text>

                    <Input
                      placeholder="http://localhost/?code=4/0Acv... ou 4/0Acv..."
                      value={codigoOuUrl}
                      onChange={(e) => setCodigoOuUrl(e.target.value)}
                      borderRadius="lg"
                      bg="bg.panel"
                      size="sm"
                      fontFamily="mono"
                      fontSize="xs"
                    />
                  </VStack>
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer p={6} pt={4} borderTopWidth="1px" borderColor="border.subtle">
              <HStack justify="flex-end" gap={3} w="full">
                <Button variant="ghost" size="sm" borderRadius="lg" onClick={onFechar}>
                  Cancelar
                </Button>
                <Button
                  colorPalette="teal"
                  size="sm"
                  borderRadius="lg"
                  loading={conectarMutation.isPending}
                  disabled={!codigoOuUrl.trim()}
                  onClick={handleConcluir}
                >
                  <Icon as={CheckCircle2} />
                  Concluir e Salvar Conexão
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
