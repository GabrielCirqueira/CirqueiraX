import { TemaMusica } from '@/features/musica/components'
import { LinkMusica } from '@/features/musica/components/LinkMusica'
import { AppContainer } from '@/layouts'
import { useSEO } from '@/shared/hooks'
import { Badge, Container, HStack, Heading, Link, Tabs, Text, VStack } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ListaRevisao } from './components/ListaRevisao'
import { useContagensRevisao } from './hooks'
import { ABAS_REVISAO, lerTipoRevisao } from './utils'

export function RevisaoMusica() {
  useSEO({
    title: 'Revisão · Música',
    description: 'Corrija músicas, artistas, versões e canais identificados no YouTube Music.',
  })

  const [parametros, setParametros] = useSearchParams()
  const tipo = lerTipoRevisao(parametros.get('aba'))
  const { data: contagens } = useContagensRevisao()
  const abaAtual = ABAS_REVISAO.find((aba) => aba.tipo === tipo)

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
          <VStack align="stretch" gap={6}>
            <VStack align="start" gap={2}>
              <Link
                asChild
                fontSize="xs"
                color="cirqueira.musica.textoSecundario"
                _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
              >
                <LinkMusica to="/musica">
                  <ArrowLeft size={12} /> Voltar para Música
                </LinkMusica>
              </Link>
              <Heading
                as="h1"
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="black"
                color="cirqueira.musica.textoPrincipal"
              >
                Revisão
              </Heading>
              <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                Corrija o que a identificação automática errou. Cada correção vale para sempre e
                nada do histórico original é apagado.
              </Text>
            </VStack>

            <Tabs.Root
              value={tipo}
              onValueChange={(evento) => trocarAba(evento.value)}
              variant="line"
              size="sm"
              w="full"
            >
              <Tabs.List
                overflowX="auto"
                overflowY="hidden"
                borderColor="cirqueira.musica.cartaoElevado"
              >
                {ABAS_REVISAO.map((aba) => (
                  <Tabs.Trigger
                    key={aba.tipo}
                    value={aba.tipo}
                    flexShrink={0}
                    color="cirqueira.musica.textoSecundario"
                    _selected={{ color: 'cirqueira.musica.textoPrincipal' }}
                  >
                    <HStack gap={1.5}>
                      <Text as="span">{aba.rotulo}</Text>
                      <Badge
                        size="xs"
                        borderRadius="full"
                        bg="cirqueira.musica.cartaoElevado"
                        color={
                          (contagens?.[aba.tipo] ?? 0) > 0
                            ? 'cirqueira.musica.amarelo'
                            : 'cirqueira.musica.textoDesabilitado'
                        }
                      >
                        {contagens?.[aba.tipo] ?? '·'}
                      </Badge>
                    </HStack>
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>

            {abaAtual && (
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                {abaAtual.descricao}
              </Text>
            )}

            <ListaRevisao key={tipo} tipo={tipo} />
          </VStack>
        </Container>
      </AppContainer>
    </TemaMusica>
  )
}

export const Component = RevisaoMusica

export default RevisaoMusica
