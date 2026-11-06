import {
  Avatar,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  IconButton,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { AlertCircle, CheckCircle2, LogOut, Music, RefreshCw, Upload } from 'lucide-react'
import { memo, useState } from 'react'
import {
  useDesconectarSpotify,
  useObterUrlAutorizacaoSpotify,
  useSincronizarSpotify,
  useStatusSpotify,
} from '../hooks'
import { formatarDataHoraPtBr } from '../utils'
import { ModalConfirmarDesconexao } from './ModalConfirmarDesconexao'

export interface PainelConexaoSpotifyProps {
  onAbrirModalImportacao?: () => void
}

export const PainelConexaoSpotify = memo(function PainelConexaoSpotify({
  onAbrirModalImportacao,
}: PainelConexaoSpotifyProps) {
  const { data: status, isLoading } = useStatusSpotify()
  const obterUrlMutation = useObterUrlAutorizacaoSpotify()
  const desconectarMutation = useDesconectarSpotify()
  const sincronizarMutation = useSincronizarSpotify()
  const [modalDesconectarAberto, setModalDesconectarAberto] = useState(false)

  function handleVincularOuReconectar() {
    obterUrlMutation.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.href = url
      },
    })
  }

  function handleConfirmarDesconexao() {
    desconectarMutation.mutate(undefined, {
      onSuccess: () => {
        setModalDesconectarAberto(false)
      },
    })
  }

  if (isLoading) {
    return (
      <Box
        p={6}
        bg="cirqueira.spotify.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="cirqueira.spotify.cartaoElevado"
      >
        <HStack gap={4}>
          <Spinner size="sm" color="cirqueira.spotify.verde" />
          <Text fontSize="sm" color="cirqueira.spotify.textoSecundario">
            Verificando conexão com o Spotify...
          </Text>
        </HStack>
      </Box>
    )
  }

  const isConectada = status?.conectada && status.status === 'conectada'
  const isReconectar = status?.status === 'reconectar' || status?.status === 'revogada'

  return (
    <>
      <Box
        p={{ base: 4, md: 6 }}
        bg="cirqueira.spotify.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="cirqueira.spotify.cartaoElevado"
        transition="all 0.2s ease"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap={4}
        >
          <HStack gap={4} align="center">
            {isConectada ? (
              <Box position="relative">
                <Avatar.Root
                  size="lg"
                  shape="full"
                  border="2px solid"
                  borderColor="cirqueira.spotify.verde"
                >
                  {status.urlFoto && (
                    <Avatar.Image src={status.urlFoto} alt={status.nomeExibicao ?? 'Spotify'} />
                  )}
                  <Avatar.Fallback
                    name={status.nomeExibicao ?? 'Spotify'}
                    bg="cirqueira.spotify.cartaoElevado"
                    color="cirqueira.spotify.verde"
                  />
                </Avatar.Root>
                <Center
                  position="absolute"
                  bottom={-1}
                  right={-1}
                  boxSize={5}
                  borderRadius="full"
                  bg="cirqueira.spotify.verde"
                  color="cirqueira.grey.950"
                >
                  <CheckCircle2 size={12} />
                </Center>
              </Box>
            ) : isReconectar ? (
              <Center
                boxSize={12}
                borderRadius="full"
                bg="rgba(245, 158, 11, 0.15)"
                color="yellow.400"
              >
                <AlertCircle size={24} />
              </Center>
            ) : (
              <Center
                boxSize={12}
                borderRadius="full"
                bg="cirqueira.spotify.cartaoElevado"
                color="cirqueira.spotify.verde"
              >
                <Music size={24} />
              </Center>
            )}

            <VStack align="flex-start" gap={0.5}>
              <HStack gap={2}>
                <Heading
                  as="h2"
                  fontSize="md"
                  fontWeight="bold"
                  color="cirqueira.spotify.textoPrincipal"
                >
                  {isConectada
                    ? (status.nomeExibicao ?? 'Conta Spotify Conectada')
                    : isReconectar
                      ? 'Reconexão Necessária'
                      : 'Conecte sua conta do Spotify'}
                </Heading>
                {status?.coletaParada && (
                  <Box
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    bg="rgba(239, 68, 68, 0.2)"
                    color="red.400"
                    fontSize="2xs"
                    fontWeight="bold"
                  >
                    Coleta parada
                  </Box>
                )}
              </HStack>

              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                {isConectada
                  ? `Sincronizado desde ${formatarDataHoraPtBr(status.conectadoEm)}${
                      status.ultimaColetaEm
                        ? ` • Última coleta: ${formatarDataHoraPtBr(status.ultimaColetaEm)}`
                        : ''
                    }`
                  : isReconectar
                    ? 'O token de autorização expirou ou foi revogado. Reconecte para continuar a coleta automática.'
                    : 'Acompanhe seu tempo ouvido, rankings e acesse a sua Cápsula Sonora mensal.'}
              </Text>
            </VStack>
          </HStack>

          <Flex
            wrap="wrap"
            align="center"
            gap={3}
            w={{ base: 'full', md: 'auto' }}
            justify={{ base: 'flex-start', md: 'flex-end' }}
          >
            {onAbrirModalImportacao && (
              <Button
                variant="outline"
                size="sm"
                borderRadius="full"
                borderColor="cirqueira.spotify.cartaoElevado"
                color="cirqueira.spotify.textoPrincipal"
                _hover={{
                  bg: 'cirqueira.spotify.cartaoElevado',
                  borderColor: 'cirqueira.spotify.textoSecundario',
                }}
                onClick={onAbrirModalImportacao}
                h="38px"
                px={4}
              >
                <HStack gap={2}>
                  <Upload size={14} />
                  <Text as="span">Importar histórico</Text>
                </HStack>
              </Button>
            )}

            {isConectada && (
              <IconButton
                variant="ghost"
                size="sm"
                borderRadius="full"
                color="cirqueira.spotify.textoSecundario"
                _hover={{ color: 'cirqueira.spotify.verde', bg: 'cirqueira.spotify.cartaoElevado' }}
                onClick={() => sincronizarMutation.mutate()}
                disabled={sincronizarMutation.isPending}
                aria-label="Sincronizar agora"
                title="Sincronizar agora (faz a mesma coleta que roda a cada 30 minutos)"
                h="38px"
                w="38px"
              >
                <Box
                  display="flex"
                  animation={sincronizarMutation.isPending ? 'spin 1s linear infinite' : undefined}
                >
                  <RefreshCw size={15} />
                </Box>
              </IconButton>
            )}

            {isConectada ? (
              <Button
                variant="ghost"
                size="sm"
                borderRadius="full"
                color="cirqueira.spotify.textoSecundario"
                _hover={{ color: 'red.400', bg: 'cirqueira.spotify.cartaoElevado' }}
                onClick={() => setModalDesconectarAberto(true)}
                h="38px"
                px={4}
              >
                <HStack gap={2}>
                  <LogOut size={14} />
                  <Text as="span">Desconectar</Text>
                </HStack>
              </Button>
            ) : isReconectar ? (
              <Button
                bg="cirqueira.spotify.verde"
                color="cirqueira.grey.950"
                size="sm"
                borderRadius="full"
                fontWeight="bold"
                _hover={{ bg: 'cirqueira.spotify.verdeHover', transform: 'scale(1.02)' }}
                _active={{ transform: 'scale(0.98)' }}
                transition="all 0.15s ease"
                onClick={handleVincularOuReconectar}
                loading={obterUrlMutation.isPending}
                h="38px"
                px={5}
                boxShadow="0 4px 14px rgba(30, 215, 96, 0.35)"
              >
                <HStack gap={2}>
                  <RefreshCw size={14} />
                  <Text as="span">Reconectar Spotify</Text>
                </HStack>
              </Button>
            ) : (
              <Button
                bg="cirqueira.spotify.verde"
                color="cirqueira.grey.950"
                size="sm"
                borderRadius="full"
                fontWeight="bold"
                _hover={{ bg: 'cirqueira.spotify.verdeHover', transform: 'scale(1.02)' }}
                _active={{ transform: 'scale(0.98)' }}
                transition="all 0.15s ease"
                onClick={handleVincularOuReconectar}
                loading={obterUrlMutation.isPending}
                h="38px"
                px={5}
                boxShadow="0 4px 14px rgba(30, 215, 96, 0.35)"
              >
                <HStack gap={2}>
                  <Music size={14} />
                  <Text as="span">Vincular ao Spotify</Text>
                </HStack>
              </Button>
            )}
          </Flex>
        </Flex>
      </Box>

      <ModalConfirmarDesconexao
        aberto={modalDesconectarAberto}
        carregando={desconectarMutation.isPending}
        onConfirmar={handleConfirmarDesconexao}
        onFechar={() => setModalDesconectarAberto(false)}
      />
    </>
  )
})
