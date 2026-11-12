import { TemaMusica } from '@/features/musica/components'
import { LinkMusica } from '@/features/musica/components/LinkMusica'
import { AppContainer } from '@/layouts'
import { useSEO } from '@/shared/hooks'
import { Container, HStack, Heading, Text, VStack } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ComoFuncionaRevisao } from './components/ComoFuncionaRevisao'
import { ListaRevisao } from './components/ListaRevisao'
import { SeletorCategoriaRevisao } from './components/SeletorCategoriaRevisao'
import { useContagensRevisao } from './hooks'
import { ABAS_REVISAO, lerTipoRevisao, totalPendentes } from './utils'

export function RevisaoMusica() {
  useSEO({
    title: 'Revisão · Música',
    description: 'Corrija músicas, artistas, versões e canais identificados no YouTube Music.',
  })

  const [parametros, setParametros] = useSearchParams()
  const tipo = lerTipoRevisao(parametros.get('aba'))
  const { data: contagens } = useContagensRevisao()
  const abaAtual = ABAS_REVISAO.find((aba) => aba.tipo === tipo)
  const pendentes = totalPendentes(contagens)

  function trocarAba(valor: string) {
    setParametros((anteriores) => {
      const proximos = new URLSearchParams(anteriores)
      proximos.set('aba', valor)
      return proximos
    })
  }

  return (
    <TemaMusica>
      <AppContainer>
        <Container maxW="4xl" py={{ base: 4, md: 8 }} px={{ base: 3, md: 6 }}>
          <VStack align="stretch" gap={5}>
            <VStack align="start" gap={2}>
              <LinkMusica to="/musica/gerenciar">
                <HStack
                  gap={1.5}
                  fontSize="xs"
                  color="cirqueira.musica.textoSecundario"
                  _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
                >
                  <ArrowLeft size={14} />
                  <Text>Voltar para Gerenciar</Text>
                </HStack>
              </LinkMusica>
              <HStack gap={3} align="baseline" wrap="wrap">
                <Heading
                  as="h1"
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="black"
                  color="cirqueira.musica.textoPrincipal"
                >
                  Revisão do YouTube Music
                </Heading>
                {contagens && (
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color={pendentes > 0 ? 'cirqueira.musica.amarelo' : 'cirqueira.musica.verde'}
                  >
                    {pendentes > 0
                      ? `${pendentes} ${pendentes === 1 ? 'pendência' : 'pendências'}`
                      : 'Tudo em dia'}
                  </Text>
                )}
              </HStack>
              <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                O sistema tenta descobrir sozinho qual música toca em cada vídeo. Quando ele não tem
                certeza, o vídeo para aqui e espera você confirmar.
              </Text>
            </VStack>

            <ComoFuncionaRevisao />

            <SeletorCategoriaRevisao atual={tipo} contagens={contagens} onEscolher={trocarAba} />

            {abaAtual && (
              <VStack
                align="stretch"
                gap={1}
                px={4}
                py={3}
                borderRadius="10px"
                bg="cirqueira.musica.cartao"
                borderLeft="3px solid"
                borderLeftColor="cirqueira.musica.verde"
              >
                <Heading
                  as="h2"
                  fontSize="md"
                  fontWeight="bold"
                  color="cirqueira.musica.textoPrincipal"
                >
                  {abaAtual.rotulo}
                </Heading>
                <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                  {abaAtual.descricao}
                </Text>
                <Text fontSize="sm" color="cirqueira.musica.textoPrincipal">
                  <Text as="strong">O que fazer: </Text>
                  {abaAtual.instrucao}
                </Text>
              </VStack>
            )}

            <ListaRevisao key={tipo} tipo={tipo} contagens={contagens} onIrParaAba={trocarAba} />
          </VStack>
        </Container>
      </AppContainer>
    </TemaMusica>
  )
}

export const Component = RevisaoMusica

export default RevisaoMusica
