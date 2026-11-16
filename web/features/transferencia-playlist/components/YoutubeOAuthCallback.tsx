import { TemaMusica } from '@/features/musica/components/TemaMusica'
import { useMountEffect } from '@/shared/hooks'
import { Button, Center, HStack, Heading, Spinner, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { memo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useConcluirYoutubeOAuth, useObterUrlYoutubeOAuth } from '../hooks'
import { extrairMensagemErroApi, lerRetornoYoutubeOAuth, salvarRetornoYoutubeOAuth } from '../utils'

const codigosEnviados = new Set<string>()

export const YoutubeOAuthCallback = memo(function YoutubeOAuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const code = params.get('code')
  const erroParam = params.get('error')

  const concluirMutation = useConcluirYoutubeOAuth()
  const obterUrlMutation = useObterUrlYoutubeOAuth()

  useMountEffect(() => {
    if (code && !erroParam && !codigosEnviados.has(code)) {
      codigosEnviados.add(code)
      concluirMutation.mutate(code, {
        onSuccess: () => {
          navigate(lerRetornoYoutubeOAuth(), { replace: true })
        },
      })
    }
  })

  function handleTentarNovamente() {
    salvarRetornoYoutubeOAuth()
    obterUrlMutation.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.href = url
      },
    })
  }

  function handleIrParaGerenciar() {
    navigate('/musica/gerenciar', { replace: true })
  }

  let titulo = 'Conectando conta Google...'
  let descricao = 'Aguarde enquanto validamos a autorização para playlists do YouTube Music.'
  let tipoErro: 'cancelado' | 'invalido' | 'falha' | null = null

  if (erroParam === 'access_denied') {
    tipoErro = 'cancelado'
    titulo = 'Autorização cancelada'
    descricao =
      'Você cancelou o acesso na tela do Google. Autorize a conta para transferir playlists.'
  } else if (!code) {
    if (!erroParam) {
      tipoErro = 'invalido'
      titulo = 'Parâmetros ausentes'
      descricao = 'O retorno do Google não continha o código de autenticação necessário.'
    }
  } else if (concluirMutation.isError) {
    tipoErro = 'falha'
    titulo = 'Falha na conexão com o Google'
    descricao = extrairMensagemErroApi(
      concluirMutation.error,
      'Não foi possível concluir a autorização da conta Google.'
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
            bg={tipoErro ? 'cirqueira.red.950' : 'cirqueira.musica.cartaoElevado'}
            color={tipoErro ? 'cirqueira.red.400' : 'cirqueira.musica.verde'}
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
                onClick={handleIrParaGerenciar}
              >
                Voltar para Gerenciar
              </Button>
            </VStack>
          )}
        </VStack>
      </Center>
    </TemaMusica>
  )
})

export const Component = YoutubeOAuthCallback

export default YoutubeOAuthCallback
