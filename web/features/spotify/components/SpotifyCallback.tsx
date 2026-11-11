import { TemaMusica } from '@/features/musica/components/TemaMusica'
import { useMountEffect } from '@/shared/hooks'
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  Image,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { AlertTriangle, CheckCircle2, Music2, RefreshCw } from 'lucide-react'
import { memo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useConcluirAutorizacaoSpotify, useObterUrlAutorizacaoSpotify } from '../hooks'
import { extrairMensagemErroApi } from '../utils'

const codigosEnviados = new Set<string>()

export const CHAVE_RETORNO_APOS_CONEXAO = 'cirqueirax_spotify_retorno'

function lerRetornoAposConexao(): string {
  try {
    const retorno = sessionStorage.getItem(CHAVE_RETORNO_APOS_CONEXAO)
    sessionStorage.removeItem(CHAVE_RETORNO_APOS_CONEXAO)
    return retorno?.startsWith('/musica') ? retorno : '/musica'
  } catch {
    return '/musica'
  }
}

export const SpotifyCallback = memo(function SpotifyCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const code = params.get('code')
  const state = params.get('state')
  const erroParam = params.get('error')

  const concluirMutation = useConcluirAutorizacaoSpotify()
  const obterUrlMutation = useObterUrlAutorizacaoSpotify()

  useMountEffect(() => {
    if (code && state && !erroParam && !codigosEnviados.has(code)) {
      codigosEnviados.add(code)
      concluirMutation.mutate(
        { code, state },
        {
          onSuccess: () => {
            navigate(lerRetornoAposConexao(), { replace: true })
          },
        }
      )
    }
  })

  function handleTentarNovamente() {
    obterUrlMutation.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.href = url
      },
    })
  }

  function handleIrParaSpotify() {
    navigate('/musica', { replace: true })
  }

  let titulo = 'Conectando ao Spotify...'
  let descricao = 'Aguarde enquanto validamos as credenciais e sincronizamos sua conta.'
  let tipoErro: 'cancelado' | 'invalido' | 'falha' | null = null

  if (erroParam === 'access_denied') {
    tipoErro = 'cancelado'
    titulo = 'Autorização cancelada'
    descricao =
      'Você cancelou o acesso na tela do Spotify. Para visualizar sua Cápsula Sonora e métricas, autorize o aplicativo.'
  } else if (!code || !state) {
    if (!erroParam) {
      tipoErro = 'invalido'
      titulo = 'Parâmetros ausentes'
      descricao =
        'O retorno do Spotify não continha o código ou estado de autenticação necessários.'
    }
  } else if (concluirMutation.isError) {
    tipoErro = 'falha'
    titulo = 'Falha na conexão com o Spotify'
    descricao = extrairMensagemErroApi(
      concluirMutation.error,
      'Não foi possível concluir a validação. Certifique-se de que sua conta está incluída na lista de usuários autorizados no modo de desenvolvimento do Spotify Dashboard.'
    )
  }

  const isCarregando = concluirMutation.isPending && !tipoErro

  return (
    <TemaMusica>
      <Center minH="calc(100vh - 120px)" p={4}>
        <VStack
          w="full"
          maxW="md"
          bg="cirqueira.musica.cartao"
          border="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          borderRadius="8px"
          p={8}
          gap={6}
          textAlign="center"
          boxShadow="0 10px 30px rgba(0, 0, 0, 0.4)"
        >
          <Center
            boxSize={16}
            borderRadius="full"
            bg={tipoErro ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 215, 96, 0.15)'}
            color={tipoErro ? 'red.400' : 'cirqueira.musica.verde'}
          >
            {tipoErro ? (
              <AlertTriangle size={32} />
            ) : isCarregando ? (
              <Spinner size="lg" color="cirqueira.musica.verde" />
            ) : (
              <CheckCircle2 size={32} />
            )}
          </Center>

          <VStack gap={2}>
            <Heading
              as="h1"
              fontSize="2xl"
              fontWeight="bold"
              color="cirqueira.musica.textoPrincipal"
            >
              {titulo}
            </Heading>
            <Text fontSize="sm" color="cirqueira.musica.textoSecundario" lineHeight="tall">
              {descricao}
            </Text>
          </VStack>

          {tipoErro && (
            <VStack w="full" gap={3} pt={2}>
              <Button
                w="full"
                h="44px"
                bg="cirqueira.musica.verde"
                color="cirqueira.grey.950"
                fontWeight="bold"
                fontSize="sm"
                borderRadius="full"
                _hover={{ bg: 'cirqueira.musica.verdeHover', transform: 'scale(1.02)' }}
                _active={{ transform: 'scale(0.98)' }}
                transition="all 0.15s ease"
                onClick={handleTentarNovamente}
                loading={obterUrlMutation.isPending}
              >
                <HStack gap={2}>
                  <RefreshCw size={16} />
                  <Text as="span">Tentar novamente</Text>
                </HStack>
              </Button>

              <Button
                w="full"
                h="44px"
                variant="ghost"
                color="cirqueira.musica.textoSecundario"
                fontSize="sm"
                borderRadius="full"
                _hover={{
                  bg: 'cirqueira.musica.cartaoElevado',
                  color: 'cirqueira.musica.textoPrincipal',
                }}
                onClick={handleIrParaSpotify}
              >
                Voltar para o Spotify
              </Button>
            </VStack>
          )}
        </VStack>
      </Center>
    </TemaMusica>
  )
})

export const Component = SpotifyCallback

export default SpotifyCallback
